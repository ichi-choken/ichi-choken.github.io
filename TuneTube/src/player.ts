// ===== 公式 IFrame Player API =====
// プレーヤーは改変・被覆しない．標準の操作バーは常に表示し，
// 大きなボタンはプレーヤーの外側から公式APIで操作する．
import { PLAYER_HOST } from './config.js';

let apiReady: Promise<void> | null = null;

export function loadPlayerApi(): Promise<void> {
  if (!apiReady) {
    apiReady = new Promise<void>((resolve, reject) => {
      if (window.YT?.Player) { resolve(); return; }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { apiReady = null; reject(new Error('player api load failed')); };
      document.head.append(s);
    });
  }
  return apiReady;
}

export interface PlayerHandle {
  togglePlay(): void;
  pause(): void;
  seek(deltaSec: number): void;
  changeVolume(delta: number): number;
  destroy(): void;
}

export interface PlayerOptions {
  /** プレーヤーのショートカットキーを無効にする（disablekb=1）． */
  disableKeyboard: boolean;
  onState: (playing: boolean) => void;
  onError: (code: number) => void;
}

export async function createPlayer(container: HTMLElement, videoId: string, opts: PlayerOptions): Promise<PlayerHandle> {
  await loadPlayerApi();
  const holder = document.createElement('div');
  container.replaceChildren(holder);
  let ready = false;
  const p = new YT.Player(holder, {
    host: PLAYER_HOST,
    videoId,
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      playsinline: 1,
      rel: 0,
      iv_load_policy: 3,
      controls: 1,
      disablekb: opts.disableKeyboard ? 1 : 0,
      origin: location.origin,
    },
    events: {
      onReady: () => { ready = true; },
      onStateChange: (e) => opts.onState(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING),
      onError: (e) => opts.onError(e.data),
    },
  });

  return {
    togglePlay() {
      if (!ready) return;
      if (p.getPlayerState() === YT.PlayerState.PLAYING) p.pauseVideo(); else p.playVideo();
    },
    pause() { if (ready) p.pauseVideo(); },
    seek(delta) {
      if (ready) p.seekTo(Math.max(0, p.getCurrentTime() + delta), true);
    },
    changeVolume(delta) {
      if (!ready) return 0;
      if (p.isMuted()) p.unMute();
      const v = Math.min(100, Math.max(0, p.getVolume() + delta));
      p.setVolume(v);
      return v;
    },
    destroy() { try { p.destroy(); } catch { /* noop */ } container.replaceChildren(); },
  };
}

/** プレーヤーのエラーコードを利用者向けの文に変える． */
export function playerErrorText(code: number): string {
  switch (code) {
    case 2: return '動画の指定が正しくありません．';
    case 5: return 'この端末では再生できない形式の動画です．';
    case 100: return '動画が削除されたか，非公開になっています．';
    case 101:
    case 150: return 'この動画は投稿者の設定により，このアプリでは再生できません．';
    case 153: return '再生に必要な情報（アプリの識別情報）が送られていないため再生できません．公開URLから開いてください．';
    default: return `動画を再生できませんでした（エラー ${code}）．`;
  }
}
