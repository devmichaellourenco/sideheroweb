import { PhaseId, buildPhaseId } from '../CampaignIds';
import { formatPhaseChallengeHint } from '../PhaseChallengeTypes';
import { PhaseChallengeBlueprint, boss, elite, trash, wave } from './challengeBuilders';

/** Valdris — undead/veneno; fogo favorecido; anti-mago via bolsões de resist. */
export const VALDRIS_CHALLENGES: Record<PhaseId, PhaseChallengeBlueprint> = {
  [buildPhaseId(3, 10)]: {
    kind: 'race',
    label: 'Corrida de dano',
    hint: formatPhaseChallengeHint('race'),
    displayName: 'Procissão Rápida',
    statMultiplier: 0.93,
    waves: [
      wave('w1', [trash('skeleton_warrior', 2), trash('rot_zombie', 1)]),
      wave('w2', [trash('skeleton_warrior', 2), trash('giant_spider', 1)], 1.08),
      wave('w3', [elite('rot_zombie'), trash('skeleton_warrior', 2)], 1.12),
    ],
  },

  [buildPhaseId(3, 18)]: {
    kind: 'sustain',
    label: 'Atrito',
    hint: formatPhaseChallengeHint('sustain'),
    displayName: 'Cripta Putrefata',
    statMultiplier: 1.16,
    waves: [
      wave('w1', [trash('rot_zombie', 2), trash('giant_spider', 1)]),
      wave('w2', [elite('shadow_arachnid'), trash('rot_zombie', 2)], 1.12),
      wave('w3', [elite('renegade_necromancer'), trash('giant_spider', 2)], 1.2),
      wave('w4', [boss('renegade_necromancer', 1, 'Padre Putrefato'), elite('shadow_arachnid')], 1.35),
    ],
  },

  [buildPhaseId(3, 25)]: {
    kind: 'spike',
    spikeElement: 'air',
    label: 'Pico de veneno',
    hint: formatPhaseChallengeHint('spike', { spikeElement: 'air' }),
    displayName: 'Sopro da Cripta',
    statMultiplier: 1.13,
    waves: [
      wave('w1', [trash('giant_spider', 2), trash('rot_zombie', 1)]),
      wave('w2', [elite('shadow_arachnid'), trash('skeleton_warrior', 2)], 1.15),
      wave('w3', [elite('renegade_necromancer'), elite('shadow_arachnid')], 1.22),
      wave(
        'w4',
        [boss('shadow_arachnid', 1, 'Rainha da Cripta'), trash('rot_zombie', 2)],
        1.35,
      ),
    ],
  },

  // Bolso anti-mago: demônios/elementais com resist a fogo — físico ou troca de magia
  [buildPhaseId(3, 40)]: {
    kind: 'warded',
    wardedElement: 'fire',
    label: 'Escudo elemental',
    hint: formatPhaseChallengeHint('warded', { wardedElement: 'fire' }),
    displayName: 'Relíquia Infernal',
    statMultiplier: 1.15,
    waves: [
      wave('w1', [trash('lesser_demon', 2), trash('minor_fire_elemental', 1)]),
      wave('w2', [elite('lesser_demon'), elite('minor_fire_elemental')], 1.15),
      wave('w3', [elite('cultist_mage'), trash('lesser_demon', 2)], 1.22),
      wave('w4', [boss('lesser_demon', 1, 'Diácono Infernal'), elite('minor_fire_elemental')], 1.38),
    ],
  },

  [buildPhaseId(3, 50)]: {
    kind: 'armored',
    label: 'Couraça física',
    hint: formatPhaseChallengeHint('armored'),
    displayName: 'Espectro de Valdris',
    statMultiplier: 1.5,
    waves: [
      wave('w1', [trash('skeleton_warrior', 2), trash('death_knight', 1)]),
      wave('w2', [elite('death_knight'), elite('rot_zombie')], 1.2),
      wave('w3', [elite('renegade_necromancer'), trash('skeleton_warrior', 2)], 1.25),
      wave(
        'w4',
        [boss('renegade_necromancer', 1, 'Espectro de Valdris'), elite('death_knight')],
        1.65,
      ),
    ],
  },
};
