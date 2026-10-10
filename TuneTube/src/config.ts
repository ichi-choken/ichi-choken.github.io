// ===== アプリ全体の設定値 =====

/** ショート候補とみなす最大の長さ（秒）．2024年10月以降，ショートは最大3分． */
export const SHORTS_MAX_SEC = 180;

/** 検索結果・動画一覧の一時キャッシュの有効期間．規約の30日更新ルールより十分短くする． */
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** キャッシュとして保持する最大件数（古いものから削除）． */
export const CACHE_MAX_ENTRIES = 30;

/** 登録チャンネルの名前・アイコンを再取得する間隔（30日ルールより短く）． */
export const CHANNEL_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

/** APIの標準枠（1プロジェクト・1日あたり）．表示用の目安． */
export const DAILY_UNITS = 10000;
export const DAILY_SEARCH_CALLS = 100;

/** 1回の検索で取得する件数． */
export const SEARCH_MAX_RESULTS = 25;

/** 1チャンネルあたり取得する最新動画の件数． */
export const CHANNEL_VIDEOS_PER_CHANNEL = 15;

/** シニアモードで一覧に出す最大件数． */
export const SENIOR_MAX_ITEMS = 8;

/** 受験生モードの1日の目標視聴時間（分）． */
export const EXAM_DEFAULT_MINUTES = 30;
export const EXAM_MIN_MINUTES = 5;
export const EXAM_MAX_MINUTES = 240;

/** 再生・音量ボタンの変化量． */
export const SEEK_SEC = 10;
export const VOLUME_STEP = 10;

/** localStorage のキーの接頭辞． */
export const STORE_PREFIX = 'tubetune:';

/** 同意内容を変えたら上げる（再同意を求める）． */
export const CONSENT_VERSION = 1;

/** 埋め込みプレーヤーのホスト（プライバシー強化モード）． */
export const PLAYER_HOST = 'https://www.youtube-nocookie.com';
