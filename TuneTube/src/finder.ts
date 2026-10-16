// ===== チャンネルを探す（カテゴリーを選ぶだけで追加できる画面） =====
// おすすめはチャンネルIDから channels.list で取得する（検索APIを使わない）．
// 「もっと探す」「キーワードで探す」だけ検索APIを1回使う．
import { fetchChannelInfos, searchChannels } from './api.js';
import { fmtSubscribers } from './format.js';
import { PRESET_CATEGORIES, type PresetCategory } from './presets.js';
import type { Channel, ChannelInfo } from './types.js';
import { $, el } from './ui.js';

export interface FinderOptions {
  apiKey: string;
  /** 追加・削除する対象（設定画面の下書き，または保存済みの設定）． */
  channels: Channel[];
  /** 追加・削除したときに呼ばれる． */
  onChange: () => void;
}

let opts: FinderOptions | null = null;
let category: PresetCategory | null = null;
let token = 0;
let bound = false;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** 保存するのは Channel の項目だけ（説明文・登録者数は保存しない）． */
function toChannel(c: ChannelInfo): Channel {
  return { id: c.id, title: c.title, thumb: c.thumb, uploads: c.uploads, fetchedAt: c.fetchedAt };
}

function setStatus(text: string): void { $('#finderStatus').textContent = text; }

function renderCategories(): void {
  const grid = $('#catGrid');
  grid.replaceChildren();
  for (const c of PRESET_CATEGORIES) {
    const b = el('button', { type: 'button', className: 'cat' },
      el('span', { className: 'cat-icon', ariaHidden: 'true' }, c.icon), el('span', {}, c.label));
    b.setAttribute('aria-pressed', String(category?.id === c.id));
    b.addEventListener('click', () => void showCategory(c));
    grid.append(b);
  }
}

function isAdded(id: string): boolean {
  return !!opts?.channels.some((c) => c.id === id);
}

function addButton(info: ChannelInfo): HTMLButtonElement {
  const b = el('button', { type: 'button', className: 'small add' });
  const sync = () => {
    const added = isAdded(info.id);
    b.textContent = added ? '✓ 追加済み' : '＋ 追加';
    b.classList.toggle('primary', !added);
    b.setAttribute('aria-pressed', String(added));
    b.title = added ? 'もう一度押すと登録から外します' : '登録チャンネルに追加します';
    b.setAttribute('aria-label', `${info.title}を${added ? '登録から外す' : '追加する'}`);
  };
  b.addEventListener('click', () => {
    if (!opts) return;
    const i = opts.channels.findIndex((c) => c.id === info.id);
    if (i >= 0) opts.channels.splice(i, 1); else opts.channels.push(toChannel(info));
    opts.onChange();
    sync();
  });
  sync();
  return b;
}

function renderResults(list: ChannelInfo[]): void {
  const ul = $('#finderResults');
  ul.replaceChildren();
  for (const c of list) {
    const sub = fmtSubscribers(c.subscribers);
    const body = el('div', { className: 'fr-body' }, el('div', { className: 'fr-name' }, c.title));
    if (sub) body.append(el('div', { className: 'sub' }, sub));
    if (c.description) body.append(el('div', { className: 'fr-desc' }, c.description));
    ul.append(el('li', {}, el('img', { src: c.thumb, alt: '', loading: 'lazy' }), body, addButton(c)));
  }
}

function renderMore(): void {
  const box = $('#finderMore');
  box.replaceChildren();
  if (!category) return;
  const c = category;
  const b = el('button', { type: 'button' }, `「${c.label}」のチャンネルをもっと探す`);
  b.addEventListener('click', () => void runSearch(c.keyword, `「${c.label}」の検索結果`));
  box.append(b, el('p', { className: 'hint' }, '検索を1回使います（1日の回数に上限があります）．'));
}

async function load(label: string, fetcher: () => Promise<ChannelInfo[]>): Promise<void> {
  const t = ++token;
  $('#finderResults').replaceChildren();
  setStatus('読み込み中…');
  try {
    const list = await fetcher();
    if (t !== token) return;
    renderResults(list);
    // ジャンルの下に結果が出るので，結果の先頭まで画面を動かす
    $('#finderStatus').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus(list.length ? `${label}（${list.length}件）．「＋ 追加」を押すと登録チャンネルに入ります．` : 'チャンネルが見つかりませんでした．');
  } catch (e) {
    if (t === token) setStatus(errMsg(e));
  }
}

async function showCategory(c: PresetCategory): Promise<void> {
  if (!opts) return;
  category = c;
  renderCategories();
  renderMore();
  const key = opts.apiKey;
  await load(`${c.icon} ${c.label}のおすすめ`, () => fetchChannelInfos(c.channels.map((p) => p.id), key));
}

async function runSearch(q: string, label: string): Promise<void> {
  if (!opts) return;
  const key = opts.apiKey;
  $('#finderMore').replaceChildren();
  await load(label, () => searchChannels(q, key));
}

function bind(): void {
  if (bound) return;
  bound = true;
  $('#channelSearchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $<HTMLInputElement>('#channelQ').value.trim();
    if (!q) return;
    category = null;
    renderCategories();
    void runSearch(q, `「${q}」の検索結果`);
  });
  $('#btnFinderDone').addEventListener('click', () => $<HTMLDialogElement>('#finderDialog').close());
}

/** 探す画面を開く．閉じたら解決する． */
export function openFinder(options: FinderOptions): Promise<void> {
  bind();
  opts = options;
  category = null;
  token++;
  $<HTMLInputElement>('#channelQ').value = '';
  $('#finderResults').replaceChildren();
  $('#finderMore').replaceChildren();
  setStatus('見たいジャンルを選んでください．');
  renderCategories();
  const dlg = $<HTMLDialogElement>('#finderDialog');
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => { opts = null; resolve(); }, { once: true });
    dlg.showModal();
  });
}
