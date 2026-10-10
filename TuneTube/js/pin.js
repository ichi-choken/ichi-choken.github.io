// ===== 設定画面ロック用PIN =====
// 本人の誤操作で設定が変わるのを防ぐための簡易ロック（強固なセキュリティではない）．
export const PIN_PATTERN = /^\d{4,8}$/;
export async function hashPin(pin) {
    const data = new TextEncoder().encode(`tubetune-pin:${pin}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}
