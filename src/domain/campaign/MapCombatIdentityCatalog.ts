import { DamageElement } from '../combat/DamageElement';
import {
  PartialResistanceProfile,
  ResistanceProfile,
  ZERO_RESISTANCES,
} from '../combat/ResistanceProfile';
import { EnemyThemeTag } from '../enemies/EnemyThemeTags';
import { MapId } from './CampaignIds';

/** Soft band: build errada sofre, não trava. */
export const MAP_RESIST_BIAS_MIN = -15;
export const MAP_RESIST_BIAS_MAX = 20;

export interface MapCombatIdentity {
  mapId: MapId;
  /** Elementos que o jogador deve trazer. */
  primaryElements: readonly DamageElement[];
  /** Elementos/ameaças típicas dos inimigos (UI). */
  threatElements: readonly DamageElement[];
  threatLabel: string;
  favoredLabel: string;
  enemyTagsPreferred: readonly EnemyThemeTag[];
  /** Somado às resists inatas do monstro neste mapa. */
  mapResistBias: PartialResistanceProfile;
  /** Perfil médio de trash para estimativa de eficácia. */
  typicalTrashResists: ResistanceProfile;
  typicalEliteResists: ResistanceProfile;
}

const NEUTRAL_IDENTITY: Omit<MapCombatIdentity, 'mapId'> = {
  primaryElements: [],
  threatElements: [],
  threatLabel: 'Variada',
  favoredLabel: 'Qualquer',
  enemyTagsPreferred: [],
  mapResistBias: {},
  typicalTrashResists: { ...ZERO_RESISTANCES },
  typicalEliteResists: { ...ZERO_RESISTANCES },
};

const BASE_IDENTITIES: Record<'stendra' | 'gruftall' | 'valdris' | 'morthaven', Omit<MapCombatIdentity, 'mapId'>> =
  {
    stendra: {
      primaryElements: ['physical', 'lightning'],
      threatElements: ['physical'],
      threatLabel: 'Bestas e bandidos',
      favoredLabel: 'Físico / Raio',
      enemyTagsPreferred: ['beast', 'goblin', 'bandit', 'physical'],
      mapResistBias: { cold: -15 },
      typicalTrashResists: { ...ZERO_RESISTANCES, cold: -15 },
      typicalEliteResists: { ...ZERO_RESISTANCES, cold: -15, allElemental: 2 },
    },
    gruftall: {
      primaryElements: ['cold'],
      threatElements: ['fire'],
      threatLabel: 'Fogo e cinzas',
      favoredLabel: 'Gelo',
      enemyTagsPreferred: ['fire', 'goblin', 'demon'],
      mapResistBias: { fire: 20, cold: -15 },
      typicalTrashResists: { ...ZERO_RESISTANCES, fire: 12, cold: -15 },
      typicalEliteResists: { ...ZERO_RESISTANCES, fire: 18, cold: -15 },
    },
    valdris: {
      primaryElements: ['fire'],
      threatElements: ['air', 'physical'],
      threatLabel: 'Mortos e veneno',
      favoredLabel: 'Fogo',
      enemyTagsPreferred: ['undead', 'poison', 'shadow'],
      mapResistBias: { air: 15, fire: -15 },
      typicalTrashResists: { ...ZERO_RESISTANCES, air: 10, fire: -15 },
      typicalEliteResists: { ...ZERO_RESISTANCES, air: 15, fire: -15 },
    },
    morthaven: {
      primaryElements: ['lightning', 'fire'],
      threatElements: ['physical', 'air'],
      threatLabel: 'Elite sombria',
      favoredLabel: 'Raio / Fogo',
      enemyTagsPreferred: ['shadow', 'undead', 'orc', 'physical'],
      mapResistBias: { cold: 15, fire: -10, lightning: -10 },
      typicalTrashResists: { ...ZERO_RESISTANCES, cold: 10, fire: -10, lightning: -10 },
      typicalEliteResists: { ...ZERO_RESISTANCES, cold: 15, air: 8, fire: -10, lightning: -10 },
    },
  };

function clampSoftResist(value: number): number {
  return Math.max(MAP_RESIST_BIAS_MIN, Math.min(MAP_RESIST_BIAS_MAX, value));
}

function clampBiasProfile(bias: PartialResistanceProfile): PartialResistanceProfile {
  const next: PartialResistanceProfile = {};
  for (const key of ['fire', 'cold', 'lightning', 'air', 'allElemental'] as const) {
    if (bias[key] !== undefined) {
      next[key] = clampSoftResist(bias[key]!);
    }
  }
  return next;
}

export function resolveMapCombatIdentity(mapId: MapId | string): MapCombatIdentity {
  const id = mapId as MapId;
  if (id === 'stendra' || id === 'gruftall' || id === 'valdris' || id === 'morthaven') {
    return { mapId: id, ...BASE_IDENTITIES[id] };
  }

  return { mapId: id, ...NEUTRAL_IDENTITY };
}

export function applyMapResistBias(
  base: ResistanceProfile,
  mapId?: MapId | string | null,
): ResistanceProfile {
  if (!mapId) return base;
  const bias = clampBiasProfile(resolveMapCombatIdentity(mapId).mapResistBias);

  return {
    fire: base.fire + (bias.fire ?? 0),
    cold: base.cold + (bias.cold ?? 0),
    lightning: base.lightning + (bias.lightning ?? 0),
    air: base.air + (bias.air ?? 0),
    allElemental: base.allElemental + (bias.allElemental ?? 0),
  };
}

export function mapCombatHintLine(mapId: MapId | string): string {
  const identity = resolveMapCombatIdentity(mapId);
  if (identity.enemyTagsPreferred.length === 0) {
    return '';
  }
  return `Ameaça: ${identity.threatLabel} · Favorável: ${identity.favoredLabel}`;
}
