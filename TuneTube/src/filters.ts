import { SHORTS_MAX_SEC } from './config.js';
import type { Video } from './types.js';

/**
 * ショートの「候補」か．
 * Data API にはショート専用の判定項目がないため，長さとタイトルで推定する．
 * 3分以下の通常動画も対象になる（画面上でもその旨を説明する）．
 */
export function isShortCandidate(v: Pick<Video, 'title' | 'sec'>): boolean {
  if (/#shorts?(?![\w])/i.test(v.title)) return true;
  return v.sec > 0 && v.sec <= SHORTS_MAX_SEC;
}

/** 表示フィルタ．元データは変えず，表示するものと除外件数を返す． */
export function filterVideos(list: Video[], hideShorts: boolean): { kept: Video[]; removed: number } {
  if (!hideShorts) return { kept: list, removed: 0 };
  const kept = list.filter((v) => !isShortCandidate(v));
  return { kept, removed: list.length - kept.length };
}
