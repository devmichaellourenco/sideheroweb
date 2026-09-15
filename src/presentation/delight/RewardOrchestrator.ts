import { RewardMoment } from './types/RewardMoment';

export type MomentPresenter = (moment: RewardMoment) => Promise<void>;

export class RewardOrchestrator {
  private readonly queue: RewardMoment[] = [];
  private processing = false;
  private drainScheduled = false;

  constructor(private readonly present: MomentPresenter) {}

  enqueue(moment: RewardMoment): void {
    if (this.isDuplicate(moment)) return;

    this.queue.push(moment);
    this.queue.sort((left, right) => right.priority - left.priority);
    this.scheduleDrain();
  }

  enqueueMany(moments: RewardMoment[]): void {
    for (const moment of moments) {
      if (this.isDuplicate(moment)) continue;
      this.queue.push(moment);
    }
    this.queue.sort((left, right) => right.priority - left.priority);
    if (moments.length > 0) {
      this.scheduleDrain();
    }
  }

  clear(): void {
    this.queue.length = 0;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  private isDuplicate(moment: RewardMoment): boolean {
    return this.queue.some((queued) => queued.id === moment.id);
  }

  private scheduleDrain(): void {
    if (this.drainScheduled) return;
    this.drainScheduled = true;
    queueMicrotask(() => {
      this.drainScheduled = false;
      void this.drain();
    });
  }

  private async drain(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const moment = this.queue.shift()!;
      await this.present(moment);
    }

    this.processing = false;
  }
}
