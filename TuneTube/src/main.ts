// ===== 画面の制御（起動・一覧・再生・設定） =====
import {
  DAILY_SEARCH_CALLS, DAILY_UNITS, EXAM_MAX_MINUTES, EXAM_MIN_MINUTES, SEEK_SEC, SENIOR_MAX_ITEMS, VOLUME_STEP,
} from './config.js';
import { channelVideos, refreshChannels, resolveChannel, searchVideos } from './api.js';
import { ExamTimer } from './exam.js';
import { filterVideos } from './filters.js';
import { fmtDate, fmtMinutes } from './format.js';
import { PIN_PATTERN, hashPin } from './pin.js';
import { createPlayer, playerErrorText, type PlayerHandle } from './player.js';
import { setupPwa } from './pwa.js';
import { getQuota } from './quota.js';
import { hasConsent, loadSettings, saveConsent, saveSettings } from './settings.js';
import { clearCache, deleteAllData, purgeExpiredCache } from './storage.js';
import type { Mode, Settings, Video } from './types.js';
import { $, el, emptyState, renderVideoCards } from './ui.js';

const MODE_LABEL: Record<Mode, string> = { standard: '標準モード', senior: 'シニアモード', exam: '受験生モード' };

let settings: Settings = loadSettings();
let draft: Settings = structuredClone(settings);
let view: 'channels' | 'search' = 'channels';
let channelFilter = 'all';
let lastSearch: Video[] | null = null;
let feedToken = 0;

let current: Video | null = null;
let player: PlayerHandle | null = null;
let exam: ExamTimer | null = null;
let examAcknowledged = false;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function setStatus(text: string): void { $('#status').textContent = text; }
function setNotice(text: string): void {
  const n = $('#notice');
  n.textContent = text;
  n.hidden = !text;
}

// ===== モード =====
function searchAllowed(): boolean {
  return settings.mode === 'standard' || (settings.mode === 'senior' && settings.seniorSearch);
}

function applyMode(): void {
  const b = document.body;
  b.classList.remove('mode-standard', 'mode-senior', 'mode-exam');
  b.classList.add(`mode-${settings.mode}`);
  $('#modeBadge').textContent = MODE_LABEL[settings.mode];
  if (!searchAllowed()) view = 'channels';
  if (channelFilter !== 'all' && !settings.channels.some((c) => c.id === channelFilter)) channelFilter = 'all';
  const tabs = $('#tabs');
  tabs.hidden = !searchAllowed();
  for (const t of tabs.querySelectorAll<HTMLButtonElement>('button[data-view]')) {
    t.setAttribute('aria-selected', String(t.dataset.view === view));
  }
  renderHome();
}

// ===== 一覧 =====
function renderHome(): void {
  $('#searchForm').hidden = view !== 'search';
  $('#chips').hidden = view !== 'channels';
  if (view === 'channels') void loadChannelFeed();
  else showSearchResults();
}

function renderChips(): void {
  const box = $('#chips');
  box.replaceChildren();
  if (settings.channels.length < 2) return;
  const chip = (id: string, label: string) => {
    const b = el('button', { type: 'button', className: 'chip' }, label);
    b.setAttribute('aria-pressed', String(channelFilter === id));
    b.addEventListener('click', () => { channelFilter = id; void loadChannelFeed(); });
    return b;
  };
  box.append(chip('all', 'すべて'), ...settings.channels.map((c) => chip(c.id, c.title)));
}

async function loadChannelFeed(): Promise<void> {
  const token = ++feedToken;
  const box = $('#results');
  box.replaceChildren();
  setNotice('');
  renderChips();
  if (!settings.channels.length) {
    setStatus('');
    box.append(emptyState('まだチャンネルが登録されていません．',
      'ご家族の方へ：「設定」から，見せたいチャンネルを登録してください．', '設定を開く', () => void openSettings()));
    return;
  }
  if (!settings.apiKey) {
    setStatus('');
    box.append(emptyState('APIキーが設定されていません．', '「設定」からAPIキーを登録してください．', '設定を開く', () => void openSettings()));
    return;
  }
  setStatus('読み込み中…');

  // 保存しているチャンネル名・アイコンを定期的に更新する
  try {
    const refreshed = await refreshChannels(settings.channels, settings.apiKey);
    if (refreshed) { settings.channels = refreshed; saveSettings(settings); renderChips(); }
  } catch { /* 一覧表示は続ける */ }

  const targets = channelFilter === 'all' ? settings.channels : settings.channels.filter((c) => c.id === channelFilter);
  const results = await Promise.allSettled(targets.map((c) => channelVideos(c, settings.apiKey)));
  if (token !== feedToken) return;
  const videos: Video[] = [];
  const errors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') videos.push(...r.value);
    else errors.push(`「${targets[i]!.title}」を読み込めませんでした：${errMsg(r.reason)}`);
  });
  videos.sort((a, b) => b.published.localeCompare(a.published));
  showVideos(videos, errors);
}

function showVideos(videos: Video[], notes: string[] = []): void {
  const { kept, removed } = filterVideos(videos, settings.hideShorts);
  const list = settings.mode === 'senior' ? kept.slice(0, SENIOR_MAX_ITEMS) : kept;
  const msgs = [...notes];
  if (removed) msgs.push(`ショートの可能性がある動画を ${removed} 件非表示にしました（3分以下の動画などを長さで判定しているため，普通の短い動画も含まれます．設定で表示できます）．`);
  setNotice(msgs.join('\n'));

  const box = $('#results');
  box.replaceChildren();
  if (!list.length) {
    setStatus('');
    box.append(emptyState('表示できる動画がありません．', view === 'search' ? '別の言葉で検索してみてください．' : ''));
    return;
  }
  setStatus(settings.mode === 'senior' ? '見たい動画を押してください．' : `${list.length} 件の動画`);
  renderVideoCards(box, list, { mode: settings.mode, onSelect: (v) => void openVideo(v) });
}

async function runSearch(q: string): Promise<void> {
  if (!settings.apiKey) { void openSettings(); return; }
  const order = $<HTMLSelectElement>('#order').value;
  const period = $<HTMLSelectElement>('#period').value;
  setStatus('検索中…');
  setNotice('');
  $('#results').replaceChildren();
  try {
    lastSearch = await searchVideos(q, order, period, settings.apiKey);
    showVideos(lastSearch);
  } catch (e) {
    setStatus(errMsg(e));
  }
}

function showSearchResults(): void {
  if (lastSearch) { showVideos(lastSearch); return; }
  $('#results').replaceChildren();
  setNotice('');
  setStatus('キーワードを入れて「検索」を押してください．');
}

// ===== 再生 =====
function showPlayerMessage(text: string): void {
  const box = $('#playerMsg');
  box.replaceChildren(el('p', {}, text));
  if (current) {
    box.append(el('a', {
      href: `https://www.youtube.com/watch?v=${encodeURIComponent(current.id)}`,
      target: '_blank', rel: 'noopener', className: 'button-link',
    }, 'YouTubeで開く'));
  }
  box.hidden = false;
}

function updateExamBar(used: number, limit: number): void {
  $('#examText').textContent = `今日の視聴 ${fmtMinutes(used)} ／ 目標 ${fmtMinutes(limit)}`;
  const bar = $<HTMLProgressElement>('#examProgress');
  bar.max = limit;
  bar.value = Math.min(used, limit);
}

function showExamBanner(): void {
  if (examAcknowledged) return;
  player?.pause();
  $('#examBanner').hidden = false;
}

function onPlayerState(playing: boolean): void {
  $('#btnPlay').textContent = playing ? '⏸ 一時停止' : '▶ 再生';
  if (!exam) return;
  exam.setPlaying(playing);
  if (playing && exam.used() >= exam.limitSec) showExamBanner();
}

function closePlayerOnly(): void {
  exam?.stop();
  exam = null;
  player?.destroy();
  player = null;
}

async function openVideo(v: Video): Promise<void> {
  closePlayerOnly();
  current = v;
  examAcknowledged = false;
  $('#homeView').hidden = true;
  $('#playerView').hidden = false;
  $('#nowTitle').textContent = v.title;
  $('#nowSub').textContent = `${v.channel}・${fmtDate(v.published)}`;
  $('#playerMsg').hidden = true;
  $('#examBanner').hidden = true;
  $('#btnPlay').textContent = '▶ 再生';
  $('#volText').textContent = '';
  window.scrollTo(0, 0);

  const frame = $('#frame');
  $('#bigControls').hidden = !v.embeddable;
  if (!v.embeddable) {
    frame.hidden = true;
    showPlayerMessage('この動画は投稿者の設定により，このアプリでは再生できません．');
    return;
  }
  frame.hidden = false;

  if (settings.mode === 'exam') {
    exam = new ExamTimer(settings.examMinutes * 60, updateExamBar, showExamBanner);
    updateExamBar(exam.used(), exam.limitSec);
  }

  try {
    const handle = await createPlayer(frame, v.id, {
      disableKeyboard: settings.mode !== 'standard',
      onState: onPlayerState,
      onError: (code) => showPlayerMessage(playerErrorText(code)),
    });
    if (current !== v) { handle.destroy(); return; } // 読み込み中に戻った場合
    player = handle;
  } catch {
    showPlayerMessage('プレーヤーを読み込めませんでした．通信状況を確認してください．');
  }
}

function closeVideo(): void {
  closePlayerOnly();
  current = null;
  $('#playerView').hidden = true;
  $('#homeView').hidden = false;
}

// ===== PIN =====
function askPin(): Promise<boolean> {
  return new Promise((resolve) => {
    const dlg = $<HTMLDialogElement>('#pinDialog');
    const input = $<HTMLInputElement>('#pinInput');
    const err = $('#pinError');
    input.value = '';
    err.textContent = '';
    const finish = (ok: boolean) => {
      dlg.removeEventListener('submit', onSubmit);
      dlg.removeEventListener('cancel', onCancel);
      dlg.close();
      resolve(ok);
    };
    const onSubmit = async (e: Event) => {
      e.preventDefault();
      const submitter = (e as SubmitEvent).submitter as HTMLButtonElement | null;
      if (submitter?.value === 'cancel') { finish(false); return; }
      if ((await hashPin(input.value)) === settings.pinHash) finish(true);
      else { err.textContent = 'PINが違います．'; input.select(); }
    };
    const onCancel = () => finish(false);
    dlg.addEventListener('submit', onSubmit);
    dlg.addEventListener('cancel', onCancel);
    dlg.showModal();
    input.focus();
  });
}

// ===== 設定 =====
function renderChannelList(): void {
  const ul = $('#channelList');
  ul.replaceChildren();
  if (!draft.channels.length) {
    ul.append(el('li', { className: 'hint' }, 'まだ登録されていません．'));
    return;
  }
  draft.channels.forEach((c, i) => {
    const del = el('button', { type: 'button', className: 'small' }, '削除');
    del.addEventListener('click', () => { draft.channels.splice(i, 1); renderChannelList(); });
    ul.append(el('li', {}, el('img', { src: c.thumb, alt: '' }), el('span', {}, c.title), del));
  });
}

function renderPinStatus(): void {
  $('#pinStatus').textContent = draft.pinHash ? 'PINで設定画面をロックしています．' : 'ロックしていません．';
}

function renderQuota(): void {
  const q = getQuota();
  $('#quota').textContent = `この端末からの今日の使用量（目安）：検索 ${q.searches} / ${DAILY_SEARCH_CALLS} 回，その他 ${q.units} / ${DAILY_UNITS} ユニット．枠はプロジェクト全体で共有されます．`;
}

async function openSettings(): Promise<void> {
  if (settings.pinHash && !(await askPin())) return;
  draft = structuredClone(settings);
  $<HTMLInputElement>('#apiKey').value = draft.apiKey;
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="mode"]')) r.checked = r.value === draft.mode;
  $<HTMLInputElement>('#optHideShorts').checked = draft.hideShorts;
  $<HTMLInputElement>('#optSeniorSearch').checked = draft.seniorSearch;
  $<HTMLInputElement>('#examMinutes').value = String(draft.examMinutes);
  $<HTMLInputElement>('#channelInput').value = '';
  $<HTMLInputElement>('#pinNew').value = '';
  $('#channelMsg').textContent = '';
  renderChannelList();
  renderPinStatus();
  renderQuota();
  $<HTMLDialogElement>('#settingsDialog').showModal();
}

function readSettingsForm(): void {
  draft.apiKey = $<HTMLInputElement>('#apiKey').value.trim();
  const mode = document.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value as Mode | undefined;
  draft.mode = mode ?? 'standard';
  draft.hideShorts = $<HTMLInputElement>('#optHideShorts').checked;
  draft.seniorSearch = $<HTMLInputElement>('#optSeniorSearch').checked;
  const m = parseInt($<HTMLInputElement>('#examMinutes').value, 10);
  draft.examMinutes = Math.min(EXAM_MAX_MINUTES, Math.max(EXAM_MIN_MINUTES, Number.isFinite(m) ? m : draft.examMinutes));
}

async function addChannel(): Promise<void> {
  const msg = $('#channelMsg');
  const input = $<HTMLInputElement>('#channelInput');
  const key = $<HTMLInputElement>('#apiKey').value.trim();
  if (!key) { msg.textContent = '先にAPIキーを入力してください．'; return; }
  msg.textContent = '確認中…';
  try {
    const ch = await resolveChannel(input.value, key);
    if (draft.channels.some((c) => c.id === ch.id)) { msg.textContent = `「${ch.title}」はすでに登録されています．`; return; }
    draft.channels.push(ch);
    input.value = '';
    msg.textContent = `「${ch.title}」を追加しました．「保存して閉じる」で反映されます．`;
    renderChannelList();
  } catch (e) {
    msg.textContent = errMsg(e);
  }
}

async function setPin(): Promise<void> {
  const pin = $<HTMLInputElement>('#pinNew').value;
  if (!PIN_PATTERN.test(pin)) { $('#pinStatus').textContent = 'PINは4〜8桁の数字にしてください．'; return; }
  draft.pinHash = await hashPin(pin);
  $<HTMLInputElement>('#pinNew').value = '';
  $('#pinStatus').textContent = 'PINを設定しました．「保存して閉じる」で反映されます．';
}

// ===== 同意 =====
function ensureConsent(): Promise<void> {
  if (hasConsent()) return Promise.resolve();
  return new Promise((resolve) => {
    const dlg = $<HTMLDialogElement>('#consentDialog');
    const a = $<HTMLInputElement>('#agreeTerms');
    const b = $<HTMLInputElement>('#agreePrivacy');
    const btn = $<HTMLButtonElement>('#btnAgree');
    const sync = () => { btn.disabled = !(a.checked && b.checked); };
    a.addEventListener('change', sync);
    b.addEventListener('change', sync);
    sync();
    dlg.addEventListener('cancel', (e) => e.preventDefault()); // 同意前は閉じられない
    btn.addEventListener('click', () => { saveConsent(); dlg.close(); resolve(); });
    dlg.showModal();
  });
}

// ===== イベント =====
function bindEvents(): void {
  for (const t of document.querySelectorAll<HTMLButtonElement>('#tabs button[data-view]')) {
    t.addEventListener('click', () => { view = t.dataset.view === 'search' ? 'search' : 'channels'; applyMode(); });
  }
  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $<HTMLInputElement>('#q').value.trim();
    if (q) void runSearch(q);
  });
  $('#btnSettings').addEventListener('click', () => void openSettings());
  $('#btnBack').addEventListener('click', closeVideo);
  $('#btnBack2').addEventListener('click', closeVideo);
  $('#btnPlay').addEventListener('click', () => player?.togglePlay());
  $('#btnRew').addEventListener('click', () => player?.seek(-SEEK_SEC));
  $('#btnFwd').addEventListener('click', () => player?.seek(SEEK_SEC));
  const vol = (d: number) => { if (player) $('#volText').textContent = `音量 ${player.changeVolume(d)}`; };
  $('#btnVolDown').addEventListener('click', () => vol(-VOLUME_STEP));
  $('#btnVolUp').addEventListener('click', () => vol(VOLUME_STEP));
  $('#btnExamContinue').addEventListener('click', () => { examAcknowledged = true; $('#examBanner').hidden = true; });
  $('#btnExamBack').addEventListener('click', closeVideo);

  $('#btnAddChannel').addEventListener('click', () => void addChannel());
  $('#channelInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); void addChannel(); }
  });
  $('#btnSetPin').addEventListener('click', () => void setPin());
  $('#btnClearPin').addEventListener('click', () => { draft.pinHash = null; renderPinStatus(); });
  $('#btnClearCache').addEventListener('click', () => { clearCache(); $('#btnClearCache').textContent = '消去しました'; });
  $('#btnDeleteAll').addEventListener('click', async () => {
    if (!confirm('このアプリが保存したデータ（APIキー・登録チャンネル・設定・キャッシュ・同意記録）をすべて削除します．よろしいですか？')) return;
    await deleteAllData();
    location.reload();
  });

  const dlg = $<HTMLDialogElement>('#settingsDialog');
  dlg.addEventListener('close', () => {
    if (dlg.returnValue !== 'save') return;
    readSettingsForm();
    settings = draft;
    saveSettings(settings);
    closeVideo();
    applyMode();
  });
}

function init(): void {
  purgeExpiredCache();
  setupPwa();
  bindEvents();
  applyMode();
  void ensureConsent();
}

init();
