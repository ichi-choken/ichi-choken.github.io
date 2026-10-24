// Shumitomo のフロント（デモ）。仕様は spec/frontend-approved.md の承認済みの条件にそろえる。
// サーバーはまだ無いので、データはこのファイルの見本を使い、保存は待ち時間をまねるだけ。

/* ---------- 決まった値 ---------- */

// 熱量は「ゆるい〜ガチ」の5段階（ADR-33）
const HEAT = ['ゆるい', 'ゆるめ', '普通', 'ガチめ', 'ガチ'];
// 実力は全部のゲームで同じ1〜9（ADR-75）
const SKILLS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PLATFORMS = ['Switch', 'Switch 2', 'PlayStation', 'PC（Steam）', 'スマホ', 'その他'];
// 住んでいる地方は区分だけ（ADR-30）
const REGIONS = ['北海道・東北', '関東', '甲信越', '北陸', '東海', '近畿', '中国', '四国', '九州・沖縄'];
const VC = ['あり', '聞き専OK', 'なし'];
// 名前・ゲーム内IDに入れられない言葉（app-24）
const NG_WORDS = ['line', '@', 'http', 'discord.gg', 'insta'];

// join：room＝入る場所（部屋番号など）、id＝参加する人のゲーム内IDが要る（ADR-28）
const GAMES = {
  splatoon3: { name: 'スプラトゥーン3', igdb: 'splatoon-3', join: 'room', a: '#d7f205', b: '#5b2bd9' },
  apex: { name: 'Apex Legends', igdb: 'apex-legends', join: 'id', a: '#b3261e', b: '#3a0d0b' },
  amongus: { name: 'Among Us', igdb: 'among-us', join: 'room', a: '#c51111', b: '#132ed1' },
  fallguys: { name: 'Fall Guys', igdb: 'fall-guys', join: 'id', a: '#ff6ec7', b: '#5ad1ff' },
  masterduel: { name: '遊戯王 マスターデュエル', igdb: 'yu-gi-oh-master-duel', join: 'id', a: '#1e3a8a', b: '#0b1026' },
};
const LIKE_SUGGEST = ['ボカロ', '邦ロック', '少年漫画', 'SFアニメ', 'VTuber', 'ジブリ', 'K-POP', 'ポケモン'];
const HOBBY_SUGGEST = ['カフェ巡り', 'ボードゲーム', 'TRPG', '写真', '料理', 'イラスト', '筋トレ'];

const ME = {
  nickname: 'ゆう',
  appId: 'yu7',
  color: '#6c5cf0',
  games: [
    { tag: 'apex', platform: 'PC（Steam）', heat: 4, skill: 5, steam: { hours: 312, updated: '今日 9:12' } },
    { tag: 'splatoon3', platform: 'Switch', heat: 2, skill: 6 },
    { tag: 'fallguys', platform: 'PlayStation', heat: 1, skill: 3 },
  ],
  hobbies: [
    { name: 'カフェ巡り', heat: 4 },
    { name: 'ボードゲーム', heat: 2 },
  ],
  likes: [
    { name: 'VTuber', locked: false },
    { name: 'アイドル', locked: true },
    { name: 'ボカロ', locked: false },
    { name: '少年漫画', locked: false },
  ],
  times: { start: '21:00', end: '24:00' },
  region: '東海',
};

const PEOPLE = {
  mei: {
    nickname: 'めい', appId: 'mei', color: '#d6336c', trust: 'Steam連携・5年',
    games: [{ tag: 'splatoon3', platform: 'Switch', heat: 4, skill: 7 }, { tag: 'apex', platform: 'PC（Steam）', heat: 0, skill: 2 }],
    hobbies: [{ name: 'カフェ巡り', heat: 4 }, { name: 'TRPG', heat: 2 }],
    likes: [{ name: 'ボカロ' }, { name: '少年漫画' }, { name: 'アイドル', locked: true }],
    times: { start: '20:00', end: '23:00' }, region: '関東',
  },
  ken: {
    nickname: 'けん', appId: 'ken_r', color: '#12855f', trust: 'Discord連携',
    games: [{ tag: 'apex', platform: 'PC（Steam）', heat: 3, skill: 6 }, { tag: 'masterduel', platform: 'PC（Steam）', heat: 2, skill: 4 }],
    hobbies: [{ name: '筋トレ', heat: 3 }],
    likes: [{ name: 'SFアニメ' }, { name: 'VTuber' }],
    times: { start: '22:00', end: '25:00' }, region: '近畿',
  },
  sora: {
    nickname: 'そら', appId: 'sora3', color: '#1c7ed6', trust: null,
    games: [{ tag: 'splatoon3', platform: 'Switch 2', heat: 3, skill: 5 }],
    hobbies: [{ name: 'イラスト', heat: 3 }],
    likes: [{ name: 'ジブリ' }, { name: 'ボカロ' }],
    times: { start: '19:00', end: '22:00' }, region: '東海',
  },
};

// 参加する人が見る、同じゲームの募集（list-4：押したリンクの募集が一番上）
const LISTINGS = [
  { id: 'L1', by: 'mei', game: 'apex', when: '今夜 21:00〜', need: 2, platform: 'PC（Steam）', vc: 'あり', heat: 3, skill: 5, reasons: ['同じ時間帯', '同じボカロ好き'], via: 'Xに貼られた募集' },
  { id: 'L2', by: 'ken', game: 'apex', when: '今夜 22:30〜', need: 1, platform: 'PC（Steam）', vc: '聞き専OK', heat: 4, skill: 6, reasons: ['熱量が近い', '実力が近い'], via: 'Discordに貼られた募集' },
  { id: 'L3', by: 'sora', game: 'apex', when: '明日 20:00〜', need: 3, platform: 'PlayStation', vc: 'なし', heat: 1, skill: 3, reasons: ['同じ地方'], via: 'アプリ内' },
];
const ENDED_LISTINGS = [
  { id: 'E1', by: 'ken', game: 'apex', when: '昨日 21:00〜', need: 0, platform: 'PC（Steam）', vc: 'あり', heat: 3, skill: 5, reasons: ['熱量が近い'], via: 'LINEに貼られた募集' },
];

/* ---------- 状態 ---------- */

function freshState() {
  return {
    role: 'rec',
    me: structuredClone(ME),
    draft: null,
    saving: false,
    saveError: false,
    rec: {
      stage: 'draft', // draft → posted
      form: newRecruitForm('apex'),
      parts: { when: true, need: true, platform: true, vc: true, skill: true, heat: true },
      status: 'open', // open・closed・playing・ended・canceled
      room: '', inviteUrl: '',
      roomDraft: '', inviteDraft: '',
      editing: false,
      requests: [],
      keep: {},
      busy: '',
    },
    par: {
      sent: false,
      openJoin: null,
      listing: 'L1',
      gameId: '',
      saveToProfile: false,
      result: 'waiting', // waiting・matched・playing・ended・canceled
      keep: null,
      friendAdded: false,
    },
    conn: {
      incoming: [{ from: 'sora', via: 'アプリIDから', reasons: ['同じスプラトゥーン3', '同じ地方'] }],
      notices: [
        { kind: 'recruit', from: 'mei', game: 'splatoon3', text: '今夜 21:00〜 あと2人', sent: false },
        { kind: 'heat', from: 'ken', game: 'masterduel', text: '熱量が「ゆるめ」→「普通」に変わりました', invited: false },
      ],
      friends: ['mei', 'ken'],
      sentTo: [],
    },
  };
}

function newRecruitForm(tag) {
  const g = ME.games.find((x) => x.tag === tag);
  return {
    game: tag,
    when: '今夜',
    time: '21:00',
    need: 3,
    platform: g ? g.platform : PLATFORMS[0],
    vc: 'あり',
    heat: g ? g.heat : 2,
    skill: g ? g.skill : 5,
    saveToProfile: false,
  };
}

let state = freshState();

/* ---------- 小さな道具 ---------- */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const icon = {
  check: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  lock: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  shield: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  clock: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  party: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l5-14 9 9-14 5z"/><path d="M14 4l1 2M19 9l2 1M17 3l-1 3M21 7l-3 1"/></svg>',
  stop: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 9h6v6H9z"/></svg>',
};

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 2400);
}

// 保存をまねる。サーバーができたら fetch に置き換える
const fakeSave = () => new Promise((resolve) => setTimeout(resolve, 450));

const heatTag = (n) => `<span class="heat-tag h${n + 1}">${HEAT[n]}</span>`;
const art = (tag, cls = '') => `<span class="art ${cls}" style="--a:${GAMES[tag].a};--b:${GAMES[tag].b}" aria-hidden="true"></span>`;
const avatar = (p, cls = '') => `<span class="avatar ${cls}" style="--c:${p.color}" aria-hidden="true">${esc(p.nickname.slice(0, 1))}</span>`;
const trust = (t) => t
  ? `<span class="trust">${icon.shield}${esc(t)}</span>`
  : '<span class="trust is-none">連携なし</span>';

// 空（ui-2）：見出しと、次に何をすればよいか。ボタンは任意
function empty(title, text, button) {
  return `
    <div class="empty">
      <div class="empty-title">${esc(title)}</div>
      <p>${esc(text)}</p>
      ${button ? `<a class="btn-sub" href="${button.href}">${esc(button.label)}</a>` : ''}
    </div>`;
}

function heatSlider(value, key) {
  return `
    <div class="heat-slider h${value + 1}">
      <span class="end-label">ゆるい</span>
      <div class="heat-steps" role="group" aria-label="熱量">
        ${HEAT.map((label, i) => `<button type="button" class="heat-step${i <= value ? ' is-filled' : ''}"
          aria-pressed="${i === value}" aria-label="${label}" data-action="heat" data-key="${key}" data-value="${i}"></button>`).join('')}
      </div>
      <span class="end-label">ガチ</span>
    </div>
    <div class="note" style="text-align:center">${heatTag(value)}</div>`;
}

// ゲーム内IDは英数字だけ（app-23）、NGワードは入れられない（app-24）
function checkGameId(value) {
  if (!value) return 'ゲーム内IDを入れてください';
  if (!/^[A-Za-z0-9]+$/.test(value)) return '英数字だけで入れてください';
  if (NG_WORDS.some((w) => value.toLowerCase().includes(w))) return 'この言葉は入れられません';
  return '';
}
function hasNgWord(value) {
  return NG_WORDS.some((w) => String(value).toLowerCase().includes(w));
}

function recruitLine(f) {
  return `${f.when} ${f.time}〜 ・ あと${f.need}人`;
}

/* ---------- プロフィール ---------- */

function renderProfile() {
  if (state.draft) return renderProfileEdit();
  const p = state.me;
  return `
    <header class="app-bar"><h1>プロフィール</h1>
      <a class="mini-btn end" href="#/search-id">IDで探す</a>
    </header>

    <div class="cols"><div class="col is-sticky">
    <section class="card who">
      ${avatar(p)}
      <div class="who-col">
        <span class="nickname">${esc(p.nickname)}</span>
        <span class="app-id">アプリID <strong>${esc(p.appId)}</strong>
          <button type="button" class="mini-btn" data-action="copy-profile">リンクをコピー</button></span>
      </div>
      <button type="button" class="btn-sub" data-action="edit-profile">編集</button>
    </section>

    <section class="card">
      <dl class="kv">
        <dt>いつも遊ぶ時間帯</dt><dd class="num">${esc(p.times.start)}〜${esc(p.times.end)}</dd>
        <dt>住んでいる地方</dt><dd>${esc(p.region)}</dd>
      </dl>
    </section>

    </div><div class="col">

    <section class="block">
      <h2>ゲーム <span class="count num">${p.games.length}</span><span class="end note">押すと、そのゲームで募集を出す</span></h2>
      ${p.games.length ? `<div class="games">${p.games.map(gameRowMine).join('')}</div>`
        : `<div class="card">${empty('ゲームがまだ入っていません', '「編集」からゲームを入れると、合う募集が見つかりやすくなります。')}</div>`}
    </section>

    <section class="block">
      <h2>趣味</h2>
      <div class="card">${p.hobbies.length ? p.hobbies.map((h) => `
        <div class="hobby"><span class="hobby-name">${esc(h.name)}</span>${heatTag(h.heat)}</div>`).join('')
        : empty('趣味がまだ入っていません', '「編集」から入れられます。')}</div>
    </section>

    <section class="block">
      <h2>好きなもの <span class="end note">鍵をかけたものは自分だけに見える</span></h2>
      <div class="card pad">${p.likes.length ? `<div class="chips">${p.likes.map((l) => `
        <span class="chip${l.locked ? ' is-locked' : ''}">${l.locked ? icon.lock : ''}${esc(l.name)}</span>`).join('')}</div>`
        : empty('好きなものがまだ入っていません', '「編集」から入れられます。')}</div>
    </section>
    ${rightsNote()}
    </div></div>`;
}

function gameRowMine(g) {
  const game = GAMES[g.tag];
  return `
    <a class="game" href="#/create?game=${g.tag}">
      ${art(g.tag)}
      <div class="game-body">
        <h3>${esc(game.name)}</h3>
        <div class="meta"><span>${esc(g.platform)}</span><span>実力 <b class="num">${g.skill}</b></span>${heatTag(g.heat)}</div>
        ${g.steam ? `<div class="from-api">プレイ時間 <span class="num">${g.steam.hours}</span>時間 ・ Steamから ${esc(g.steam.updated)}に取得</div>` : ''}
      </div>
    </a>`;
}

// ゲームの画像の権利とIGDBへのリンク（app-11、app-22）
function rightsNote() {
  return `<p class="rights">ゲームの名前と画像は <a href="https://www.igdb.com/" target="_blank" rel="noopener">IGDB.com</a> から。画像の権利は各ゲーム会社にあります。外してほしいときは運営までご連絡ください。</p>`;
}

function renderProfileEdit() {
  const p = state.draft;
  const sel = (list, value, name, extra = '') => `<select class="field" ${extra} data-bind="${name}">${list.map((v) =>
    `<option${String(v) === String(value) ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>`;
  return `
    <header class="app-bar"><h1>プロフィールを編集</h1></header>

    <div class="cols"><div class="col is-sticky">
    <section class="card">
      <div class="form-row"><span class="form-label">ニックネーム</span>
        <div class="form-body"><input class="field" data-bind="nickname" value="${esc(p.nickname)}" maxlength="16"></div></div>
      <div class="form-row"><span class="form-label">アプリID</span>
        <div class="form-body">
          <input class="field" data-bind="appId" value="${esc(p.appId)}" maxlength="16" autocapitalize="off" spellcheck="false">
          <span class="note">プロフィールの短いURLになります（shumitomo.jp/${esc(p.appId || 'id')}）</span>
          <span class="field-hint">ゲーム内IDやSNSの名前とは別にしておくと安心です</span>
        </div></div>
      <div class="form-row"><span class="form-label">遊ぶ時間帯</span>
        <div class="form-body"><div class="row">
          <input class="field inline num" type="time" data-bind="times.start" value="${esc(p.times.start)}">〜
          <input class="field inline num" type="time" data-bind="times.end" value="${esc(p.times.end)}"></div></div></div>
      <div class="form-row"><span class="form-label">地方</span>
        <div class="form-body">${sel(REGIONS, p.region, 'region')}</div></div>
    </section>
    </div><div class="col">

    <section class="block"><h2>ゲーム</h2>
      <div class="card">
        ${p.games.map((g, i) => `
          <div class="edit-item">
            <div class="row">${art(g.tag)}<strong style="flex:1">${esc(GAMES[g.tag].name)}</strong>
              <button type="button" class="text-btn is-danger" data-action="remove" data-kind="games" data-index="${i}">削除</button></div>
            <div class="row">${sel(PLATFORMS, g.platform, `games.${i}.platform`)}
              ${sel(SKILLS.map((n) => `実力 ${n}`), `実力 ${g.skill}`, `games.${i}.skill`)}</div>
            ${heatSlider(g.heat, `games.${i}.heat`)}
            ${g.steam ? `<div class="from-api">プレイ時間 ${g.steam.hours}時間は Steam から自動で入ります（${esc(g.steam.updated)}に取得）</div>` : ''}
          </div>`).join('')}
        <div class="row" style="padding:0 12px 12px;flex-wrap:wrap">${Object.keys(GAMES).filter((t) => !p.games.some((g) => g.tag === t)).map((t) =>
          `<button type="button" class="add-chip" style="margin:0" data-action="add-game" data-tag="${t}">＋ ${esc(GAMES[t].name)}</button>`).join('')}</div>
      </div>
    </section>

    <section class="block"><h2>趣味</h2>
      <div class="card">
        ${p.hobbies.map((h, i) => `
          <div class="edit-item">
            <div class="row"><strong style="flex:1">${esc(h.name)}</strong>
              <button type="button" class="text-btn is-danger" data-action="remove" data-kind="hobbies" data-index="${i}">削除</button></div>
            ${heatSlider(h.heat, `hobbies.${i}.heat`)}
          </div>`).join('')}
        <div class="row" style="padding:0 12px 12px;flex-wrap:wrap">${HOBBY_SUGGEST.filter((n) => !p.hobbies.some((h) => h.name === n)).map((n) =>
          `<button type="button" class="add-chip" style="margin:0" data-action="add-hobby" data-name="${esc(n)}">＋ ${esc(n)}</button>`).join('')}</div>
      </div>
    </section>

    <section class="block"><h2>好きなもの <span class="end note">🔒を押すと鍵をかけられる</span></h2>
      <div class="card pad" style="gap:10px">
        <div class="chips">${p.likes.map((l, i) => `
          <span class="chip${l.locked ? ' is-locked' : ''}">
            <button type="button" class="text-btn" style="text-decoration:none" data-action="toggle-lock" data-index="${i}" aria-label="鍵">${l.locked ? icon.lock : '🔓'}</button>
            ${esc(l.name)}
            <button type="button" class="text-btn is-danger" style="text-decoration:none" data-action="remove" data-kind="likes" data-index="${i}" aria-label="削除">×</button>
          </span>`).join('')}</div>
        <div class="chips">${LIKE_SUGGEST.filter((n) => !p.likes.some((l) => l.name === n)).map((n) =>
          `<button type="button" class="add-chip" style="margin:0" data-action="add-like" data-name="${esc(n)}">＋ ${esc(n)}</button>`).join('')}</div>
        <div class="row"><input class="field inline" id="like-free" placeholder="候補に無いものを入れる" maxlength="20">
          <button type="button" class="btn-sub" data-action="add-like-free">追加</button></div>
      </div>
    </section>
    </div></div>

    ${state.saveError ? '<p class="error">プロフィールを保存できませんでした</p>' : ''}
    <div class="save-bar">
      <button type="button" class="btn-sub" data-action="cancel-profile">キャンセル</button>
      <button type="button" class="btn-main" data-action="save-profile"${state.saving ? ' disabled' : ''}>${state.saving ? '保存中…' : '保存'}</button>
    </div>`;
}

/* ---------- 他の人のプロフィール（あなたと同じ・つながりの申請） ---------- */

function renderPerson(params) {
  const id = params.get('id');
  const p = PEOPLE[id];
  if (!p) {
    return `<header class="app-bar"><a class="back" href="#/profile">‹</a><h1>プロフィール</h1></header>
      <div class="card">${empty('ページが見つかりません', 'アプリIDをもう一度確かめてください。', { href: '#/search-id', label: 'IDで探す' })}</div>`;
  }
  const me = state.me;
  // あなたと同じ（profile-14）：同じゲームと相手の熱量、同じ趣味、鍵のない同じ好きなもの
  const sameGames = p.games.filter((g) => me.games.some((m) => m.tag === g.tag));
  const sameHobbies = p.hobbies.filter((h) => me.hobbies.some((m) => m.name === h.name));
  const sameLikes = p.likes.filter((l) => !l.locked && me.likes.some((m) => m.name === l.name));
  const isFriend = state.conn.friends.includes(id);
  const sent = state.conn.sentTo.includes(id);
  return `
    <header class="app-bar"><a class="back" href="#/connections" aria-label="戻る">‹</a><h1>${esc(p.nickname)}</h1></header>

    <div class="cols"><div class="col is-sticky">
    <section class="card who">
      ${avatar(p)}
      <div class="who-col">
        <span class="nickname">${esc(p.nickname)}</span>
        <span class="app-id">アプリID <strong>${esc(p.appId)}</strong></span>
        ${trust(p.trust)}
      </div>
      ${isFriend ? '<span class="badge ok">つながり</span>'
        : `<button type="button" class="pill-btn${sent ? ' is-done' : ''}" data-action="send-conn" data-id="${id}"${sent ? ' disabled' : ''}>${sent ? '申請しました' : 'つながりの申請'}</button>`}
    </section>

    ${sameGames.length + sameHobbies.length + sameLikes.length ? `
    <section class="common">
      <div class="common-head">あなたと同じ</div>
      <div class="chips">
        ${sameGames.map((g) => `<span class="chip is-common">${esc(GAMES[g.tag].name)} ${heatTag(g.heat)}</span>`).join('')}
        ${sameHobbies.map((h) => `<span class="chip is-common">${esc(h.name)}</span>`).join('')}
        ${sameLikes.map((l) => `<span class="chip is-common">${esc(l.name)}</span>`).join('')}
      </div>
    </section>` : ''}

    <section class="card"><dl class="kv">
      <dt>いつも遊ぶ時間帯</dt><dd class="num">${esc(p.times.start)}〜${esc(p.times.end)}</dd>
      <dt>住んでいる地方</dt><dd>${esc(p.region)}</dd>
    </dl></section>
    </div><div class="col">

    <section class="block"><h2>ゲーム</h2>
      <div class="games">${p.games.map((g) => `
        <div class="game">${art(g.tag)}<div class="game-body"><h3>${esc(GAMES[g.tag].name)}</h3>
          <div class="meta"><span>${esc(g.platform)}</span><span>実力 <b class="num">${g.skill}</b></span>${heatTag(g.heat)}</div></div><span></span></div>`).join('')}</div>
    </section>

    <section class="block"><h2>趣味</h2>
      <div class="card">${p.hobbies.map((h) => `<div class="hobby"><span class="hobby-name">${esc(h.name)}</span>${heatTag(h.heat)}</div>`).join('')}</div>
    </section>

    <section class="block"><h2>好きなもの</h2>
      <div class="card pad"><div class="chips">${p.likes.filter((l) => !l.locked).map((l) =>
        `<span class="chip${me.likes.some((m) => m.name === l.name) ? ' is-common' : ''}">${esc(l.name)}</span>`).join('')}</div></div>
    </section>
    ${rightsNote()}
    </div></div>`;
}

// アプリIDを打つと、そのプロフィールが開く（profile-13）
function renderSearchId() {
  return `
    <header class="app-bar"><a class="back" href="#/profile" aria-label="戻る">‹</a><h1>IDで探す</h1></header>
    <section class="card pad" style="gap:8px">
      <p class="note">LINEのステータスメッセージなどに書かれたアプリIDを入れると、その人のプロフィールが開きます。</p>
      <form class="row" data-form="search-id">
        <input class="field inline" name="id" placeholder="例：mei" autocapitalize="off" spellcheck="false">
        <button class="btn-sub">開く</button>
      </form>
      <p class="note">見本：mei ・ ken_r ・ sora3</p>
    </section>`;
}

/* ---------- 募集を出す ---------- */

function renderCreate(params) {
  const r = state.rec;
  const tag = params.get('game');
  if (tag && GAMES[tag] && !r.editing && r.stage === 'draft' && r.form.game !== tag) r.form = newRecruitForm(tag);
  const f = r.form;
  const game = GAMES[f.game];
  const opts = (list, value, key) => `<div class="opts">${list.map((v) =>
    `<button type="button" class="opt" aria-pressed="${String(v) === String(value)}" data-action="set" data-key="${key}" data-value="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;
  const invite = inviteText();
  const editing = r.editing;

  return `
    <header class="app-bar">
      ${editing ? '<a class="back" href="#/requests" aria-label="戻る">‹</a>' : ''}
      <h1>${editing ? '募集を編集' : '募集を出す'}</h1>
    </header>

    <div class="cols is-even"><div class="col">
    <section class="card">
      <div class="form-row"><span class="form-label">ゲーム</span>
        <div class="form-body"><div class="row">${art(f.game)}<strong>${esc(game.name)}</strong></div>
          ${editing ? '' : `<div class="opts">${state.me.games.map((g) =>
            `<button type="button" class="opt" aria-pressed="${g.tag === f.game}" data-action="pick-game" data-tag="${g.tag}">${esc(GAMES[g.tag].name)}</button>`).join('')}</div>
          <span class="note">プロフィールのゲームが上に出ます</span>`}</div></div>
      <div class="form-row"><span class="form-label">いつ</span>
        <div class="form-body">${opts(['今夜', '明日', '週末', '未定'], f.when, 'when')}
          <input class="field num" type="time" data-bind-rec="time" value="${esc(f.time)}"${f.when === '未定' ? ' disabled' : ''}></div></div>
      <div class="form-row"><span class="form-label">人数</span>
        <div class="form-body"><div class="stepper">
          <button type="button" class="step" data-action="need" data-delta="-1" aria-label="減らす">−</button>
          <span class="num" style="font-size:18px">${f.need}</span><span>人（自分を除く）</span>
          <button type="button" class="step" data-action="need" data-delta="1" aria-label="増やす">＋</button></div></div></div>
      <div class="form-row"><span class="form-label">機種</span><div class="form-body">${opts(PLATFORMS, f.platform, 'platform')}</div></div>
      <div class="form-row"><span class="form-label">VC</span><div class="form-body">${opts(VC, f.vc, 'vc')}</div></div>
      <div class="form-row"><span class="form-label">実力</span><div class="form-body">${opts(SKILLS, f.skill, 'skill')}<span class="note">1〜9。大きいほど上手い</span></div></div>
      <div class="form-row"><span class="form-label">熱量</span><div class="form-body">${heatSlider(f.heat, 'rec.heat')}</div></div>
      <div class="form-row"><span class="form-label">保存</span>
        <div class="form-body"><label class="check"><input type="checkbox" data-action="toggle-save"${f.saveToProfile ? ' checked' : ''}> プロフィールにも保存</label>
          <span class="note">機種・実力・熱量を、プロフィールの${esc(game.name)}にも入れます</span></div></div>
    </section>
    </div><div class="col is-sticky">

    ${editing ? `
      <section class="card">
        <div class="form-row"><span class="form-label">部屋番号</span>
          <div class="form-body"><input class="field num" data-bind-rec="roomDraft" value="${esc(r.roomDraft)}" placeholder="例：4821" inputmode="numeric"></div></div>
        <div class="form-row"><span class="form-label">招待URL</span>
          <div class="form-body"><input class="field" data-bind-rec="inviteDraft" value="${esc(r.inviteDraft)}" placeholder="https://…"></div></div>
      </section>
      <button type="button" class="btn-main" data-action="save-edit"${r.busy ? ' disabled' : ''}>${r.busy ? '保存中…' : '変更を保存'}</button>
      <a class="text-btn" style="justify-self:center;align-self:center" href="#/requests">保存せずに戻る</a>`
    : `
      <section class="block">
        <h2>招待状 <span class="end note"><span class="num">${invite.length}</span> / 140字</span></h2>
        <div class="card">
          <div class="row" style="padding:10px 12px 8px;flex-wrap:wrap;gap:6px">
            <span class="form-label" style="padding:0">載せる項目</span>
            ${[['when', 'いつ'], ['need', '人数'], ['platform', '機種'], ['vc', 'VC'], ['skill', '実力'], ['heat', '熱量']].map(([k, label]) =>
              `<button type="button" class="opt" aria-pressed="${r.parts[k]}" data-action="part" data-key="${k}">${label}</button>`).join('')}
          </div>
          <div class="invite">${esc(invite).replace(/(https:\/\/\S+)/, '<span class="invite-link">$1</span>')}</div>
        </div>
      </section>

      <section class="block">
        <h2>公開して共有</h2>
        <div class="shares">
          <button type="button" class="share" data-action="publish" data-via="x">公開してXで共有</button>
          <button type="button" class="share" data-action="publish" data-via="threads">公開してThreadsで共有</button>
          <button type="button" class="share" data-action="publish" data-via="line">公開してLINEで共有</button>
          <button type="button" class="share" data-action="publish" data-via="copy">公開してコピー</button>
        </div>
        <button type="button" class="text-btn" style="justify-self:center;margin-top:6px" data-action="publish" data-via="none">貼らずに出す</button>
      </section>`}
    </div></div>`;
}

// 招待状は普通の募集の投稿と同じ見た目で、#ゲーム名募集 が入る（recruit-8, 9）
function inviteText() {
  const { form: f, parts } = state.rec;
  const name = GAMES[f.game].name;
  const lines = [`【${name}】一緒に遊べる人募集！`];
  const detail = [];
  if (parts.when) detail.push(f.when === '未定' ? '日時は相談' : `${f.when} ${f.time}〜`);
  if (parts.need) detail.push(`あと${f.need}人`);
  if (detail.length) lines.push(detail.join(' ・ '));
  const cond = [];
  if (parts.platform) cond.push(f.platform);
  if (parts.vc) cond.push(`VC${f.vc}`);
  if (parts.skill) cond.push(`実力${f.skill}`);
  if (parts.heat) cond.push(`熱量：${HEAT[f.heat]}`);
  if (cond.length) lines.push(cond.join(' / '));
  lines.push(`#${name.replace(/\s/g, '')}募集`);
  lines.push('https://shumitomo.jp/r/a8k2');
  return lines.join('\n');
}

/* ---------- 届いた参加希望（募集する人） ---------- */

const REC_STATUS = {
  open: ['受付中', 'ok'],
  closed: ['受付終了', 'rest'],
  playing: ['遊んでいる最中', 'warn'],
  ended: ['遊びは終了しました', 'rest'],
  canceled: ['開催中止', 'danger'],
};

function renderRequests() {
  const r = state.rec;
  if (r.stage !== 'posted') {
    return `<header class="app-bar"><h1>届いた参加希望</h1></header>
      <div class="card">${empty('まだ募集を出していません', 'プロフィールのゲームを押すと、募集を出せます。', { href: '#/create', label: '募集を出す' })}</div>`;
  }
  const f = r.form;
  const [label, tone] = REC_STATUS[r.status];
  const live = r.status !== 'ended' && r.status !== 'canceled';
  const matched = r.requests.filter((q) => q.status === 'matched');

  return `
    <header class="app-bar"><h1>届いた参加希望</h1></header>

    <div class="cols"><div class="col is-sticky">
    <section class="card">
      <div class="manage-state">${art(f.game)}
        <div class="game-body" style="flex:1"><h3>${esc(GAMES[f.game].name)}</h3>
          <div class="meta"><span>${esc(recruitLine(f))}</span><span>成立 <b class="num">${matched.length}</b>人</span></div></div>
        <span class="badge ${tone}">${label}</span></div>
      ${live && (r.room || r.inviteUrl) ? `<div class="join-info" style="padding:0 12px 10px">${joinInfoRows(r.room, r.inviteUrl)}</div>` : ''}
      ${live ? `<div class="manage">
        <a class="btn-sub" href="#/create" data-action="start-edit">編集</a>
        ${r.status === 'open' ? `<button type="button" class="btn-sub" data-action="rec-status" data-to="closed">募集の受付を終える</button>` : ''}
        ${r.status !== 'playing' ? `<button type="button" class="btn-sub" data-action="rec-status" data-to="playing">遊び始める</button>` : ''}
        <button type="button" class="btn-sub" data-action="rec-status" data-to="ended">遊び終える</button>
        <button type="button" class="btn-sub is-danger" data-action="rec-status" data-to="canceled">開催を中止する</button>
      </div>` : ''}
      ${r.status === 'canceled' ? '<p class="note" style="padding:0 12px 12px">開催を中止しました。部屋番号・招待リンクと参加者のゲーム内IDは表示しません。</p>' : ''}
    </section>
    </div><div class="col">

    ${r.status === 'ended' ? `
      <section class="block"><h2>一緒に遊んだ人</h2>
        <div class="card">${matched.length ? matched.map((q) => keepRow(q.person, r.keep[q.person], 'rec-keep')).join('')
          : empty('成立した人はいませんでした', '次の募集を出してみましょう。', { href: '#/profile', label: 'プロフィールへ' })}</div>
        <p class="note">つながりは、お互いに「残す」を選んだときだけできます。後から外したりブロックしたりもできます。</p>
      </section>` : `
      <section class="block">
        <h2>参加希望 <span class="count num">${r.requests.length}</span><span class="end note">合う順</span></h2>
        ${r.requests.length ? r.requests.map((q) => requestRow(q, live)).join('')
          : `<div class="card">${empty('参加希望はまだ届いていません', '招待状をSNSに貼ると、届きやすくなります。')}</div>`}
      </section>`}
    </div></div>`;
}

// 参加希望に出るのは、名前・合う理由・信頼の目安だけ（requests-2）。断るボタンは無い（requests-5）
function requestRow(q, live) {
  const p = PEOPLE[q.person];
  const name = p ? p.nickname : q.gameId;
  const btn = q.status === 'matched'
    ? `<span class="badge ok">${icon.check} 成立</span>`
    : `<button type="button" class="pill-btn is-ok" data-action="approve" data-id="${q.id}"${!live || state.rec.status === 'closed' || q.busy ? ' disabled' : ''}>${q.busy ? '承認中…' : '承認'}</button>`;
  return `
    <article class="card listing">
      <div class="listing-head">${p ? avatar(p, 'sm') : ''}<span class="listing-main">${esc(name)}</span>
        <span class="note" style="margin-left:auto">${esc(q.via)}から</span></div>
      <div class="reasons">${q.reasons.map((x) => `<span class="reason">${esc(x)}</span>`).join('')}</div>
      <div class="listing-foot">${trust(p?.trust)}${btn}</div>
      ${q.status === 'matched' && state.rec.status !== 'canceled' && GAMES[state.rec.form.game].join === 'id'
        ? `<div class="join-info-row"><span class="label">ゲーム内ID</span><span class="value">${esc(q.gameId)}</span>
            <button type="button" class="mini-btn" data-action="copy" data-text="${esc(q.gameId)}">コピー</button></div>` : ''}
    </article>`;
}

function keepRow(personId, kept, action) {
  const p = PEOPLE[personId];
  return `
    <div class="notice"><div class="notice-head">${avatar(p, 'sm')}<strong>${esc(p.nickname)}</strong>
      <span style="margin-left:auto">${kept === undefined || kept === null
        ? `<button type="button" class="pill-btn" data-action="${action}" data-id="${personId}" data-keep="1">残す</button>
           <button type="button" class="text-btn" style="margin-left:8px" data-action="${action}" data-id="${personId}" data-keep="0">残さない</button>`
        : kept ? '<span class="badge ok">残す</span>' : '<span class="badge rest">残さない</span>'}</span></div></div>`;
}

function joinInfoRows(room, url) {
  // 入る場所が先に出る（matched-3）
  return `
    ${room ? `<div class="join-info-row"><span class="label">部屋番号</span><span class="value">${esc(room)}</span>
      <button type="button" class="mini-btn" data-action="copy" data-text="${esc(room)}">番号をコピー</button></div>` : ''}
    ${url ? `<div class="join-info-row"><span class="label">招待URL</span><span class="note" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(url)}</span>
      <a class="mini-btn" href="${esc(url)}" target="_blank" rel="noopener">招待リンクを開く</a></div>` : ''}`;
}

/* ---------- 募集一覧（参加する人） ---------- */

function renderList() {
  const par = state.par;
  const pinned = LISTINGS.find((l) => l.id === par.listing) || LISTINGS[0];
  const others = LISTINGS.filter((l) => l !== pinned);
  const game = GAMES[pinned.game];
  return `
    <header class="app-bar">${art(pinned.game)}<h1>${esc(game.name)}の募集</h1>
      <span class="badge ok end num">${LISTINGS.length}件</span></header>

    <p class="note">登録しなくても見られます。「参加したい」を押すときはログインします。</p>

    <section class="block">
      <h2>押した募集</h2>
      <div class="listing-grid">${listingRow(pinned, true)}</div>
    </section>

    <section class="block">
      <h2>同じゲームのほかの募集 <span class="end note">合う順</span></h2>
      ${others.length ? `<div class="listing-grid">${others.map((l) => listingRow(l, false)).join('')}</div>`
        : `<div class="card">${empty('このゲームの募集はまだありません', '自分で募集を出すこともできます。')}</div>`}
    </section>

    <section class="block">
      <h2>終わった募集</h2>
      ${ENDED_LISTINGS.length ? `<div class="listing-grid">${ENDED_LISTINGS.map(endedRow).join('')}</div>`
        : `<div class="card">${empty('終わった募集はありません', '')}</div>`}
    </section>

    <section class="card pad" style="justify-items:center;gap:8px;text-align:center">
      <p class="note">合う募集がない？</p>
      <button type="button" class="btn-sub" data-action="become-rec" data-tag="${pinned.game}">自分も募集を出す</button>
    </section>
    ${rightsNote()}`;
}

function listingRow(l, pinned) {
  const p = PEOPLE[l.by];
  const par = state.par;
  const open = par.openJoin === l.id;
  const needsId = GAMES[l.game].join === 'id';
  const err = open && par.idTouched ? checkGameId(par.gameId) : '';
  return `
    <article class="card listing${pinned ? ' is-pinned' : ''}">
      <div class="listing-head">${avatar(p, 'sm')}<a href="#/person?id=${l.by}" class="listing-main" style="text-decoration:none">${esc(p.nickname)}</a>
        <span class="note" style="margin-left:auto">${esc(l.via)}</span></div>
      <div class="listing-main">${esc(l.when)} ・ あと<span class="num">${l.need}</span>人</div>
      <div class="meta"><span>${esc(l.platform)}</span><span>VC${esc(l.vc)}</span><span>実力 <b class="num">${l.skill}</b></span>${heatTag(l.heat)}</div>
      <div class="reasons">${l.reasons.map((x) => `<span class="reason">${esc(x)}</span>`).join('')}</div>
      <div class="listing-foot">${trust(p.trust)}
        ${open ? '' : `<button type="button" class="pill-btn" data-action="open-join" data-id="${l.id}"${par.sent ? ' disabled' : ''}>${par.sent ? '送信済み' : '参加したい'}</button>`}</div>
      ${open ? `
        <form class="join-form" data-form="join" data-id="${l.id}">
          ${needsId ? `
            <label class="form-body"><span class="form-label" style="padding:0">ゲーム内ID（フレンドコードなど）</span>
              <input class="field num" name="gameId" value="${esc(par.gameId)}" autocapitalize="off" spellcheck="false" placeholder="英数字だけ" data-bind-par="gameId">
              <span class="field-hint">SNSと同じ名前を使っていませんか？</span>
              ${err ? `<span class="error">${esc(err)}</span>` : ''}</label>
            <span class="note">ゲーム内IDは、承認されたときだけ相手に見えます。</span>` : '<span class="note">この募集は部屋番号で入ります。ゲーム内IDは要りません。</span>'}
          <label class="check"><input type="checkbox" data-action="toggle-par-save"${par.saveToProfile ? ' checked' : ''}> プロフィールにも保存</label>
          <div class="row"><button class="btn-main" style="flex:1">参加希望を送る</button>
            <button type="button" class="text-btn" data-action="close-join">やめる</button></div>
        </form>` : ''}
    </article>`;
}

// 終わった募集には参加できないが、募集した人につながりの申請を送れる（list-12）
function endedRow(l) {
  const p = PEOPLE[l.by];
  const sent = state.conn.sentTo.includes(l.by) || state.conn.friends.includes(l.by);
  return `
    <article class="card listing is-ended">
      <div class="listing-head">${avatar(p, 'sm')}<span class="listing-main">${esc(p.nickname)}</span><span class="badge rest" style="margin-left:auto">終了</span></div>
      <div class="meta"><span>${esc(l.when)}</span><span>${esc(l.platform)}</span>${heatTag(l.heat)}</div>
      <div class="listing-foot">${trust(p.trust)}
        <button type="button" class="pill-btn${sent ? ' is-done' : ''}" data-action="send-conn" data-id="${l.by}"${sent ? ' disabled' : ''}>${sent ? '申請済み' : 'つながりの申請'}</button></div>
    </article>`;
}

/* ---------- 成立（参加する人） ---------- */

function renderMatched() {
  const par = state.par;
  const l = LISTINGS.find((x) => x.id === par.listing);
  const p = PEOPLE[l.by];
  const game = GAMES[l.game];
  const head = `
    <header class="app-bar"><h1>参加の結果</h1></header>
    <section class="card listing">
      <div class="listing-head">${art(l.game)}<div class="game-body"><h3>${esc(game.name)}</h3>
        <div class="meta"><span>${esc(p.nickname)}の募集</span><span>${esc(l.when)}</span></div></div></div>
    </section>`;

  if (par.result === 'waiting') {
    return `${head}
      <section class="card status-card">
        <div class="status-head"><span class="pulse"></span>承認を待っています</div>
        <p class="note">承認されると、この画面がその場で切り替わります。閉じても、同じリンクを開き直せば結果が出ます。</p>
        <button type="button" class="demo-next" data-action="par-result" data-to="matched">（デモ）承認された</button>
      </section>
      <a class="btn-sub" href="#/list" style="align-self:center">ほかの募集も見る</a>`;
  }
  if (par.result === 'canceled') {
    return `${head}
      <section class="card status-card is-rest">
        <div class="status-head"><span class="status-icon">${icon.stop}</span>この募集の開催は中止されました</div>
        <p class="note">部屋番号・招待リンクは表示しません。同じゲームの今出ている募集から探せます。</p>
        <a class="btn-sub" href="#/list" data-action="reset-par">同じゲームの募集を見る</a>
      </section>`;
  }
  if (par.result === 'ended') {
    return `${head}
      <section class="card status-card is-rest">
        <div class="status-head"><span class="status-icon">${icon.party}</span>遊びは終了しました</div>
        <p class="note">部屋番号・招待URL・ゲーム内IDは、もう表示しません。</p>
      </section>
      <section class="block"><h2>つながりを残しますか？</h2>
        <div class="card">${keepRow(l.by, par.keep, 'par-keep')}</div>
        <p class="note">お互いに「残す」を選ぶとつながります。後から外したりブロックしたりできます。</p>
      </section>`;
  }
  // matched・playing
  const room = '4821';
  return `${head}
    <section class="card status-card is-ok">
      <div class="status-head"><span class="status-icon">${icon.check}</span>${par.result === 'playing' ? '遊んでいる最中' : '成立しました'}</div>
      <div class="join-info">
        ${game.join === 'room' ? joinInfoRows(room, '') : `
          <p class="note">募集した人が、あなたのゲーム内IDに招待を送ります。</p>
          <div class="join-info-row"><span class="label">あなたのID</span><span class="value">${esc(par.gameId)}</span></div>`}
      </div>
      ${l.game === 'apex' || l.platform.includes('Steam') ? `<button type="button" class="mini-btn${par.friendAdded ? ' is-done' : ''}" data-action="steam-friend">${par.friendAdded ? 'フレンド申請を送りました' : 'Steamでフレンドに追加'}</button>` : ''}
      <p class="note">後からフレンドを削除・ブロックできます。</p>
      <div class="row" style="flex-wrap:wrap">
        ${par.result !== 'playing' ? '<button type="button" class="demo-next" data-action="par-result" data-to="playing">（デモ）遊び始めた</button>' : ''}
        <button type="button" class="demo-next" data-action="par-result" data-to="ended">（デモ）遊び終わった</button>
        <button type="button" class="demo-next" data-action="par-result" data-to="canceled">（デモ）開催中止</button>
      </div>
    </section>`;
}

/* ---------- つながり ---------- */

function renderConnections() {
  const c = state.conn;
  const me = state.me;
  return `
    <header class="app-bar"><h1>つながり</h1></header>

    <div class="cols is-even"><div class="col">
    <section class="block"><h2>届いた申請 <span class="count num">${c.incoming.length}</span></h2>
      <div class="card">${c.incoming.length ? c.incoming.map((q) => {
        const p = PEOPLE[q.from];
        return `<div class="notice">
          <div class="notice-head">${avatar(p, 'sm')}<a href="#/person?id=${q.from}" style="font-weight:700">${esc(p.nickname)}</a>
            <span class="note">${esc(q.via)}</span></div>
          <div class="reasons">${q.reasons.map((x) => `<span class="reason">${esc(x)}</span>`).join('')}</div>
          <div class="listing-foot">${trust(p.trust)}
            <button type="button" class="pill-btn is-ok" data-action="accept-conn" data-id="${q.from}">つながる</button></div>
        </div>`;
      }).join('') : empty('届いた申請はありません', '一緒に遊んだ人や、プロフィールを見た人から届きます。')}</div>
    </section>

    <section class="block"><h2>知らせ</h2>
      <div class="card">${c.notices.length ? c.notices.map((n, i) => {
        const p = PEOPLE[n.from];
        if (n.kind === 'recruit') {
          return `<div class="notice">
            <div class="notice-head">${art(n.game)}<div class="game-body"><strong>${esc(p.nickname)}が募集を出しました</strong>
              <span class="note">${esc(GAMES[n.game].name)} ・ ${esc(n.text)}</span></div></div>
            <button type="button" class="pill-btn${n.sent ? ' is-done' : ''}" style="justify-self:end" data-action="notice-join" data-index="${i}"${n.sent ? ' disabled' : ''}>${n.sent ? '送信済み' : '参加希望を送る'}</button>
          </div>`;
        }
        return `<div class="notice">
          <div class="notice-head">${art(n.game)}<div class="game-body"><strong>${esc(p.nickname)}の${esc(GAMES[n.game].name)}</strong>
            <span class="note">${esc(n.text)}</span></div></div>
          <button type="button" class="pill-btn${n.invited ? ' is-done' : ''}" style="justify-self:end" data-action="notice-invite" data-index="${i}"${n.invited ? ' disabled' : ''}>${n.invited ? '誘いました' : 'このゲームで誘う'}</button>
        </div>`;
      }).join('') : empty('知らせはまだありません', 'つながった相手が募集を出すと、ここに届きます。')}</div>
    </section>
    </div><div class="col">

    <section class="block"><h2>つながった相手 <span class="count num">${c.friends.length}</span></h2>
      ${c.friends.length ? c.friends.map((id) => {
        const p = PEOPLE[id];
        const common = p.games.filter((g) => me.games.some((m) => m.tag === g.tag));
        return `<article class="card listing">
          <div class="listing-head">${avatar(p, 'sm')}<a href="#/person?id=${id}" class="listing-main" style="text-decoration:none">${esc(p.nickname)}</a>
            <span class="note num" style="margin-left:auto">${icon.clock} ${esc(p.times.start)}〜${esc(p.times.end)}</span></div>
          <div class="chips">${p.games.map((g) => `<span class="chip${me.games.some((m) => m.tag === g.tag) ? ' is-common' : ''}">${me.games.some((m) => m.tag === g.tag) ? icon.check : ''}${esc(GAMES[g.tag].name)} ${heatTag(g.heat)}</span>`).join('')}
            ${p.hobbies.filter((h) => me.hobbies.some((m) => m.name === h.name)).map((h) => `<span class="chip is-common">${icon.check}${esc(h.name)}</span>`).join('')}
            ${p.likes.filter((l) => !l.locked && me.likes.some((m) => m.name === l.name)).map((l) => `<span class="chip is-common">${icon.check}${esc(l.name)}</span>`).join('')}</div>
          <div class="listing-foot">
            <button type="button" class="text-btn is-danger" data-action="remove-friend" data-id="${id}">つながりを外す</button>
            ${common.length ? `<button type="button" class="pill-btn" data-action="invite-friend" data-id="${id}" data-tag="${common[0].tag}">${esc(GAMES[common[0].tag].name)}で誘う</button>` : ''}
          </div>
        </article>`;
      }).join('') : `<div class="card">${empty('つながった相手はまだいません', '一緒に遊んだあと「残す」を選ぶと、ここに並びます。')}</div>`}
    </section>
    </div></div>`;
}

/* ---------- 画面の切り替え ---------- */

const ROUTES = {
  profile: { tab: 'profile', render: renderProfile },
  person: { tab: 'profile', render: renderPerson },
  'search-id': { tab: 'profile', render: renderSearchId },
  create: { tab: 'recruit', render: renderCreate },
  requests: { tab: 'recruit', render: renderRequests },
  list: { tab: 'recruit', render: renderList },
  matched: { tab: 'recruit', render: renderMatched },
  connections: { tab: 'connections', render: renderConnections },
};

// 「募集」のタブで開く画面は、そのときの立場で変わる（アプリ全体の「下のタブ」の表）
function recruitTabTarget() {
  if (state.role === 'rec') return state.rec.stage === 'posted' ? 'requests' : 'create';
  return state.par.sent ? 'matched' : 'list';
}

function currentRoute() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  let name = path === 'recruit' ? recruitTabTarget() : path;
  if (!ROUTES[name]) name = 'profile';
  return { name, params: new URLSearchParams(query) };
}

function render() {
  const { name, params } = currentRoute();
  const view = document.getElementById('view');
  view.innerHTML = ROUTES[name].render(params);
  // 1列で足りる画面は、広い画面でも横に伸ばしすぎない
  view.classList.toggle('is-narrow', name === 'matched' || name === 'search-id');
  document.querySelectorAll('.tab').forEach((tab) => {
    if (tab.dataset.tab === ROUTES[name].tab) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-action="role"]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.role === state.role));
  });
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

/* ---------- 操作 ---------- */

// draft の中の "games.0.heat" のような場所に値を入れる
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

const actions = {
  role(el) {
    state.role = el.dataset.role;
    go('#/recruit');
  },
  reset() {
    state = freshState();
    go('#/profile');
    toast('最初の状態に戻しました');
  },

  // プロフィール
  'edit-profile'() {
    state.draft = structuredClone(state.me);
    state.saveError = false;
    render();
  },
  'cancel-profile'() {
    // 編集での追加・変更・削除を取り消して、保存済みの表示に戻す（profile-22）
    state.draft = null;
    state.saveError = false;
    render();
  },
  async 'save-profile'() {
    const d = state.draft;
    if (!d.nickname.trim()) return toast('ニックネームを入れてください');
    if (hasNgWord(d.nickname) || hasNgWord(d.appId)) return toast('名前に入れられない言葉があります');
    if (!/^[A-Za-z0-9_]+$/.test(d.appId)) return toast('アプリIDは英数字と _ で入れてください');
    state.saving = true;
    render();
    try {
      await fakeSave();
      state.me = structuredClone(d);
      state.draft = null;
      toast('保存しました');
    } catch (e) {
      state.saveError = true;
    } finally {
      state.saving = false;
      render();
    }
  },
  heat(el) {
    const value = Number(el.dataset.value);
    const key = el.dataset.key;
    if (key === 'rec.heat') state.rec.form.heat = value;
    else setPath(state.draft, key, value);
    render();
  },
  remove(el) {
    state.draft[el.dataset.kind].splice(Number(el.dataset.index), 1);
    render();
  },
  'add-game'(el) {
    state.draft.games.push({ tag: el.dataset.tag, platform: PLATFORMS[0], heat: 2, skill: 5 });
    render();
  },
  'add-hobby'(el) {
    state.draft.hobbies.push({ name: el.dataset.name, heat: 2 });
    render();
  },
  'add-like'(el) {
    state.draft.likes.push({ name: el.dataset.name, locked: false });
    render();
  },
  'add-like-free'() {
    const input = document.getElementById('like-free');
    const name = input.value.trim();
    if (!name) return;
    if (hasNgWord(name)) return toast('この言葉は入れられません');
    state.draft.likes.push({ name, locked: false });
    render();
  },
  'toggle-lock'(el) {
    const like = state.draft.likes[Number(el.dataset.index)];
    like.locked = !like.locked;
    render();
  },
  async 'copy-profile'() {
    await copyText(`https://shumitomo.jp/${state.me.appId}`, 'プロフィールのリンクをコピーしました');
  },
  async copy(el) {
    await copyText(el.dataset.text, 'コピーしました');
  },

  // 募集を出す
  'pick-game'(el) {
    state.rec.form = newRecruitForm(el.dataset.tag);
    render();
  },
  set(el) {
    const key = el.dataset.key;
    state.rec.form[key] = key === 'skill' ? Number(el.dataset.value) : el.dataset.value;
    render();
  },
  need(el) {
    const f = state.rec.form;
    f.need = Math.min(20, Math.max(1, f.need + Number(el.dataset.delta)));
    render();
  },
  'toggle-save'(el) {
    state.rec.form.saveToProfile = el.checked;
  },
  part(el) {
    const k = el.dataset.key;
    state.rec.parts[k] = !state.rec.parts[k];
    render();
  },
  async publish(el) {
    const via = el.dataset.via;
    const r = state.rec;
    const text = inviteText();
    if (inviteText().length > 140 && via === 'x') return toast('招待状が長すぎます。載せる項目を減らしてください');
    await fakeSave();
    r.stage = 'posted';
    r.status = 'open';
    if (r.form.saveToProfile) saveGameToProfile(r.form);
    // 見本の参加希望が届いたことにする
    r.requests = [
      { id: 'Q1', person: 'mei', gameId: 'MeiSplash22', via: 'X', reasons: ['同じ時間帯', '同じボカロ好き', '熱量が近い'], status: 'pending' },
      { id: 'Q2', person: 'ken', gameId: 'kenR0811', via: 'ほかの人の招待状', reasons: ['実力が近い'], status: 'pending' },
      { id: 'Q3', person: 'sora', gameId: 'sora3gm', via: 'アプリ内の検索', reasons: ['同じ地方'], status: 'pending' },
    ];
    const encoded = encodeURIComponent(text);
    if (via === 'x') window.open(`https://x.com/intent/post?text=${encoded}`, '_blank', 'noopener');
    if (via === 'threads') window.open(`https://www.threads.net/intent/post?text=${encoded}`, '_blank', 'noopener');
    if (via === 'line') window.open(`https://line.me/R/share?text=${encoded}`, '_blank', 'noopener');
    if (via === 'copy') await copyText(text, '公開して、招待状をコピーしました');
    else toast('募集を公開しました');
    // 「貼らずに出す」は、公開が済むと届いた参加希望の画面が開く（recruit-19）
    go('#/requests');
  },
  'start-edit'() {
    const r = state.rec;
    r.editing = true;
    r.saved = structuredClone(r.form);
    r.roomDraft = r.room;
    r.inviteDraft = r.inviteUrl;
  },
  async 'save-edit'() {
    const r = state.rec;
    if (r.inviteDraft && !/^https:\/\//.test(r.inviteDraft)) return toast('招待URLは https:// から入れてください');
    r.busy = 'edit';
    render();
    await fakeSave();
    r.room = r.roomDraft.trim();
    r.inviteUrl = r.inviteDraft.trim();
    r.editing = false;
    r.busy = '';
    toast('募集の変更を保存しました');
    go('#/requests');
  },
  async 'rec-status'(el) {
    const to = el.dataset.to;
    if (to === 'canceled' && !confirm('開催を中止しますか？参加する人に知らせが届きます。')) return;
    await fakeSave();
    state.rec.status = to;
    toast(REC_STATUS[to][0]);
    render();
  },
  async approve(el) {
    const q = state.rec.requests.find((x) => x.id === el.dataset.id);
    q.busy = true;
    render();
    await fakeSave();
    q.busy = false;
    // 成立はサーバーで確定してから表示する（requests-4）
    q.status = 'matched';
    toast(`${PEOPLE[q.person].nickname}さんと成立しました`);
    render();
  },
  'rec-keep'(el) {
    state.rec.keep[el.dataset.id] = el.dataset.keep === '1';
    if (el.dataset.keep === '1') toast('相手も「残す」を選ぶと、つながります');
    render();
  },

  // 参加する人
  'open-join'(el) {
    state.par.openJoin = el.dataset.id;
    state.par.idTouched = false;
    render();
  },
  'close-join'() {
    state.par.openJoin = null;
    render();
  },
  'toggle-par-save'(el) {
    state.par.saveToProfile = el.checked;
  },
  'become-rec'(el) {
    state.role = 'rec';
    state.rec.stage = 'draft';
    state.rec.form = newRecruitForm(el.dataset.tag);
    go('#/create');
  },
  'par-result'(el) {
    state.par.result = el.dataset.to;
    render();
  },
  'reset-par'() {
    state.par.sent = false;
    state.par.result = 'waiting';
  },
  'par-keep'(el) {
    state.par.keep = el.dataset.keep === '1';
    if (state.par.keep) toast('相手も「残す」を選ぶと、つながります');
    render();
  },
  'steam-friend'() {
    state.par.friendAdded = true;
    render();
  },

  // つながり
  'send-conn'(el) {
    state.conn.sentTo.push(el.dataset.id);
    toast('つながりの申請を送りました');
    render();
  },
  'accept-conn'(el) {
    const id = el.dataset.id;
    state.conn.incoming = state.conn.incoming.filter((q) => q.from !== id);
    if (!state.conn.friends.includes(id)) state.conn.friends.push(id);
    toast(`${PEOPLE[id].nickname}さんとつながりました`);
    render();
  },
  'remove-friend'(el) {
    const id = el.dataset.id;
    if (!confirm(`${PEOPLE[id].nickname}さんとのつながりを外しますか？`)) return;
    state.conn.friends = state.conn.friends.filter((x) => x !== id);
    render();
  },
  'invite-friend'(el) {
    toast(`${PEOPLE[el.dataset.id].nickname}さんを${GAMES[el.dataset.tag].name}に誘いました`);
  },
  'notice-join'(el) {
    state.conn.notices[Number(el.dataset.index)].sent = true;
    toast('参加希望を送りました');
    render();
  },
  'notice-invite'(el) {
    state.conn.notices[Number(el.dataset.index)].invited = true;
    toast('誘いました');
    render();
  },
};

function saveGameToProfile(f) {
  const games = state.me.games;
  const g = games.find((x) => x.tag === f.game);
  const values = { platform: f.platform, heat: f.heat, skill: f.skill };
  if (g) Object.assign(g, values);
  else games.push({ tag: f.game, ...values });
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch (e) {
    toast(text);
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  if (el.tagName === 'BUTTON') e.preventDefault();
  if (el.type === 'checkbox') {
    actions[el.dataset.action](el);
    return;
  }
  actions[el.dataset.action](el);
});

// 入力欄の値を状態に写す（描き直さない）
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.bind && state.draft) {
    let value = el.value;
    if (el.dataset.bind.endsWith('.skill')) value = Number(value.replace(/\D/g, ''));
    setPath(state.draft, el.dataset.bind, value);
  } else if (el.dataset.bindRec) {
    if (el.dataset.bindRec === 'time') state.rec.form.time = el.value;
    else state.rec[el.dataset.bindRec] = el.value;
  } else if (el.dataset.bindPar) {
    state.par[el.dataset.bindPar] = el.value.trim();
  }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.tagName === 'SELECT' && el.dataset.bind && state.draft) {
    let value = el.value;
    if (el.dataset.bind.endsWith('.skill')) value = Number(value.replace(/\D/g, ''));
    setPath(state.draft, el.dataset.bind, value);
  }
});

document.addEventListener('submit', async (e) => {
  const form = e.target;
  e.preventDefault();
  if (form.dataset.form === 'search-id') {
    const id = form.elements.id.value.trim();
    const hit = Object.keys(PEOPLE).find((k) => PEOPLE[k].appId === id);
    go(`#/person?id=${hit || encodeURIComponent(id)}`);
  }
  if (form.dataset.form === 'join') {
    const par = state.par;
    const l = LISTINGS.find((x) => x.id === form.dataset.id);
    if (GAMES[l.game].join === 'id') {
      par.idTouched = true;
      if (checkGameId(par.gameId)) return render();
    }
    await fakeSave();
    par.sent = true;
    par.listing = l.id;
    par.openJoin = null;
    par.result = 'waiting';
    if (par.saveToProfile) saveGameToProfile({ game: l.game, platform: l.platform, heat: l.heat, skill: l.skill });
    toast('参加希望を送りました');
    go('#/matched');
  }
});

window.addEventListener('hashchange', () => {
  // 編集から保存せずに離れたら、公開内容には反映しない（requests-13）
  const { name } = currentRoute();
  const r = state.rec;
  if (r.editing && name !== 'create') {
    r.form = r.saved;
    r.editing = false;
  }
  render();
  window.scrollTo(0, 0);
});
render();
