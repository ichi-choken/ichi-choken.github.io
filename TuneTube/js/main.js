// ===== 画面の制御（起動・一覧・再生・設定） =====
import { DAILY_SEARCH_CALLS, DAILY_UNITS, EXAM_MAX_MINUTES, EXAM_MIN_MINUTES, SEEK_SEC, SENIOR_MAX_ITEMS, VOLUME_STEP, } from './config.js';
import { channelVideos, refreshChannels, resolveChannel, searchVideos } from './api.js';
import { ExamTimer } from './exam.js';
import { filterVideos } from './filters.js';
import { fmtDate, fmtMinutes } from './format.js';
import { PIN_PATTERN, hashPin } from './pin.js';
import { createPlayer, playerErrorText } from './player.js';
import { setupPwa } from './pwa.js';
import { getQuota } from './quota.js';
import { hasConsent, loadSettings, saveConsent, saveSettings } from './settings.js';
import { clearCache, deleteAllData, purgeExpiredCache } from './storage.js';
import { $, el, emptyState, renderVideoCards } from './ui.js';
const MODE_LABEL = { standard: '標準モード', senior: 'シニアモード', exam: '受験生モード' };
let settings = loadSettings();
let draft = structuredClone(settings);
let view = 'channels';
let channelFilter = 'all';
let lastSearch = null;
let feedToken = 0;
let current = null;
let player = null;
let exam = null;
let examAcknowledged = false;
const errMsg = (e) => (e instanceof Error ? e.message : String(e));
function setStatus(text) { $('#status').textContent = text; }
function setNotice(text) {
    const n = $('#notice');
    n.textContent = text;
    n.hidden = !text;
}
// ===== モード =====
function searchAllowed() {
    return settings.mode === 'standard' || (settings.mode === 'senior' && settings.seniorSearch);
}
function applyMode() {
    const b = document.body;
    b.classList.remove('mode-standard', 'mode-senior', 'mode-exam');
    b.classList.add(`mode-${settings.mode}`);
    $('#modeBadge').textContent = MODE_LABEL[settings.mode];
    if (!searchAllowed())
        view = 'channels';
    if (channelFilter !== 'all' && !settings.channels.some((c) => c.id === channelFilter))
        channelFilter = 'all';
    const tabs = $('#tabs');
    tabs.hidden = !searchAllowed();
    for (const t of tabs.querySelectorAll('button[data-view]')) {
        t.setAttribute('aria-selected', String(t.dataset.view === view));
    }
    renderHome();
}
// ===== 一覧 =====
function renderHome() {
    $('#searchForm').hidden = view !== 'search';
    $('#chips').hidden = view !== 'channels';
    if (view === 'channels')
        void loadChannelFeed();
    else
        showSearchResults();
}
function renderChips() {
    const box = $('#chips');
    box.replaceChildren();
    if (settings.channels.length < 2)
        return;
    const chip = (id, label) => {
        const b = el('button', { type: 'button', className: 'chip' }, label);
        b.setAttribute('aria-pressed', String(channelFilter === id));
        b.addEventListener('click', () => { channelFilter = id; void loadChannelFeed(); });
        return b;
    };
    box.append(chip('all', 'すべて'), ...settings.channels.map((c) => chip(c.id, c.title)));
}
async function loadChannelFeed() {
    const token = ++feedToken;
    const box = $('#results');
    box.replaceChildren();
    setNotice('');
    renderChips();
    if (!settings.channels.length) {
        setStatus('');
        box.append(emptyState('まだチャンネルが登録されていません．', 'ご家族の方へ：「設定」から，見せたいチャンネルを登録してください．', '設定を開く', () => void openSettings()));
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
        if (refreshed) {
            settings.channels = refreshed;
            saveSettings(settings);
            renderChips();
        }
    }
    catch { /* 一覧表示は続ける */ }
    const targets = channelFilter === 'all' ? settings.channels : settings.channels.filter((c) => c.id === channelFilter);
    const results = await Promise.allSettled(targets.map((c) => channelVideos(c, settings.apiKey)));
    if (token !== feedToken)
        return;
    const videos = [];
    const errors = [];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled')
            videos.push(...r.value);
        else
            errors.push(`「${targets[i].title}」を読み込めませんでした：${errMsg(r.reason)}`);
    });
    videos.sort((a, b) => b.published.localeCompare(a.published));
    showVideos(videos, errors);
}
function showVideos(videos, notes = []) {
    const { kept, removed } = filterVideos(videos, settings.hideShorts);
    const list = settings.mode === 'senior' ? kept.slice(0, SENIOR_MAX_ITEMS) : kept;
    const msgs = [...notes];
    if (removed)
        msgs.push(`ショートの可能性がある動画を ${removed} 件非表示にしました（3分以下の動画などを長さで判定しているため，普通の短い動画も含まれます．設定で表示できます）．`);
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
async function runSearch(q) {
    if (!settings.apiKey) {
        void openSettings();
        return;
    }
    const order = $('#order').value;
    const period = $('#period').value;
    setStatus('検索中…');
    setNotice('');
    $('#results').replaceChildren();
    try {
        lastSearch = await searchVideos(q, order, period, settings.apiKey);
        showVideos(lastSearch);
    }
    catch (e) {
        setStatus(errMsg(e));
    }
}
function showSearchResults() {
    if (lastSearch) {
        showVideos(lastSearch);
        return;
    }
    $('#results').replaceChildren();
    setNotice('');
    setStatus('キーワードを入れて「検索」を押してください．');
}
// ===== 再生 =====
function showPlayerMessage(text) {
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
function updateExamBar(used, limit) {
    $('#examText').textContent = `今日の視聴 ${fmtMinutes(used)} ／ 目標 ${fmtMinutes(limit)}`;
    const bar = $('#examProgress');
    bar.max = limit;
    bar.value = Math.min(used, limit);
}
function showExamBanner() {
    if (examAcknowledged)
        return;
    player?.pause();
    $('#examBanner').hidden = false;
}
function onPlayerState(playing) {
    $('#btnPlay').textContent = playing ? '⏸ 一時停止' : '▶ 再生';
    if (!exam)
        return;
    exam.setPlaying(playing);
    if (playing && exam.used() >= exam.limitSec)
        showExamBanner();
}
function closePlayerOnly() {
    exam?.stop();
    exam = null;
    player?.destroy();
    player = null;
}
async function openVideo(v) {
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
        if (current !== v) {
            handle.destroy();
            return;
        } // 読み込み中に戻った場合
        player = handle;
    }
    catch {
        showPlayerMessage('プレーヤーを読み込めませんでした．通信状況を確認してください．');
    }
}
function closeVideo() {
    closePlayerOnly();
    current = null;
    $('#playerView').hidden = true;
    $('#homeView').hidden = false;
}
// ===== PIN =====
function askPin() {
    return new Promise((resolve) => {
        const dlg = $('#pinDialog');
        const input = $('#pinInput');
        const err = $('#pinError');
        input.value = '';
        err.textContent = '';
        const finish = (ok) => {
            dlg.removeEventListener('submit', onSubmit);
            dlg.removeEventListener('cancel', onCancel);
            dlg.close();
            resolve(ok);
        };
        const onSubmit = async (e) => {
            e.preventDefault();
            const submitter = e.submitter;
            if (submitter?.value === 'cancel') {
                finish(false);
                return;
            }
            if ((await hashPin(input.value)) === settings.pinHash)
                finish(true);
            else {
                err.textContent = 'PINが違います．';
                input.select();
            }
        };
        const onCancel = () => finish(false);
        dlg.addEventListener('submit', onSubmit);
        dlg.addEventListener('cancel', onCancel);
        dlg.showModal();
        input.focus();
    });
}
// ===== 設定 =====
function renderChannelList() {
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
function renderPinStatus() {
    $('#pinStatus').textContent = draft.pinHash ? 'PINで設定画面をロックしています．' : 'ロックしていません．';
}
function renderQuota() {
    const q = getQuota();
    $('#quota').textContent = `この端末からの今日の使用量（目安）：検索 ${q.searches} / ${DAILY_SEARCH_CALLS} 回，その他 ${q.units} / ${DAILY_UNITS} ユニット．枠はプロジェクト全体で共有されます．`;
}
async function openSettings() {
    if (settings.pinHash && !(await askPin()))
        return;
    draft = structuredClone(settings);
    $('#apiKey').value = draft.apiKey;
    for (const r of document.querySelectorAll('input[name="mode"]'))
        r.checked = r.value === draft.mode;
    $('#optHideShorts').checked = draft.hideShorts;
    $('#optSeniorSearch').checked = draft.seniorSearch;
    $('#examMinutes').value = String(draft.examMinutes);
    $('#channelInput').value = '';
    $('#pinNew').value = '';
    $('#channelMsg').textContent = '';
    renderChannelList();
    renderPinStatus();
    renderQuota();
    $('#settingsDialog').showModal();
}
function readSettingsForm() {
    draft.apiKey = $('#apiKey').value.trim();
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    draft.mode = mode ?? 'standard';
    draft.hideShorts = $('#optHideShorts').checked;
    draft.seniorSearch = $('#optSeniorSearch').checked;
    const m = parseInt($('#examMinutes').value, 10);
    draft.examMinutes = Math.min(EXAM_MAX_MINUTES, Math.max(EXAM_MIN_MINUTES, Number.isFinite(m) ? m : draft.examMinutes));
}
async function addChannel() {
    const msg = $('#channelMsg');
    const input = $('#channelInput');
    const key = $('#apiKey').value.trim();
    if (!key) {
        msg.textContent = '先にAPIキーを入力してください．';
        return;
    }
    msg.textContent = '確認中…';
    try {
        const ch = await resolveChannel(input.value, key);
        if (draft.channels.some((c) => c.id === ch.id)) {
            msg.textContent = `「${ch.title}」はすでに登録されています．`;
            return;
        }
        draft.channels.push(ch);
        input.value = '';
        msg.textContent = `「${ch.title}」を追加しました．「保存して閉じる」で反映されます．`;
        renderChannelList();
    }
    catch (e) {
        msg.textContent = errMsg(e);
    }
}
async function setPin() {
    const pin = $('#pinNew').value;
    if (!PIN_PATTERN.test(pin)) {
        $('#pinStatus').textContent = 'PINは4〜8桁の数字にしてください．';
        return;
    }
    draft.pinHash = await hashPin(pin);
    $('#pinNew').value = '';
    $('#pinStatus').textContent = 'PINを設定しました．「保存して閉じる」で反映されます．';
}
// ===== 同意 =====
function ensureConsent() {
    if (hasConsent())
        return Promise.resolve();
    return new Promise((resolve) => {
        const dlg = $('#consentDialog');
        const a = $('#agreeTerms');
        const b = $('#agreePrivacy');
        const btn = $('#btnAgree');
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
function bindEvents() {
    for (const t of document.querySelectorAll('#tabs button[data-view]')) {
        t.addEventListener('click', () => { view = t.dataset.view === 'search' ? 'search' : 'channels'; applyMode(); });
    }
    $('#searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const q = $('#q').value.trim();
        if (q)
            void runSearch(q);
    });
    $('#btnSettings').addEventListener('click', () => void openSettings());
    $('#btnBack').addEventListener('click', closeVideo);
    $('#btnBack2').addEventListener('click', closeVideo);
    $('#btnPlay').addEventListener('click', () => player?.togglePlay());
    $('#btnRew').addEventListener('click', () => player?.seek(-SEEK_SEC));
    $('#btnFwd').addEventListener('click', () => player?.seek(SEEK_SEC));
    const vol = (d) => { if (player)
        $('#volText').textContent = `音量 ${player.changeVolume(d)}`; };
    $('#btnVolDown').addEventListener('click', () => vol(-VOLUME_STEP));
    $('#btnVolUp').addEventListener('click', () => vol(VOLUME_STEP));
    $('#btnExamContinue').addEventListener('click', () => { examAcknowledged = true; $('#examBanner').hidden = true; });
    $('#btnExamBack').addEventListener('click', closeVideo);
    $('#btnAddChannel').addEventListener('click', () => void addChannel());
    $('#channelInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            void addChannel();
        }
    });
    $('#btnSetPin').addEventListener('click', () => void setPin());
    $('#btnClearPin').addEventListener('click', () => { draft.pinHash = null; renderPinStatus(); });
    $('#btnClearCache').addEventListener('click', () => { clearCache(); $('#btnClearCache').textContent = '消去しました'; });
    $('#btnDeleteAll').addEventListener('click', async () => {
        if (!confirm('このアプリが保存したデータ（APIキー・登録チャンネル・設定・キャッシュ・同意記録）をすべて削除します．よろしいですか？'))
            return;
        await deleteAllData();
        location.reload();
    });
    const dlg = $('#settingsDialog');
    dlg.addEventListener('close', () => {
        if (dlg.returnValue !== 'save')
            return;
        readSettingsForm();
        settings = draft;
        saveSettings(settings);
        closeVideo();
        applyMode();
    });
}
function init() {
    purgeExpiredCache();
    setupPwa();
    bindEvents();
    applyMode();
    void ensureConsent();
}
init();
