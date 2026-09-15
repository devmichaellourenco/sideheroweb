import { describe, expect, it } from 'vitest';
import {
  assignSkillToLayout,
  BASE_UNLOCKED_BATTLE_SKILL_SLOTS,
  getUnlockedBattleSkillSlotCount,
  hasUnlockedInvestableSkillSlot,
  hasFreeBattleSkillSlot,
  toSkillSlotLayout,
  trimEquippedSkillIds,
} from './SkillBattleSlots';

describe('SkillBattleSlots', () => {
  it('inicia com 1 slot desbloqueado sem upgrades', () => {
    expect(getUnlockedBattleSkillSlotCount({})).toBe(BASE_UNLOCKED_BATTLE_SKILL_SLOTS);
  });

  it('desbloqueia slots extras via melhoria battle_skill_slots', () => {
    expect(getUnlockedBattleSkillSlotCount({ battle_skill_slots: 1 })).toBe(2);
    expect(getUnlockedBattleSkillSlotCount({ battle_skill_slots: 2 })).toBe(3);
  });

  it('não permite investir em skills enquanto só há o slot fixo do básico', () => {
    expect(hasUnlockedInvestableSkillSlot(1)).toBe(false);
    expect(hasUnlockedInvestableSkillSlot(2)).toBe(true);
  });

  it('respeita limite de slots livres conforme desbloqueio', () => {
    expect(hasFreeBattleSkillSlot(['basic_attack'], 1)).toBe(false);
    expect(hasFreeBattleSkillSlot(['basic_attack'], 2)).toBe(true);
  });

  it('mantém ataque básico ao aparar skills equipadas', () => {
    expect(
      trimEquippedSkillIds(['basic_attack', 'power_attack', 'thrust'], 1),
    ).toEqual(['basic_attack']);
  });

  it('substitui skill em slot específico', () => {
    const layout = toSkillSlotLayout(['basic_attack', 'power_attack'], 3);
    const next = assignSkillToLayout(layout, 'thrust', 1);

    expect(next).toEqual(['basic_attack', 'thrust', null]);
  });
});
