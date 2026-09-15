import { PhaseId, buildPhaseId } from './CampaignIds';
import { PhaseDefinition } from './PhaseDefinition';
import { EnemySlot, WaveDefinition } from './WaveDefinition';
import { EnemyType } from '../entities/EnemyType';
import { getPowerTierForGlobalTier, milestoneBossForMapIndex } from '../enemies/EnemyTierProgression';
import { getSubbossesForPowerTier } from '../enemies/EnemyRosterCatalog';

function wave(id: string, slots: EnemySlot[], goldMultiplier = 1): WaveDefinition {
  return { id, slots, goldMultiplier };
}

function trash(type: EnemySlot['enemyType'], count = 1): EnemySlot {
  return { enemyType: type, role: 'trash', count };
}

function elite(type: EnemySlot['enemyType'], count = 1): EnemySlot {
  return { enemyType: type, role: 'elite', count };
}

function boss(type: EnemySlot['enemyType'], count = 1, displayName?: string): EnemySlot {
  return { enemyType: type, role: 'boss', count, displayName };
}

function subbossForMap(mapIndex: number, offset = 0): EnemyType {
  const tier = getPowerTierForGlobalTier(mapIndex * 50);
  const subs = getSubbossesForPowerTier(tier);
  return subs[offset % subs.length].id;
}

export interface MilestoneBlueprint {
  displayName: string;
  waves: WaveDefinition[];
  statMultiplier: number;
  majorMilestone?: boolean;
}

/** Composições únicas para cada fase X-50 (boss de capítulo). Nomes de exibição mantidos. */
const MILESTONE_BY_PHASE_ID: Record<PhaseId, MilestoneBlueprint> = {
  [buildPhaseId(1, 50)]: {
    displayName: 'Guardião Elemental',
    majorMilestone: true,
    statMultiplier: 1.5,
    waves: [
      wave('w1', [trash('goblin_raider', 2), trash('gray_wolf', 1)]),
      wave('w2', [elite('goblin_shaman', 2), elite('road_bandit', 1)], 1.15),
      wave('w3', [elite('bandit_captain'), trash('goblin_bomber', 2)], 1.2),
      wave('w4', [boss('saci', 1, 'Saci'), elite('goblin_archer')], 1.7),
    ],
  },
  [buildPhaseId(2, 50)]: {
    displayName: 'Centelha de Gonodor',
    majorMilestone: true,
    statMultiplier: 1.55,
    waves: [
      wave('w1', [trash('goblin_bomber', 2), trash('kobold_digger', 1)]),
      wave('w2', [elite('goblin_shaman'), elite('goblin_bomber', 2)], 1.2),
      wave('w3', [elite('bandit_captain'), trash('goblin_bomber', 2)], 1.3),
      wave('w4', [boss('gonodor', 1, 'Gonodor'), elite('goblin_bomber')], 1.75),
    ],
  },
  [buildPhaseId(3, 50)]: {
    displayName: 'Espectro de Valdris',
    majorMilestone: true,
    statMultiplier: 1.48,
    waves: [
      wave('w1', [trash('skeleton_warrior', 2), trash('giant_spider', 1)]),
      wave('w2', [elite('rot_zombie', 2), elite('giant_spider')], 1.2),
      wave('w3', [elite('renegade_necromancer'), trash('skeleton_warrior', 2)], 1.25),
      wave('w4', [
        boss('renegade_necromancer', 1, 'Espectro de Valdris'),
        elite('rot_zombie'),
      ], 1.65),
    ],
  },
  [buildPhaseId(4, 50)]: {
    displayName: 'Duque de Morthaven',
    majorMilestone: true,
    statMultiplier: 1.5,
    waves: [
      wave('w1', [trash('orc_berserker', 2), trash('rot_zombie', 1)]),
      wave('w2', [elite('renegade_necromancer'), elite('skeleton_warrior', 2)], 1.2),
      wave('w3', [elite('mountain_troll'), trash('orc_warrior', 2)], 1.3),
      wave('w4', [boss('morthaven_duke', 1, 'Duque de Morthaven'), elite('renegade_necromancer')], 1.7),
    ],
  },
  [buildPhaseId(5, 50)]: {
    displayName: 'Colosso do Céu Quebrado',
    majorMilestone: true,
    statMultiplier: 1.65,
    waves: [
      wave('w1', [trash('gargoyle', 2), trash('minotaur', 1)]),
      wave('w2', [elite('cultist_mage', 2), elite('war_worg')], 1.25),
      wave('w3', [elite('three_head_hydra'), trash('lesser_demon', 2)], 1.35),
      wave('w4', [boss('three_head_hydra', 1, 'Hidra de Três Cabeças'), elite('shadow_arachnid')], 1.85),
    ],
  },
  [buildPhaseId(6, 50)]: {
    displayName: 'Senhor do Abismo',
    statMultiplier: 1.52,
    waves: [
      wave('w1', [trash('death_knight', 2), trash('major_elemental', 1)]),
      wave('w2', [elite('dead_general', 2), elite('cultist_mage')], 1.25),
      wave('w3', [elite('young_green_dragon'), trash('lesser_demon', 2)], 1.3),
      wave('w4', [boss('young_green_dragon', 1, 'Dragão Verde Jovem'), elite('gargoyle')], 1.72),
    ],
  },
  [buildPhaseId(7, 50)]: {
    displayName: 'Forjador Eterno',
    statMultiplier: 1.54,
    waves: [
      wave('w1', [trash('stone_giant', 2), trash('frost_giant', 1)]),
      wave('w2', [elite('chimera'), elite('manticore')], 1.25),
      wave('w3', [elite('lesser_lich'), trash('infernal_devil', 2)], 1.32),
      wave('w4', [boss('lesser_lich', 1, 'Lich Menor'), elite('aberrant_abomination')], 1.75),
    ],
  },
  [buildPhaseId(8, 50)]: {
    displayName: 'Guardião do Bosque',
    statMultiplier: 1.56,
    waves: [
      wave('w1', [trash('adult_black_dragon', 2), trash('infernal_devil', 1)]),
      wave('w2', [elite('demonic_warlord'), elite('chimera')], 1.28),
      wave('w3', [elite('awakened_titan'), trash('manticore', 2)], 1.33),
      wave('w4', [boss('awakened_titan', 1, 'Titã Desperto'), elite('stone_giant')], 1.78),
    ],
  },
  [buildPhaseId(9, 50)]: {
    displayName: 'Sentinela do Crepúsculo',
    statMultiplier: 1.58,
    waves: [
      wave('w1', [trash('ancient_dragon', 2), trash('soul_devourer', 1)]),
      wave('w2', [elite('archlich'), elite('void_herald')], 1.3),
      wave('w3', [elite('demon_prince'), trash('primordial_behemoth', 2)], 1.38),
      wave('w4', [boss('demon_prince', 1, 'Príncipe Demônio'), elite('ancient_dragon')], 1.8),
    ],
  },
  [buildPhaseId(10, 50)]: {
    displayName: 'Soberano do Vazio',
    majorMilestone: true,
    statMultiplier: 1.95,
    waves: [
      wave('w1', [trash('void_herald', 2), trash('soul_devourer', 1)]),
      wave('w2', [elite('archlich'), elite('primordial_behemoth'), elite('ancient_dragon')], 1.35),
      wave('w3', [elite('demon_prince', 2), elite('fallen_magic_god')], 1.45),
      wave('w4', [boss('vorax', 1, 'Vorax'), elite('void_herald')], 2.1),
    ],
  },
};

export function getMilestoneBlueprint(phaseId: PhaseId): MilestoneBlueprint | null {
  return MILESTONE_BY_PHASE_ID[phaseId] ?? null;
}

export function isMajorMilestoneTier(tier: number): boolean {
  return tier === 50 || tier === 100 || tier === 250 || tier === 500;
}

export function applyMilestoneBlueprint(
  phase: PhaseDefinition,
  blueprint: MilestoneBlueprint,
): PhaseDefinition {
  return {
    ...phase,
    displayName: blueprint.displayName,
    waves: blueprint.waves,
    statMultiplier: blueprint.statMultiplier,
    milestoneBoss: true,
    seasonFinale: phase.seasonFinale,
  };
}

export function getMilestoneBossType(mapIndex: number): EnemyType {
  return milestoneBossForMapIndex(mapIndex);
}
