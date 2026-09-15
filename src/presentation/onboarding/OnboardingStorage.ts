import { ONBOARDING_STEP_ORDER, OnboardingStepId } from './OnboardingStepCatalog';

const DISMISSED_KEY = 'sidehero_onboarding_dismissed';
const SKIPPED_KEY = 'sidehero_onboarding_skipped';

function readDismissed(): Set<OnboardingStepId> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as OnboardingStepId[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function writeDismissed(dismissed: Set<OnboardingStepId>): void {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  } catch {
    // localStorage indisponível
  }
}

export function isOnboardingSkipped(): boolean {
  try {
    return localStorage.getItem(SKIPPED_KEY) === '1';
  } catch {
    return false;
  }
}

export function skipAllOnboarding(): void {
  try {
    localStorage.setItem(SKIPPED_KEY, '1');
  } catch {
    // localStorage indisponível
  }
}

export function loadDismissedOnboardingSteps(): Set<OnboardingStepId> {
  if (isOnboardingSkipped()) {
    return new Set(ONBOARDING_STEP_ORDER);
  }
  return readDismissed();
}

export function dismissOnboardingStep(stepId: OnboardingStepId): Set<OnboardingStepId> {
  const dismissed = readDismissed();
  dismissed.add(stepId);
  writeDismissed(dismissed);
  return dismissed;
}

export function resetOnboardingForTests(): void {
  try {
    localStorage.removeItem(DISMISSED_KEY);
    localStorage.removeItem(SKIPPED_KEY);
  } catch {
    // ignore
  }
}
