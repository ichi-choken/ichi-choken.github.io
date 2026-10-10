# TubeTune（仮称）

使う人に合わせて，YouTube の動画を「迷わず選んで再生する」までを支援する Web アプリ（PWA）です．
JPHACKS 2026 向けの試作版で，3人で共同開発しています．

公開URL：https://ichi-choken.github.io/TuneTube/

## できること

| モード | 内容 |
|---|---|
| 標準モード | 登録チャンネルの新着一覧と，キーワード検索（並び順・投稿時期で絞り込み） |
| シニアモード | 大きな文字，1列で最大8件の一覧，プレーヤーの外に大きな操作ボタン，プレーヤーのショートカットキーを無効化 |
| 受験生モード | 登録チャンネルのみ表示，1日の目標視聴時間を表示し，超えたら休憩を促す |

- **登録チャンネル**：家族などがチャンネルの URL・@ハンドル・ID を登録すると，その新着動画だけを一覧にします．
- **ショートの非表示**：長さ（3分以下）とタイトルで判定します．普通の短い動画も非表示になることを画面に明記しています．
- **設定ロック**：PIN で設定画面をロックし，本人の誤操作で設定が変わるのを防ぎます．
- **PWA**：スマホの Chrome や Safari から「ホーム画面に追加」できます．

**デモの流れ**：家族が設定でチャンネルを登録 → 本人が大きな一覧から選ぶ → 再生 → 迷わず一覧へ戻る．

## 開発の始め方

```sh
cd TuneTube
npm install          # TypeScript を入れる
npm run watch        # src/*.ts を保存するたびに js/ へビルド
npm run serve        # 別ターミナルで http://localhost:8000 を開く
npm test             # ビルドしてから単体テストを実行
```

- `js/` は `tsc` が出力したファイルです．**直接編集せず `src/` を編集**し，ビルド結果も一緒にコミットしてください（GitHub Pages はビルドせずにそのまま配信するため）．
- APIキーはコミットしないでください．アプリの設定画面から入力する方式です．
- `sw.js` の `CACHE_VERSION` は，ファイルを追加・改名したときに上げてください．追加したJSは `APP_SHELL` にも足します．

## ファイル構成

```
TuneTube/
├─ index.html            画面の骨組み（ダイアログ含む）
├─ terms.html            利用条件（YouTube利用規約への同意を含む）
├─ privacy.html          プライバシーポリシー
├─ manifest.webmanifest  PWA設定
├─ sw.js                 Service Worker（アプリ本体だけキャッシュ）
├─ styles/
│  ├─ base.css           共通・標準モード・スマホ
│  ├─ senior.css         シニアモード
│  └─ exam.css           受験生モード
├─ src/                  TypeScript（ここを編集する）
│  ├─ main.ts            画面の制御（一覧・再生・設定・同意）
│  ├─ api.ts             YouTube Data API の呼び出しとキャッシュ
│  ├─ player.ts          公式 IFrame Player API
│  ├─ filters.ts         ショート候補の判定
│  ├─ channel-input.ts   チャンネル入力（URL・@ハンドル・ID）の解釈
│  ├─ exam.ts            受験生モードの視聴タイマー
│  ├─ storage.ts         localStorage・キャッシュ・全削除
│  ├─ settings.ts        設定と同意の保存
│  ├─ quota.ts           API使用量の目安
│  ├─ pin.ts             設定ロック
│  ├─ pwa.ts             Service Worker登録・ホーム画面に追加
│  ├─ ui.ts              DOM部品
│  ├─ format.ts          表示用の整形
│  ├─ config.ts          設定値（定数）
│  ├─ types.ts           型
│  └─ yt.d.ts            IFrame API の型定義
├─ js/                   ビルド結果（編集しない）
└─ tests/                単体テスト（node --test）
```

## 担当の目安（3人）

| 担当 | 主なファイル |
|---|---|
| 一覧・API | `api.ts`，`filters.ts`，`channel-input.ts`，`quota.ts` |
| 再生・モード | `player.ts`，`exam.ts`，`styles/senior.css`，`styles/exam.css` |
| 画面・規約・発表 | `index.html`，`main.ts`，`terms.html`，`privacy.html`，README |

## 規約まわりのルール（実装前チェック）

Notion の「規約関連」ページの整理に基づくルールです．変更するときは必ず確認してください．

- [x] データは公式 Data API だけで取得し，YouTube サイトをスクレイピングしない
- [x] 初回に利用条件（YouTube利用規約への同意）とプライバシーポリシーへの同意を求め，いつでも読めるリンクを置く
- [x] 保存データを利用者がその場で全削除できる
- [x] 公式プレーヤーを覆わない・改変しない．操作バーは常に表示し（`controls=1`），大きなボタンはプレーヤーの外に置く
- [x] プレーヤーは 200×200px 以上．自動再生は画面上部に表示してから行う
- [x] Referer を送る（`strict-origin-when-cross-origin`）
- [x] `status.embeddable` と `status.madeForKids` を取得する．再生できない動画は理由と「YouTubeで開く」を表示する
- [x] 一時キャッシュは最大6時間・30件．登録チャンネルの名前とアイコンは7日ごとに再取得する（30日ルールより短く）
- [x] 広告の削除，音声だけの抽出，独自のバックグラウンド再生，プレーヤー内リンクの非表示はしない
- [x] 「ショートを完全に遮断」「選んだチャンネル以外に移動できない」とは約束しない
- [x] チャンネルの追加は検索APIを使わず，URL・@ハンドル・ID から `channels.list` で特定する
- [ ] **公開製品名**：「YouTube」「YT」などを含めない．「TubeTune」が紛らわしくないかはブランドガイドラインで要確認（現在は仮称）
- [ ] **複数チャンネルの新着をまとめて表示**することがデータ集約の規定（III.E.2）にどう当たるかは，一般公開前に公式に確認する
- [ ] OAuth（Googleログイン）を入れる場合は，最小権限・同意の撤回・7日以内のデータ削除を実装する

参考：
[YouTube API デベロッパーポリシー](https://developers.google.com/youtube/terms/developer-policies?hl=ja) ／
[最低限の機能要件](https://developers.google.com/youtube/terms/required-minimum-functionality) ／
[ブランドガイドライン](https://developers.google.com/youtube/terms/branding-guidelines?hl=ja) ／
[プレーヤーのパラメータ](https://developers.google.com/youtube/player_parameters)
