// ===== チャンネルを探す（カテゴリーを選ぶだけで追加できる画面） =====
// おすすめはチャンネルIDから channels.list で取得する（検索APIを使わない）．
// 「もっと探す」「キーワードで探す」だけ検索APIを1回使う．
import { fetchChannelInfos, searchChannels } from './api.js';
import { fmtSubscribers } from './format.js';
import { PRESET_CATEGORIES } from './presets.js';
import { $, el } from './ui.js';
let opts = null;
let category = null;
let token = 0;
let bound = false;
const errMsg = (e) => (e instanceof Error ? e.message : String(e));
/** 保存するのは Channel の項目だけ（説明文・登録者数は保存しない）． */
function toChannel(c) {
    return { id: c.id, title: c.title, thumb: c.thumb, uploads: c.uploads, fetchedAt: c.fetchedAt };
}
function setStatus(text) { $('#finderStatus').textContent = text; }
function renderCategories() {
    const grid = $('#catGrid');
    grid.replaceChildren();
    for (const c of PRESET_CATEGORIES) {
        const b = el('button', { type: 'button', className: 'cat' }, el('span', { className: 'cat-icon', ariaHidden: 'true' }, c.icon), el('span', {}, c.label));
        b.setAttribute('aria-pressed', String(category?.id === c.id));
        b.addEventListener('click', () => void showCategory(c));
        grid.append(b);
    }
}
function isAdded(id) {
    return !!opts?.channels.some((c) => c.id === id);
}
function addButton(info) {
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
        if (!opts)
            return;
        const i = opts.channels.findIndex((c) => c.id === info.id);
        if (i >= 0)
            opts.channels.splice(i, 1);
        else
            opts.channels.push(toChannel(info));
        opts.onChange();
        sync();
    });
    sync();
    return b;
}
function renderResults(list) {
    const ul = $('#finderResults');
    ul.replaceChildren();
    for (const c of list) {
        const sub = fmtSubscribers(c.subscribers);
        const body = el('div', { className: 'fr-body' }, el('div', { className: 'fr-name' }, c.title));
        if (sub)
            body.append(el('div', { className: 'sub' }, sub));
        if (c.description)
            body.append(el('div', { className: 'fr-desc' }, c.description));
        ul.append(el('li', {}, el('img', { src: c.thumb, alt: '', loading: 'lazy' }), body, addButton(c)));
    }
}
function renderMore() {
    const box = $('#finderMore');
    box.replaceChildren();
    if (!category)
        return;
    const c = category;
    const b = el('button', { type: 'button' }, `「${c.label}」のチャンネルをもっと探す`);
    b.addEventListener('click', () => void runSearch(c.keyword, `「${c.label}」の検索結果`));
    box.append(b, el('p', { className: 'hint' }, '検索を1回使います（1日の回数に上限があります）．'));
}
async function load(label, fetcher) {
    const t = ++token;
    $('#finderResults').replaceChildren();
    setStatus('読み込み中…');
    try {
        const list = await fetcher();
        if (t !== token)
            return;
        renderResults(list);
        // ジャンルの下に結果が出るので，結果の先頭まで画面を動かす
        $('#finderStatus').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setStatus(list.length ? `${label}（${list.length}件）．「＋ 追加」を押すと登録チャンネルに入ります．` : 'チャンネルが見つかりませんでした．');
    }
    catch (e) {
        if (t === token)
            setStatus(errMsg(e));
    }
}
async function showCategory(c) {
    if (!opts)
        return;
    category = c;
    renderCategories();
    renderMore();
    const key = opts.apiKey;
    await load(`${c.icon} ${c.label}のおすすめ`, () => fetchChannelInfos(c.channels.map((p) => p.id), key));
}
async function runSearch(q, label) {
    if (!opts)
        return;
    const key = opts.apiKey;
    $('#finderMore').replaceChildren();
    await load(label, () => searchChannels(q, key));
}
function bind() {
    if (bound)
        return;
    bound = true;
    $('#channelSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const q = $('#channelQ').value.trim();
        if (!q)
            return;
        category = null;
        renderCategories();
        void runSearch(q, `「${q}」の検索結果`);
    });
    $('#btnFinderDone').addEventListener('click', () => $('#finderDialog').close());
}
/** 探す画面を開く．閉じたら解決する． */
export function openFinder(options) {
    bind();
    opts = options;
    category = null;
    token++;
    $('#channelQ').value = '';
    $('#finderResults').replaceChildren();
    $('#finderMore').replaceChildren();
    setStatus('見たいジャンルを選んでください．');
    renderCategories();
    const dlg = $('#finderDialog');
    return new Promise((resolve) => {
        dlg.addEventListener('close', () => { opts = null; resolve(); }, { once: true });
        dlg.showModal();
    });
}
