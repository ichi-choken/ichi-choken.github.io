// ===== 表示用の整形（DOMに依存しない純粋関数） =====
/** ISO 8601 の長さ（PT1H2M3S）を秒に変換する． */
export function parseDuration(iso) {
    const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
    if (!m)
        return 0;
    return (+(m[1] ?? 0)) * 86400 + (+(m[2] ?? 0)) * 3600 + (+(m[3] ?? 0)) * 60 + (+(m[4] ?? 0));
}
/** 秒を 1:02:03 / 2:03 形式にする．0 は「ライブ」． */
export function fmtDuration(sec) {
    if (!sec)
        return 'ライブ';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
/** 再生回数を「1.2万回」形式にする． */
export function fmtCount(value) {
    const n = Number(value) || 0;
    if (n >= 1e8)
        return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '億回';
    if (n >= 1e4)
        return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万回';
    return `${n}回`;
}
export function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}
/** 秒を「◯分」にする（切り捨て）． */
export function fmtMinutes(sec) {
    return `${Math.floor(sec / 60)}分`;
}
