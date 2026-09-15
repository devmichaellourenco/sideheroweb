/**
 * Perfis de referência do simulador — traduzem "em que pé o jogador está" em um
 * build concreto (gear, pontos gastos, slots de skill).
 *
 * Servem de alvo de balanceamento: `geared` é o jogador Core que usa loja e skills
 * (win rate alvo 60–85%); `naked` é o piso de quem ignora progressão (20–40%).
 */
import { GEAR_RARITIES, GearRarity } from '../entities/Gear';
import { MAX_ACTIVE_BATTLE_SKILLS } from '../progression/SkillBattleSlots';
import type { SimHeroLoadoutSpec } from './SimHeroLoadout';

export type SimReferenceProfile = 'naked' | 'geared' | 'optimal';

export const SIM_REFERENCE_PROFILES: SimReferenceProfile[] = ['naked', 'geared', 'optimal'];

export function isSimReferenceProfile(value: unknown): value is SimReferenceProfile {
  return typeof value === 'string' && (SIM_REFERENCE_PROFILES as string[]).includes(value);
}

/**
 * Raridade que a loja ativa oferece naquele tier — espelha os marcos de
 * `getShopMaxRarityIndex` sem importar a loja (o sim não depende de progresso salvo).
 */
export function referenceGearRarityForTier(tier: number): GearRarity {
  if (tier >= 101) return 'mythic';
  if (tier >= 51) return 'legendary';
  if (tier >= 20) return 'epic';
  if (tier >= 10) return 'rare';
  if (tier >= 5) return 'uncommon';
  return 'common';
}

/** Slots de batalha que a árvore de melhorias já liberou naquele ponto da campanha. */
function referenceBattleSkillSlots(tier: number): number {
  if (tier >= 15) return 3;
  if (tier >= 5) return 2;
  return 1;
}

function nextRarityUp(rarity: GearRarity): GearRarity {
  const index = GEAR_RARITIES.indexOf(rarity);
  return GEAR_RARITIES[Math.min(GEAR_RARITIES.length - 1, index + 1)];
}

/**
 * `naked` não gasta ponto nem equipa nada — é o piso de poder.
 * `geared` reflete o Core: kit da loja do marco e pontos entre atributos e skills.
 * `optimal` é o teto: uma raridade acima (drop/forja) e todos os slots de skill.
 */
export function resolveSimProfileSpec(
  profile: SimReferenceProfile,
  tier: number,
): SimHeroLoadoutSpec {
  if (profile === 'naked') {
    return { gearRarity: 'none', improvementPoints: 0, battleSkillSlots: 1 };
  }

  const shopRarity = referenceGearRarityForTier(tier);

  if (profile === 'optimal') {
    return {
      gearRarity: nextRarityUp(shopRarity),
      improvementPoints: 'auto',
      attributeRatio: 0.5,
      battleSkillSlots: MAX_ACTIVE_BATTLE_SKILLS,
    };
  }

  return {
    gearRarity: shopRarity,
    improvementPoints: 'auto',
    attributeRatio: 0.5,
    battleSkillSlots: referenceBattleSkillSlots(tier),
  };
}
