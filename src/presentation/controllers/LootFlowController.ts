export type LootModalView =
  | { type: 'loot-reveal'; gearId: string }
  | { type: 'loot-batch'; gearIds: string[] };

export class LootFlowController {
  readonly queue: string[] = [];
  total = 0;

  reset(): void {
    this.queue.length = 0;
    this.total = 0;
  }

  enqueue(gearIds: string[]): LootModalView | null {
    this.total = gearIds.length;
    this.queue.length = 0;

    if (gearIds.length > 1) {
      return { type: 'loot-batch', gearIds: [...gearIds] };
    }

    if (gearIds.length === 1) {
      this.queue.push(gearIds[0]);
      return { type: 'loot-reveal', gearId: gearIds[0] };
    }

    return null;
  }

  shift(): string | undefined {
    return this.queue.shift();
  }

  hasQueued(): boolean {
    return this.queue.length > 0;
  }
}
