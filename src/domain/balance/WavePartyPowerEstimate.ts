import { EncounterResolver } from '../campaign/EncounterResolver';
import type { PhaseId } from '../campaign/CampaignIds';
import { HeroClass } from '../entities/HeroClass';
import { deriveCombatAttack } from '../combat/CombatantDerivedStats';
import { getHeroCombatIdentity } from '../combat/HeroCombatIdentityCatalog';
import { getHeroBaseStats } from '../combat/HeroBaseStatsCatalog';
import { getEnemyCombatIdentity } from '../enemies/EnemyCombatIdentityCatalog';
import { getEnemyTierCombatBaseline } from '../enemies/EnemyProgressionCatalog';
import { createAttributes } from '../progression/Attributes';

export interface ReferencePartyMemberSpec {
  heroClass: HeroClass;
  level: number;
}

export interface WavePowerSnapshot {
  phaseId: PhaseId;
  waveIndex: number;
  enemyCount: number;
  totalHp: number;
  totalAttack: number;
  estimatedEnemyBasicDps: number;
  referencePartyDps: number;
  estimatedClearSeconds: number;
  pressureRatio: number;
}

export interface PhasePowerSnapshot {
  phaseId: PhaseId;
  waves: WavePowerSnapshot[];
  phaseClearSeconds: number;
  totalHp: number;
  referencePartyDps: number;
}

const resolver = new EncounterResolver();

function estimateHeroBasicDps(heroClass: HeroClass, level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  const identity = getHeroCombatIdentity(heroClass);
  const base = getHeroBaseStats(heroClass);
  const levelsGained = safeLevel - 1;
  const attack = deriveCombatAttack({
    baseAttack: base.attack + levelsGained * identity.levelUpAttackGain,
    attributes: createAttributes(10, 10, 10),
    level: safeLevel,
    attackPerLevel: identity.attackPerLevel,
    defensePerLevel: identity.defensePerLevel,
    healthPerLevel: identity.healthPerLevel,
  });
  const aspd = Math.max(0.05, 0.4 * identity.attackSpeedFactor);
  return attack * identity.basicAttackDamageRatio * aspd;
}

export function estimateReferencePartyDps(
  members: readonly ReferencePartyMemberSpec[],
): number {
  if (members.length === 0) return 1;
  return Math.max(
    1,
    members.reduce(
      (sum, member) => sum + estimateHeroBasicDps(member.heroClass, member.level),
      0,
    ),
  );
}

export function estimateWavePower(
  phaseId: PhaseId,
  waveIndex: number,
  party: readonly ReferencePartyMemberSpec[],
): WavePowerSnapshot | null {
  const encounter = resolver.resolve(phaseId, waveIndex);
  if (!encounter) return null;

  let totalHp = 0;
  let totalAttack = 0;
  let estimatedEnemyBasicDps = 0;
  for (const enemy of encounter.enemies) {
    totalHp += enemy.maxHealth;
    totalAttack += enemy.attack;
    const identity = getEnemyCombatIdentity(enemy.enemyType);
    const baseline = getEnemyTierCombatBaseline(enemy.enemyType);
    const aspd = Math.max(0.05, baseline.attackSpeed * identity.attackSpeedFactor);
    estimatedEnemyBasicDps += enemy.attack * identity.basicAttackDamageRatio * aspd;
  }

  const referencePartyDps = estimateReferencePartyDps(party);
  const estimatedClearSeconds = totalHp / referencePartyDps;
  return {
    phaseId,
    waveIndex,
    enemyCount: encounter.enemies.length,
    totalHp,
    totalAttack,
    estimatedEnemyBasicDps,
    referencePartyDps,
    estimatedClearSeconds,
    pressureRatio: estimatedEnemyBasicDps / referencePartyDps,
  };
}

export function estimatePhasePower(
  phaseId: PhaseId,
  party: readonly ReferencePartyMemberSpec[],
): PhasePowerSnapshot {
  const waves: WavePowerSnapshot[] = [];
  for (let waveIndex = 0; ; waveIndex += 1) {
    const snapshot = estimateWavePower(phaseId, waveIndex, party);
    if (!snapshot) break;
    waves.push(snapshot);
  }
  const referencePartyDps = estimateReferencePartyDps(party);
  const totalHp = waves.reduce((sum, wave) => sum + wave.totalHp, 0);
  return {
    phaseId,
    waves,
    totalHp,
    referencePartyDps,
    phaseClearSeconds: totalHp / referencePartyDps,
  };
}

export const DEFAULT_REFERENCE_PARTY: readonly ReferencePartyMemberSpec[] = [
  { heroClass: 'sorcerer', level: 1 },
  { heroClass: 'knight', level: 1 },
  { heroClass: 'priest', level: 1 },
];
