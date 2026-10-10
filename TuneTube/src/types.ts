export type Mode = 'standard' | 'senior' | 'exam';

/** 家族などが登録した許可チャンネル． */
export interface Channel {
  id: string;
  title: string;
  thumb: string;
  /** 投稿動画のプレイリストID（UU...）． */
  uploads: string;
  /** 名前・アイコンを取得した時刻（ms）．古くなったら再取得する． */
  fetchedAt: number;
}

export interface Video {
  id: string;
  title: string;
  channelId: string;
  channel: string;
  published: string;
  thumb: string;
  /** 長さ（秒）．ライブ等は0． */
  sec: number;
  views: string;
  madeForKids: boolean;
  embeddable: boolean;
}

export interface Settings {
  apiKey: string;
  mode: Mode;
  hideShorts: boolean;
  /** シニアモードでも検索タブを出すか． */
  seniorSearch: boolean;
  examMinutes: number;
  channels: Channel[];
  /** 設定画面ロック用PINのハッシュ．null ならロックなし． */
  pinHash: string | null;
}
