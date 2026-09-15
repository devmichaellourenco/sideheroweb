import { PhaseId, buildPhaseId } from '../CampaignIds';
import { formatPhaseChallengeHint } from '../PhaseChallengeTypes';
import { PhaseChallengeBlueprint, boss, elite, trash, wave } from './challengeBuilders';

/** Stendra — rota de pressão multi-slot (priest, mago, físico, tank). */
export const STENDRA_CHALLENGES: Record<PhaseId, PhaseChallengeBlueprint> = {
  [buildPhaseId(1, 10)]: {
    kind: 'race',
    label: 'Corrida de dano',
    hint: formatPhaseChallengeHint('race'),
    displayName: 'Emboscada na Estrada',
    statMultiplier: 0.9,
    waves: [
      wave('w1', [trash('goblin_raider', 2), trash('gray_wolf', 1)]),
      wave('w2', [trash('goblin_archer', 2), trash('road_bandit', 1)], 1.05),
      wave('w3', [elite('goblin_shaman'), trash('goblin_raider', 2)], 1.1),
    ],
  },

  [buildPhaseId(1, 18)]: {
    kind: 'sustain',
    label: 'Atrito',
    hint: formatPhaseChallengeHint('sustain'),
    displayName: 'Ninho Venenoso',
    statMultiplier: 1.18,
    waves: [
      wave('w1', [trash('giant_spider', 2), trash('gray_wolf', 1)]),
      wave('w2', [elite('giant_spider'), trash('giant_spider', 2)], 1.1),
      wave('w3', [elite('bandit_captain'), trash('giant_spider', 2)], 1.15),
      wave('w4', [boss('hill_ogre', 1, 'Ogro Empanturrado'), elite('giant_spider')], 1.25),
    ],
  },

  [buildPhaseId(1, 25)]: {
    kind: 'spike',
    spikeElement: 'cold',
    label: 'Pico de gelo',
    hint: formatPhaseChallengeHint('spike', { spikeElement: 'cold' }),
    displayName: 'Geada Fora de Época',
    statMultiplier: 1.12,
    waves: [
      wave('w1', [trash('gray_wolf', 2), trash('cave_bat', 1)]),
      wave('w2', [elite('frost_giant', 1, 'Arauto Gelado'), trash('goblin_raider', 2)], 1.15),
      wave('w3', [elite('goblin_shaman'), elite('frost_giant', 1, 'Arauto Gelado')], 1.2),
      wave('w4', [boss('frost_giant', 1, 'Senhor da Geada'), trash('gray_wolf', 2)], 1.35),
    ],
  },

  // Anti-mago: brasas + gelo — kit elemental dilui; físico limpa melhor
  [buildPhaseId(1, 32)]: {
    kind: 'warded',
    wardedElement: 'fire',
    label: 'Escudo elemental',
    hint: formatPhaseChallengeHint('warded', { wardedElement: 'fire' }),
    displayName: 'Altar das Brasas',
    statMultiplier: 1.1,
    waves: [
      wave('w1', [trash('minor_fire_elemental', 2), trash('goblin_bomber', 1)]),
      wave('w2', [elite('minor_fire_elemental', 1, 'Brasa Viva'), elite('frost_giant', 1, 'Guarda Gélido')], 1.1),
      wave('w3', [elite('goblin_shaman'), elite('minor_fire_elemental', 1, 'Brasa Viva')], 1.18),
      wave(
        'w4',
        [
          boss('major_elemental', 1, 'Núcleo Flamejante'),
          trash('goblin_bomber', 2),
        ],
        1.3,
      ),
    ],
  },

  // Anti-físico: couraça — mago rende mais que berserker/arqueira
  [buildPhaseId(1, 40)]: {
    kind: 'armored',
    label: 'Couraça física',
    hint: formatPhaseChallengeHint('armored'),
    displayName: 'Muralha de Ogro',
    statMultiplier: 1.14,
    waves: [
      wave('w1', [trash('orc_warrior', 2), trash('lizardman', 1)]),
      wave('w2', [elite('hill_ogre', 1, 'Ogro Encouraçado'), trash('orc_warrior', 2)], 1.12),
      wave('w3', [elite('bandit_captain'), elite('mountain_troll')], 1.2),
      wave('w4', [boss('mountain_troll', 1, 'Senhor da Couraça'), trash('orc_berserker', 2)], 1.35),
    ],
  },

  [buildPhaseId(1, 50)]: {
    kind: 'sustain',
    label: 'Atrito',
    hint: formatPhaseChallengeHint('sustain'),
    displayName: 'Guardião Elemental',
    statMultiplier: 1.55,
    waves: [
      wave('w1', [trash('goblin_raider', 2), trash('giant_spider', 1)]),
      wave('w2', [elite('goblin_shaman', 2), elite('giant_spider')], 1.15),
      wave('w3', [elite('bandit_captain'), trash('giant_spider', 2)], 1.25),
      wave('w4', [boss('saci', 1, 'Saci'), elite('goblin_shaman'), elite('giant_spider')], 1.7),
    ],
  },
};
