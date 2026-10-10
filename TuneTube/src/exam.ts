// ===== 受験生モード：1日の視聴時間を数え，目標時間で休憩を促す =====
import { load, save } from './storage.js';

interface ExamLog { day: string; sec: number }

function today(): string {
  return new Date().toLocaleDateString('en-CA');
}

export class ExamTimer {
  private playing = false;
  private last = 0;
  private timer: number | undefined;

  constructor(
    readonly limitSec: number,
    private readonly onUpdate: (usedSec: number, limitSec: number) => void,
    private readonly onLimit: () => void,
  ) {}

  /** 今日これまでに視聴した秒数． */
  used(): number {
    const log = load<ExamLog>('exam', { day: '', sec: 0 });
    return log.day === today() ? log.sec : 0;
  }

  setPlaying(playing: boolean): void {
    if (playing && !this.playing) {
      this.playing = true;
      this.last = Date.now();
      this.timer = window.setInterval(() => this.step(), 1000);
    } else if (!playing && this.playing) {
      this.step();
      this.playing = false;
      window.clearInterval(this.timer);
    }
  }

  stop(): void { this.setPlaying(false); }

  private step(): void {
    const now = Date.now();
    const add = (now - this.last) / 1000;
    this.last = now;
    const before = this.used();
    const after = before + add;
    save('exam', { day: today(), sec: after });
    this.onUpdate(after, this.limitSec);
    if (before < this.limitSec && after >= this.limitSec) this.onLimit();
  }
}
