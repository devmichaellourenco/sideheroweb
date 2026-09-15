export interface AchievementEntryProps {
  current: number;
  completed: boolean;
  completedAt?: number | null;
}

export class AchievementEntry {
  readonly current: number;
  readonly completed: boolean;
  readonly completedAt: number | null;

  private constructor(props: AchievementEntryProps) {
    this.current = Math.max(0, props.current);
    this.completed = props.completed;
    this.completedAt = props.completedAt ?? null;
  }

  static initial(): AchievementEntry {
    return new AchievementEntry({ current: 0, completed: false, completedAt: null });
  }

  static restore(raw: Partial<AchievementEntryProps> | null | undefined): AchievementEntry {
    if (!raw || typeof raw !== 'object') return AchievementEntry.initial();
    return new AchievementEntry({
      current: typeof raw.current === 'number' ? raw.current : 0,
      completed: Boolean(raw.completed),
      completedAt: typeof raw.completedAt === 'number' ? raw.completedAt : null,
    });
  }

  toProps(): AchievementEntryProps {
    return {
      current: this.current,
      completed: this.completed,
      completedAt: this.completedAt,
    };
  }
}

export type AchievementEntries = Readonly<Record<string, AchievementEntryProps>>;

export class AchievementProgress {
  private readonly entries: AchievementEntries;

  private constructor(entries: AchievementEntries) {
    this.entries = { ...entries };
  }

  static initial(): AchievementProgress {
    return new AchievementProgress({});
  }

  static restore(raw: { entries?: AchievementEntries } | null | undefined): AchievementProgress {
    if (!raw?.entries || typeof raw.entries !== 'object') {
      return AchievementProgress.initial();
    }

    const entries: Record<string, AchievementEntryProps> = {};
    for (const [id, value] of Object.entries(raw.entries)) {
      entries[id] = AchievementEntry.restore(value).toProps();
    }
    return new AchievementProgress(entries);
  }

  getEntry(id: string): AchievementEntry {
    return AchievementEntry.restore(this.entries[id]);
  }

  withEntry(id: string, entry: AchievementEntry): AchievementProgress {
    return new AchievementProgress({
      ...this.entries,
      [id]: entry.toProps(),
    });
  }

  toProps(): { entries: AchievementEntries } {
    return { entries: { ...this.entries } };
  }
}
