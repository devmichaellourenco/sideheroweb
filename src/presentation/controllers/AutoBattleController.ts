export class AutoBattleController {
  private timer: number | null = null;

  start(intervalMs: number, onTick: () => void): void {
    this.stop();
    this.timer = window.setInterval(onTick, intervalMs);
  }

  stop(): void {
    if (this.timer === null) return;
    window.clearInterval(this.timer);
    this.timer = null;
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  restart(intervalMs: number, onTick: () => void): void {
    this.stop();
    this.start(intervalMs, onTick);
  }
}
