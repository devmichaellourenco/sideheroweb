export interface ActionTimerEntry {
  remaining: number;
  total: number;
}

export type ActionTimerMap = Record<string, ActionTimerEntry>;

/** Total de exibição quando o ator está pronto (remaining ≤ 0) e não há ciclo anterior. */
const READY_DISPLAY_TOTAL = 1;

export function normalizeActionTimerEntry(value: unknown): ActionTimerEntry {
  if (typeof value === 'number') {
    const remaining = value;
    return { remaining, total: remaining > 0 ? remaining : READY_DISPLAY_TOTAL };
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as ActionTimerEntry).remaining === 'number' &&
    typeof (value as ActionTimerEntry).total === 'number'
  ) {
    const entry = value as ActionTimerEntry;
    return {
      remaining: entry.remaining,
      total: entry.total > 0 ? entry.total : READY_DISPLAY_TOTAL,
    };
  }

  return { remaining: 0, total: READY_DISPLAY_TOTAL };
}

export function normalizeActionTimerMap(value: unknown): ActionTimerMap {
  if (!value || typeof value !== 'object') return {};

  const next: ActionTimerMap = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    next[key] = normalizeActionTimerEntry(entry);
  }
  return next;
}

export function resolveActionTimeRatio(entry: ActionTimerEntry | undefined): number {
  if (!entry || entry.total <= 0) return 1;
  if (entry.remaining <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - entry.remaining / entry.total));
}
