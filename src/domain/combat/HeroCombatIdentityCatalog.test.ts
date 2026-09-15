import { describe, expect, it } from 'vitest';
import { HERO_CLASSES } from '../entities/HeroClass';
import { getHeroCombatIdentity, listHeroCombatIdentities } from './HeroCombatIdentityCatalog';

describe('HeroCombatIdentityCatalog', () => {
  it('cada classe tem identidade própria (básico, CD, ASPD, crescimento)', () => {
    expect(listHeroCombatIdentities()).toHaveLength(HERO_CLASSES.length);
    for (const heroClass of HERO_CLASSES) {
      const identity = getHeroCombatIdentity(heroClass);
      expect(identity.basicAttackDamageRatio).toBeGreaterThan(0);
      expect(identity.skillCooldownTurnSeconds).toBeGreaterThan(0);
      expect(identity.attackSpeedFactor).toBeGreaterThan(0);
      expect(identity.attackPerLevel).toBe(0);
      expect(identity.defensePerLevel).toBe(0);
      expect(identity.healthPerLevel).toBe(0);
      expect(identity.levelUpAttackGain).toBe(3);
      expect(identity.levelUpDefenseGain).toBe(3);
      expect(identity.levelUpHealthGain).toBe(15);
    }
  });

  it('Nix e Galneon podem divergir sem constante global', () => {
    const nix = getHeroCombatIdentity('sorcerer');
    const galneon = getHeroCombatIdentity('knight');
    expect(nix).not.toBe(galneon);
    expect(nix.basicAttackDamageRatio).toBe(0.5);
    expect(galneon.skillCooldownTurnSeconds).toBe(5);
  });
});
