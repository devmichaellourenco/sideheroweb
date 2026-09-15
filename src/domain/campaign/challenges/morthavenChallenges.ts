import { PhaseId, buildPhaseId } from '../CampaignIds';
import { formatPhaseChallengeHint } from '../PhaseChallengeTypes';
import { PhaseChallengeBlueprint, boss, elite, trash, wave } from './challengeBuilders';

/** Morthaven — elite sombria; raio/fogo favorecidos; cold warded. */
export const MORTHAVEN_CHALLENGES: Record<PhaseId, PhaseChallengeBlueprint> = {
  [buildPhaseId(4, 10)]: {
    kind: 'race',
    label: 'Corrida de dano',
    hint: formatPhaseChallengeHint('race'),
    displayName: 'Patrulha do Duque',
    statMultiplier: 0.94,
    waves: [
      wave('w1', [trash('orc_warrior', 2), trash('orc_berserker', 1)]),
      wave('w2', [trash('skeleton_warrior', 2), trash('rot_zombie', 1)], 1.08),
      wave('w3', [elite('bloody_orc_chief'), trash('orc_warrior', 2)], 1.14),
    ],
  },

  [buildPhaseId(4, 18)]: {
    kind: 'armored',
    label: 'Couraça física',
    hint: formatPhaseChallengeHint('armored'),
    displayName: 'Muralha Sombria',
    statMultiplier: 1.15,
    waves: [
      wave('w1', [trash('death_knight', 2), trash('orc_warrior', 1)]),
      wave('w2', [elite('mountain_troll'), trash('death_knight', 2)], 1.15),
      wave('w3', [elite('bloody_orc_chief'), elite('death_knight')], 1.22),
      wave('w4', [boss('mountain_troll', 1, 'Baluarte Sombrio'), trash('orc_berserker', 2)], 1.38),
    ],
  },

  [buildPhaseId(4, 25)]: {
    kind: 'warded',
    wardedElement: 'cold',
    label: 'Escudo elemental',
    hint: formatPhaseChallengeHint('warded', { wardedElement: 'cold' }),
    displayName: 'Salão Gelado',
    statMultiplier: 1.14,
    waves: [
      wave('w1', [trash('frost_giant', 1), trash('skeleton_warrior', 2)]),
      wave('w2', [elite('frost_giant', 1, 'Sentinela Gélida'), trash('orc_warrior', 2)], 1.15),
      wave('w3', [elite('renegade_necromancer'), elite('frost_giant')], 1.22),
      wave(
        'w4',
        [boss('frost_giant', 1, 'Mordomo do Gelo'), trash('death_knight', 2)],
        1.36,
      ),
    ],
  },

  [buildPhaseId(4, 40)]: {
    kind: 'sustain',
    label: 'Atrito',
    hint: formatPhaseChallengeHint('sustain'),
    displayName: 'Jardim de Almas',
    statMultiplier: 1.18,
    waves: [
      wave('w1', [trash('shadow_arachnid', 2), trash('rot_zombie', 1)]),
      wave('w2', [elite('shadow_arachnid'), elite('renegade_necromancer')], 1.15),
      wave('w3', [elite('lesser_demon'), trash('shadow_arachnid', 2)], 1.25),
      wave(
        'w4',
        [boss('renegade_necromancer', 1, 'Jardineiro de Almas'), elite('shadow_arachnid')],
        1.4,
      ),
    ],
  },

  [buildPhaseId(4, 50)]: {
    kind: 'spike',
    spikeElement: 'air',
    label: 'Pico sombrio',
    hint: formatPhaseChallengeHint('spike', { spikeElement: 'air' }),
    displayName: 'Duque de Morthaven',
    statMultiplier: 1.52,
    waves: [
      wave('w1', [trash('orc_berserker', 2), trash('rot_zombie', 1)]),
      wave('w2', [elite('renegade_necromancer'), elite('skeleton_warrior', 2)], 1.2),
      wave('w3', [elite('mountain_troll'), trash('shadow_arachnid', 2)], 1.3),
      wave(
        'w4',
        [boss('morthaven_duke', 1, 'Duque de Morthaven'), elite('renegade_necromancer')],
        1.7,
      ),
    ],
  },
};
