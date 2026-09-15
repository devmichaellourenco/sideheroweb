import { describe, expect, it } from 'vitest';
import { getUpgradeById } from '../../domain/upgrades/UpgradeCatalog';
import {
  detectNewlyUnlockedFeatures,
  isUpgradePurchaseCoveredByStateChange,
} from './FeatureUnlockCatalog';
import { RewardMomentDetector } from './RewardMomentDetector';

describe('FeatureUnlockCatalog — dedupe de Wow', () => {
  it('marca unlock de herói como coberto pelo state change', () => {
    const upgrade = getUpgradeById('hero_unlock_berserker');
    expect(upgrade).toBeTruthy();
    expect(isUpgradePurchaseCoveredByStateChange(upgrade!)).toBe(true);
  });

  it('marca 1º unlock de feature com meta dedicada como coberto', () => {
    expect(isUpgradePurchaseCoveredByStateChange(getUpgradeById('divine_forge_1')!)).toBe(true);
    expect(isUpgradePurchaseCoveredByStateChange(getUpgradeById('shop_refresh_1')!)).toBe(true);
    expect(isUpgradePurchaseCoveredByStateChange(getUpgradeById('item_stash_1')!)).toBe(true);
  });

  it('não cobre níveis seguintes nem runas sem meta de feature', () => {
    expect(isUpgradePurchaseCoveredByStateChange(getUpgradeById('shop_refresh_2')!)).toBe(false);
    expect(isUpgradePurchaseCoveredByStateChange(getUpgradeById('battle_skill_slot_2')!)).toBe(false);
    expect(isUpgradePurchaseCoveredByStateChange(getUpgradeById('auto_battle_2')!)).toBe(false);
  });

  it('detecta flags novas apenas na primeira ativação', () => {
    const previous = {
      divineForge: false,
      shopRefresh: false,
    } as never;
    const next = {
      divineForge: true,
      shopRefresh: false,
    } as never;
    expect(detectNewlyUnlockedFeatures(previous, next)).toEqual(['divineForge']);
  });
});

describe('RewardMomentDetector — upgrade purchase dedupe', () => {
  const detector = new RewardMomentDetector();

  it('não gera Wow de compra para unlock de herói (fica o do Torius/Rain/Valerius)', () => {
    expect(detector.buildUpgradePurchasedMoment('hero_unlock_berserker')).toBeNull();
    expect(detector.buildUpgradePurchasedMoment('hero_unlock_archer')).toBeNull();
    expect(detector.buildUpgradePurchasedMoment('hero_unlock_paladin')).toBeNull();
  });

  it('não gera Wow de compra no 1º unlock de feature já celebrada no detect', () => {
    expect(detector.buildUpgradePurchasedMoment('divine_forge_1')).toBeNull();
    expect(detector.buildUpgradePurchasedMoment('optimize_loadout_1')).toBeNull();
  });

  it('gera Wow de compra para runas sem celebração duplicada', () => {
    const skillSlot = detector.buildUpgradePurchasedMoment('battle_skill_slot_2');
    expect(skillSlot?.kind).toBe('upgrade_purchased');
    expect(skillSlot?.title).toBe('Slot de skill II');

    const shopRefresh2 = detector.buildUpgradePurchasedMoment('shop_refresh_2');
    expect(shopRefresh2?.kind).toBe('upgrade_purchased');
  });
});
