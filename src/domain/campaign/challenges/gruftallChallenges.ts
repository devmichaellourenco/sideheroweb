import { PhaseId, buildPhaseId } from '../CampaignIds';
import { formatPhaseChallengeHint } from '../PhaseChallengeTypes';
import { PhaseChallengeBlueprint, boss, elite, trash, wave } from './challengeBuilders';

/** Gruftall — fogo/cinzas; cold favorecido; pressiona mago de fogo e glass. */
export const GRUFTALL_CHALLENGES: Record<PhaseId, PhaseChallengeBlueprint> = {
  [buildPhaseId(2, 10)]: {
    kind: 'race',
    label: 'Corrida de dano',
    hint: formatPhaseChallengeHint('race'),
    displayName: 'Chaminés Apressadas',
    statMultiplier: 0.92,
    waves: [
      wave('w1', [trash('goblin_bomber', 2), trash('kobold_digger', 1)]),
      wave('w2', [trash('goblin_raider', 2), trash('goblin_bomber', 1)], 1.05),
      wave('w3', [elite('goblin_shaman'), trash('goblin_bomber', 2)], 1.12),
    ],
  },

  [buildPhaseId(2, 18)]: {
    kind: 'warded',
    wardedElement: 'fire',
    label: 'Escudo elemental',
    hint: formatPhaseChallengeHint('warded', { wardedElement: 'fire' }),
    displayName: 'Forja Abandonada',
    statMultiplier: 1.12,
    waves: [
      wave('w1', [trash('minor_fire_elemental', 2), trash('goblin_bomber', 1)]),
      wave('w2', [elite('minor_fire_elemental', 2), trash('kobold_digger', 1)], 1.12),
      wave('w3', [elite('goblin_shaman'), elite('minor_fire_elemental')], 1.2),
      wave('w4', [boss('minor_fire_elemental', 1, 'Coração da Forja'), trash('goblin_bomber', 2)], 1.32),
    ],
  },

  [buildPhaseId(2, 25)]: {
    kind: 'spike',
    spikeElement: 'fire',
    label: 'Pico de fogo',
    hint: formatPhaseChallengeHint('spike', { spikeElement: 'fire' }),
    displayName: 'Sopro de Cinzas',
    statMultiplier: 1.14,
    waves: [
      wave('w1', [trash('goblin_bomber', 2), trash('minor_fire_elemental', 1)]),
      wave('w2', [elite('goblin_bomber', 2), trash('kobold_digger', 1)], 1.15),
      wave('w3', [elite('bandit_captain'), elite('minor_fire_elemental')], 1.22),
      wave('w4', [boss('goblin_shaman', 1, 'Xamã Incendiário'), trash('goblin_bomber', 2)], 1.35),
    ],
  },

  [buildPhaseId(2, 40)]: {
    kind: 'armored',
    label: 'Couraça física',
    hint: formatPhaseChallengeHint('armored'),
    displayName: 'Escória Endurecida',
    statMultiplier: 1.16,
    waves: [
      wave('w1', [trash('orc_warrior', 2), trash('lizardman', 1)]),
      wave('w2', [elite('mountain_troll'), trash('orc_berserker', 2)], 1.15),
      wave('w3', [elite('hill_ogre'), elite('orc_warrior', 2)], 1.22),
      wave('w4', [boss('mountain_troll', 1, 'Troll de Escória'), trash('orc_warrior', 2)], 1.4),
    ],
  },

  [buildPhaseId(2, 50)]: {
    kind: 'spike',
    spikeElement: 'fire',
    label: 'Pico de fogo',
    hint: formatPhaseChallengeHint('spike', { spikeElement: 'fire' }),
    displayName: 'Centelha de Gonodor',
    statMultiplier: 1.58,
    waves: [
      wave('w1', [trash('goblin_bomber', 2), trash('minor_fire_elemental', 1)]),
      wave('w2', [elite('goblin_shaman'), elite('goblin_bomber', 2)], 1.2),
      wave('w3', [elite('bandit_captain'), trash('minor_fire_elemental', 2)], 1.3),
      wave('w4', [boss('gonodor', 1, 'Gonodor'), elite('goblin_bomber')], 1.75),
    ],
  },
};
