import { HeroClass, HERO_CLASSES } from '../entities/HeroClass';
import {
  applyBaseStatsOverride,
  getBaseStatsOverride,
  type HeroBaseStats,
} from '../progression/HeroCombatOverrides';

/** Stats iniciais da classe (nível 1, sem gear/atributos alocados). */
export const HERO_BASE_STATS_CATALOG: Record<HeroClass, HeroBaseStats> = {
  knight: { attack: 26, defense: 8, health: 120 },
  sorcerer: { attack: 22, defense: 3, health: 80 },
  priest: { attack: 14, defense: 5, health: 100 },
  berserker: { attack: 24, defense: 4, health: 110 },
  archer: { attack: 23, defense: 5, health: 95 },
  paladin: { attack: 22, defense: 10, health: 115 },
};

export function getCatalogHeroBaseStats(heroClass: HeroClass): HeroBaseStats {
  return { ...HERO_BASE_STATS_CATALOG[heroClass] };
}

/** Stats base efetivos (catálogo + override do Balance Lab). */
export function getHeroBaseStats(heroClass: HeroClass): HeroBaseStats {
  return applyBaseStatsOverride(
    HERO_BASE_STATS_CATALOG[heroClass],
    getBaseStatsOverride(heroClass),
  );
}

/**
 * Ajusta o base persistido do herói (inclui ganhos de level-up) para o override
 * atual do lab, sem reescrever o save.
 */
export function resolveHeroStoredBaseStat(
  heroClass: HeroClass,
  stored: number,
  key: keyof HeroBaseStats,
): number {
  const catalog = getCatalogHeroBaseStats(heroClass)[key];
  const live = getHeroBaseStats(heroClass)[key];
  return stored + (live - catalog);
}

export function listHeroBaseStats(): ReadonlyArray<{
  heroClass: HeroClass;
  stats: HeroBaseStats;
}> {
  return HERO_CLASSES.map((heroClass) => ({
    heroClass,
    stats: getHeroBaseStats(heroClass),
  }));
}
