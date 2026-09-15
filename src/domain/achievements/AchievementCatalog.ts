import { AchievementDefinition } from './AchievementDefinition';

export const HERO_OUT_OF_THE_SIDE_ID = 'hero_out_of_the_side';
export const STENDRA_GUARDIAN_ID = 'stendra_guardian';
export const GRUFTALL_EMBER_ID = 'gruftall_ember';
export const VALDRIS_SHADOW_ID = 'valdris_shadow';
export const MORTHAVEN_FINALE_ID = 'morthaven_finale';

const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: HERO_OUT_OF_THE_SIDE_ID,
    title: 'Hero - Out of the Side',
    description: 'Clear stage 1-1 for the first time.',
    target: 1,
    event: 'phase_cleared',
    phaseId: '1-1',
  },
  {
    id: STENDRA_GUARDIAN_ID,
    title: 'Guardião de Stendra',
    description: 'Derrote o Saci e conclua Stendra (fase 1-50).',
    target: 1,
    event: 'phase_cleared',
    phaseId: '1-50',
  },
  {
    id: GRUFTALL_EMBER_ID,
    title: 'Centelha de Gruftall',
    description: 'Derrote a Centelha de Gonodor e conclua Gruftall (fase 2-50).',
    target: 1,
    event: 'phase_cleared',
    phaseId: '2-50',
  },
  {
    id: VALDRIS_SHADOW_ID,
    title: 'Sombra de Valdris',
    description: 'Conclua Valdris derrotando o chefe da fase 3-50.',
    target: 1,
    event: 'phase_cleared',
    phaseId: '3-50',
  },
  {
    id: MORTHAVEN_FINALE_ID,
    title: 'Queda de Morthaven',
    description: 'Derrote o Duque de Morthaven e conclua a jornada (fase 4-50).',
    target: 1,
    event: 'phase_cleared',
    phaseId: '4-50',
  },
];

const BY_ID = new Map(ACHIEVEMENTS.map((entry) => [entry.id, entry]));

export function listAchievements(): readonly AchievementDefinition[] {
  return ACHIEVEMENTS;
}

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return BY_ID.get(id);
}

export function listAchievementsForPhaseCleared(phaseId: string): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(
    (entry) => entry.event === 'phase_cleared' && entry.phaseId === phaseId,
  );
}
