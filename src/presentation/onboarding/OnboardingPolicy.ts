import { GameStateDto } from '../../application/dto/GameStateDto';
import {
  MAP_TUTORIAL_STEP_IDS,
  ONBOARDING_STEP_ORDER,
  ONBOARDING_STEPS,
  OnboardingStep,
  OnboardingStepId,
} from './OnboardingStepCatalog';

export {
  MAP_TUTORIAL_STEP_IDS,
  ONBOARDING_STEP_ORDER,
  ONBOARDING_STEPS,
  type OnboardingStep,
  type OnboardingStepId,
};

/** Estado do painel que os passos do mapa precisam conhecer (não vem no DTO). */
export interface OnboardingUiContext {
  campaignMapOpen: boolean;
  missionPreviewOpen: boolean;
}

const IDLE_UI_CONTEXT: OnboardingUiContext = {
  campaignMapOpen: false,
  missionPreviewOpen: false,
};

/** Primeira sessão de verdade: nenhuma fase concluída ainda. */
function isFirstRun(state: GameStateDto): boolean {
  return (state.campaignProgress?.clearedPhaseIds?.length ?? 0) === 0;
}

/** A cena de abertura tem prioridade sobre o tutorial — só guia depois de vista. */
function hasSeenOpeningScene(state: GameStateDto): boolean {
  return (state.campaignProgress?.viewedActSceneIds?.length ?? 0) > 0;
}

export function isOnboardingStepTriggered(
  stepId: OnboardingStepId,
  state: GameStateDto,
  ui: OnboardingUiContext = IDLE_UI_CONTEXT,
): boolean {
  switch (stepId) {
    case 'welcome':
      return isFirstRun(state) && hasSeenOpeningScene(state) && state.canEditParty;
    case 'map-locations':
      return isFirstRun(state) && ui.campaignMapOpen && !ui.missionPreviewOpen;
    case 'map-mission-preview':
    case 'map-start-mission':
      return isFirstRun(state) && ui.campaignMapOpen && ui.missionPreviewOpen;
    case 'first-chest':
      return state.pendingChestCount > 0;
    case 'pause-loadout':
      // Botão mid-missão oculto — passo legado, não dispara.
      return false;
    case 'hero-points':
      return (
        state.canEditParty && state.heroes.some((hero) => hero.hasUnspentPoints)
      );
    case 'first-upgrade':
      return state.canEditParty && state.purchasableUpgradeCount > 0;
    case 'open-campaign':
      return (state.campaignProgress?.clearedPhaseIds?.length ?? 0) > 0;
    default:
      return false;
  }
}

export function resolveOnboardingStep(
  state: GameStateDto,
  dismissed: ReadonlySet<OnboardingStepId>,
  ui: OnboardingUiContext = IDLE_UI_CONTEXT,
): OnboardingStep | null {
  for (const stepId of ONBOARDING_STEP_ORDER) {
    if (dismissed.has(stepId)) continue;
    if (!isOnboardingStepTriggered(stepId, state, ui)) continue;

    return { id: stepId, ...ONBOARDING_STEPS[stepId] };
  }

  return null;
}

export function isOnboardingComplete(dismissed: ReadonlySet<OnboardingStepId>): boolean {
  return ONBOARDING_STEP_ORDER.every((stepId) => dismissed.has(stepId));
}
