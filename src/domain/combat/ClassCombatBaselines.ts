import { HeroClass } from '../entities/HeroClass';
import { CombatProfile, createCombatProfile } from './CombatProfile';

/** Valores base de combate por classe (nível 1, sem gear). Cadência ~2× mais lenta (BAL-015). */
const BASELINES: Record<HeroClass, CombatProfile> = {
  knight: createCombatProfile({ attackSpeed: 0.29, castSpeed: 1, critChance: 0.025, critDamage: 1.4 }),
  sorcerer: createCombatProfile({ attackSpeed: 0.19, castSpeed: 1, critChance: 0.05, critDamage: 1.65 }),
  priest: createCombatProfile({ attackSpeed: 0.29, castSpeed: 1, critChance: 0.02, critDamage: 1.4 }),
  berserker: createCombatProfile({ attackSpeed: 0.225, castSpeed: 1, critChance: 0.025, critDamage: 1.8 }),
  archer: createCombatProfile({ attackSpeed: 0.36, castSpeed: 1, critChance: 0.08, critDamage: 1.7 }),
  paladin: createCombatProfile({ attackSpeed: 0.24, castSpeed: 1, critChance: 0.02, critDamage: 1.4 }),
};

export function getClassCombatBaseline(heroClass: HeroClass): CombatProfile {
  return { ...BASELINES[heroClass] };
}
