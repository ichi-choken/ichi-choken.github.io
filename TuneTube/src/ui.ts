// ===== DOMを組み立てる小さな部品 =====
import { fmtCount, fmtDate, fmtDuration } from './format.js';
import type { Mode, Video } from './types.js';

export function $<T extends HTMLElement = HTMLElement>(selector: string): T {
  const e = document.querySelector<T>(selector);
  if (!e) throw new Error(`要素が見つかりません: ${selector}`);
  return e;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...children);
  return e;
}

export function emptyState(title: string, body = '', actionLabel?: string, action?: () => void): HTMLElement {
  const box = el('div', { className: 'empty' }, el('p', { className: 'empty-title' }, title));
  if (body) box.append(el('p', {}, body));
  if (actionLabel && action) {
    const b = el('button', { type: 'button', className: 'primary' }, actionLabel);
    b.addEventListener('click', action);
    box.append(b);
  }
  return box;
}

/** 動画カードの一覧．タイトル等のAPIデータは改変せずそのまま表示する． */
export function renderVideoCards(box: HTMLElement, videos: Video[], opts: { mode: Mode; onSelect: (v: Video) => void }): void {
  for (const v of videos) {
    const img = el('img', { src: v.thumb, alt: '', loading: 'lazy' });
    const thumb = el('div', { className: 'thumb' }, img, el('span', { className: 'dur' }, fmtDuration(v.sec)));
    let sub: string;
    if (opts.mode === 'senior') sub = v.channel;
    else if (opts.mode === 'exam') sub = `${v.channel}・${fmtDate(v.published)}`;
    else sub = `${v.channel}・${fmtCount(v.views)}・${fmtDate(v.published)}`;
    const meta = el('div', { className: 'meta' },
      el('div', { className: 'title' }, v.title),
      el('div', { className: 'sub' }, sub));
    if (!v.embeddable) meta.append(el('div', { className: 'tag' }, 'YouTubeで開きます'));
    const card = el('button', { type: 'button', className: 'card' }, thumb, meta);
    card.addEventListener('click', () => opts.onSelect(v));
    box.append(card);
  }
}
