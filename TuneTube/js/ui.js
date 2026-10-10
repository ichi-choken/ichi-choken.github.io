// ===== DOMを組み立てる小さな部品 =====
import { fmtCount, fmtDate, fmtDuration } from './format.js';
export function $(selector) {
    const e = document.querySelector(selector);
    if (!e)
        throw new Error(`要素が見つかりません: ${selector}`);
    return e;
}
export function el(tag, props = {}, ...children) {
    const e = document.createElement(tag);
    Object.assign(e, props);
    e.append(...children);
    return e;
}
export function emptyState(title, body = '', actionLabel, action) {
    const box = el('div', { className: 'empty' }, el('p', { className: 'empty-title' }, title));
    if (body)
        box.append(el('p', {}, body));
    if (actionLabel && action) {
        const b = el('button', { type: 'button', className: 'primary' }, actionLabel);
        b.addEventListener('click', action);
        box.append(b);
    }
    return box;
}
/** 動画カードの一覧．タイトル等のAPIデータは改変せずそのまま表示する． */
export function renderVideoCards(box, videos, opts) {
    for (const v of videos) {
        const img = el('img', { src: v.thumb, alt: '', loading: 'lazy' });
        const thumb = el('div', { className: 'thumb' }, img, el('span', { className: 'dur' }, fmtDuration(v.sec)));
        let sub;
        if (opts.mode === 'senior')
            sub = v.channel;
        else if (opts.mode === 'exam')
            sub = `${v.channel}・${fmtDate(v.published)}`;
        else
            sub = `${v.channel}・${fmtCount(v.views)}・${fmtDate(v.published)}`;
        const meta = el('div', { className: 'meta' }, el('div', { className: 'title' }, v.title), el('div', { className: 'sub' }, sub));
        if (!v.embeddable)
            meta.append(el('div', { className: 'tag' }, 'YouTubeで開きます'));
        const card = el('button', { type: 'button', className: 'card' }, thumb, meta);
        card.addEventListener('click', () => opts.onSelect(v));
        box.append(card);
    }
}
