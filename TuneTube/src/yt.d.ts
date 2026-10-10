// YouTube IFrame Player API の最小限の型定義
declare namespace YT {
  interface PlayerEvent { target: Player; }
  interface OnStateChangeEvent { data: number; target: Player; }
  interface OnErrorEvent { data: number; target: Player; }
  interface PlayerOptions {
    host?: string;
    videoId?: string;
    width?: number | string;
    height?: number | string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (e: PlayerEvent) => void;
      onStateChange?: (e: OnStateChangeEvent) => void;
      onError?: (e: OnErrorEvent) => void;
    };
  }
  class Player {
    constructor(el: HTMLElement | string, opts: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getVolume(): number;
    setVolume(v: number): void;
    isMuted(): boolean;
    unMute(): void;
    getPlayerState(): number;
    destroy(): void;
  }
  const PlayerState: {
    UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5;
  };
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
