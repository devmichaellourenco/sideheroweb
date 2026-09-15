import staticOverrides from './data/hero-level-xp-overrides.json';

/**
 * XP para avançar de N→N+1 sobrescrita pelo Balance Lab.
 * Chave = nível de origem (string), valor = XP inteira > 0.
 */
export interface HeroLevelXpOverridesFile {
  version: number;
  updatedAt: string | null;
  levels: Record<string, number>;
}

const embedded = staticOverrides as HeroLevelXpOverridesFile;

/** Overrides em memória (Balance Lab / testes) — prioridade sobre o JSON embutido. */
let runtimeLevels: Record<string, number> | null = null;

export function getEmbeddedHeroLevelXpOverrides(): HeroLevelXpOverridesFile {
  return {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    levels: { ...(embedded.levels ?? {}) },
  };
}

export function setRuntimeHeroLevelXpOverrides(
  levels: Record<string, number> | null,
): void {
  runtimeLevels = levels;
}

export function normalizeHeroLevelXpValue(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

export function normalizeHeroLevelXpOverrides(
  input: Record<string, unknown> | null | undefined,
): Record<string, number> {
  if (!input || typeof input !== 'object') return {};
  const normalized: Record<string, number> = {};
  for (const [rawLevel, rawValue] of Object.entries(input)) {
    const level = Number(rawLevel);
    if (!Number.isFinite(level) || level < 1) continue;
    const value = normalizeHeroLevelXpValue(rawValue);
    if (value === null) continue;
    normalized[String(Math.floor(level))] = value;
  }
  return normalized;
}

export function getHeroLevelXpOverride(level: number): number | null {
  const source = runtimeLevels ?? embedded.levels ?? {};
  return normalizeHeroLevelXpValue(source[String(Math.floor(level))]);
}

export function applyHeroLevelXpOverride(level: number, baseline: number): number {
  return getHeroLevelXpOverride(level) ?? baseline;
}
