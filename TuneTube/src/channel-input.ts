// ===== チャンネルの入力（URL・@ハンドル・ID）を解釈する =====
// 検索APIを使わずにチャンネルを特定するため，利用者に正確な入力をしてもらう．

export type ChannelRef = { kind: 'id'; value: string } | { kind: 'handle'; value: string };

export function parseChannelInput(input: string): ChannelRef | null {
  const s = input.trim();
  if (!s) return null;

  // @ハンドル（URL内を含む）
  const handle = /@([^\s/?#]+)/.exec(s);
  if (handle) return { kind: 'handle', value: decodeURIComponent(handle[1]!) };

  // チャンネルID（UC + 22文字）．URL /channel/UC... も含む
  const id = /(UC[\w-]{22})(?![\w-])/.exec(s);
  if (id) return { kind: 'id', value: id[1]! };

  // @ を付け忘れたハンドル
  if (/^[\w.-]{3,30}$/.test(s)) return { kind: 'handle', value: s };

  return null;
}
