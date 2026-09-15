import { BASIC_ATTACK_SKILL_ID } from './combat/BasicAttackSkill';
import { SkillId } from './SkillId';
import { getFeatureLevel, UpgradeLevels } from '../upgrades/FeatureKey';

export const MAX_ACTIVE_BATTLE_SKILLS = 3;
export const BASE_UNLOCKED_BATTLE_SKILL_SLOTS = 1;

export type SkillSlotLayout = (SkillId | null)[];

export function getUnlockedBattleSkillSlotCount(upgradeLevels: UpgradeLevels): number {
  const extraSlots = getFeatureLevel(upgradeLevels, 'battle_skill_slots');
  return Math.min(
    MAX_ACTIVE_BATTLE_SKILLS,
    BASE_UNLOCKED_BATTLE_SKILL_SLOTS + Math.max(0, extraSlots),
  );
}

/** O slot 0 é só do Ataque Básico; investir em skills exige ao menos um slot extra. */
export function hasUnlockedInvestableSkillSlot(unlockedSlotCount: number): boolean {
  return unlockedSlotCount > BASE_UNLOCKED_BATTLE_SKILL_SLOTS;
}

export function toSkillSlotLayout(
  equippedSkillIds: readonly (SkillId | null | undefined)[],
  unlockedSlotCount: number,
): SkillSlotLayout {
  const limit = Math.max(1, Math.min(MAX_ACTIVE_BATTLE_SKILLS, unlockedSlotCount));
  const slots: SkillSlotLayout = Array.from({ length: limit }, () => null);
  slots[0] = BASIC_ATTACK_SKILL_ID;

  const usesSparseLayout =
    equippedSkillIds.length > 0 && equippedSkillIds[0] === BASIC_ATTACK_SKILL_ID;

  if (usesSparseLayout) {
    for (let index = 1; index < limit; index++) {
      const skillId = equippedSkillIds[index];
      slots[index] = skillId && skillId !== BASIC_ATTACK_SKILL_ID ? skillId : null;
    }
    return slots;
  }

  let optionalSlot = 1;
  for (const skillId of equippedSkillIds) {
    if (!skillId || skillId === BASIC_ATTACK_SKILL_ID || optionalSlot >= limit) continue;
    slots[optionalSlot++] = skillId;
  }

  return slots;
}

export function compactSkillSlotStorage(slots: readonly (SkillId | null)[]): (SkillId | null)[] {
  const copy = [...slots];
  while (copy.length > 1 && copy[copy.length - 1] === null) {
    copy.pop();
  }
  return copy;
}

export function assignSkillToLayout(
  layout: SkillSlotLayout,
  skillId: SkillId,
  slotIndex: number,
): SkillSlotLayout {
  if (slotIndex < 1 || slotIndex >= layout.length) {
    throw new Error('Slot inválido');
  }
  if (skillId === BASIC_ATTACK_SKILL_ID) {
    throw new Error('Ataque Básico não pode ser movido');
  }

  const next = layout.map((entry, index) => {
    if (index === 0) return BASIC_ATTACK_SKILL_ID;
    if (entry === skillId) return null;
    return entry;
  });
  next[slotIndex] = skillId;
  return next;
}

export function clearSkillSlot(layout: SkillSlotLayout, slotIndex: number): SkillSlotLayout {
  if (slotIndex < 1 || slotIndex >= layout.length) {
    throw new Error('Slot inválido');
  }

  const next = [...layout];
  next[slotIndex] = null;
  return next;
}

export function hasFreeBattleSkillSlot(
  equippedSkillIds: readonly (SkillId | null | undefined)[],
  unlockedSlotCount: number = MAX_ACTIVE_BATTLE_SKILLS,
): boolean {
  const layout = toSkillSlotLayout(equippedSkillIds, unlockedSlotCount);
  return layout.slice(1).some((skillId) => skillId === null);
}

export function trimEquippedSkillIds(
  equippedSkillIds: readonly (SkillId | null | undefined)[],
  unlockedSlotCount: number,
): (SkillId | null)[] {
  const layout = toSkillSlotLayout(equippedSkillIds, unlockedSlotCount);
  return compactSkillSlotStorage(layout);
}

export function listEquippedSkillIds(
  equippedSkillIds: readonly (SkillId | null | undefined)[],
): SkillId[] {
  return equippedSkillIds.filter((skillId): skillId is SkillId => Boolean(skillId));
}
