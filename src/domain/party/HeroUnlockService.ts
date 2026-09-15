import { GameState } from '../entities/GameState';
import { Hero } from '../entities/Hero';
import { HeroClass, UNLOCKABLE_HERO_CLASSES } from '../entities/HeroClass';
import { createGearFromCatalogItem } from '../gear/GearItemCatalog';

type UnlockableHeroClass = (typeof UNLOCKABLE_HERO_CLASSES)[number];

const UNLOCK_HERO_IDS: Record<UnlockableHeroClass, string> = {
  knight: 'hero-1',
  priest: 'hero-3',
  berserker: 'hero-berserker',
  archer: 'hero-archer',
  paladin: 'hero-paladin',
};

export const UNLOCK_HERO_NAMES: Record<UnlockableHeroClass, string> = {
  knight: 'Galneon',
  priest: 'Elara',
  berserker: 'Torius',
  archer: 'Rain',
  paladin: 'Valerius',
};

/** Arma exclusiva concedida ao desbloquear a Rain. */
export const RAIN_STARTER_BOW_CATALOG_ID = 'rain_kontempler_bow';

function isUnlockableHeroClass(heroClass: HeroClass): heroClass is UnlockableHeroClass {
  return (UNLOCKABLE_HERO_CLASSES as readonly HeroClass[]).includes(heroClass);
}

export class HeroUnlockService {
  static isUnlocked(state: GameState, heroClass: HeroClass): boolean {
    return state.roster.some((hero) => hero.heroClass === heroClass);
  }

  static createUnlockedHero(heroClass: UnlockableHeroClass): Hero {
    return Hero.createStarter(UNLOCK_HERO_IDS[heroClass], heroClass, UNLOCK_HERO_NAMES[heroClass]);
  }

  static applyUnlock(state: GameState, heroClass: HeroClass): GameState {
    if (!isUnlockableHeroClass(heroClass)) {
      throw new Error('Classe não desbloqueável via melhoria');
    }

    if (this.isUnlocked(state, heroClass)) {
      return state;
    }

    const hero = this.createUnlockedHero(heroClass);
    let next = state.withRoster([...state.roster, hero]).addLog(`Novo herói desbloqueado: ${hero.name}!`);

    if (heroClass === 'archer') {
      const bow = createGearFromCatalogItem(RAIN_STARTER_BOW_CATALOG_ID);
      next = next.withInventory([...next.inventory, bow]).addLog(`${hero.name} recebe o Arco de Kontempler.`);
    }

    return next;
  }
}
