import { OnboardingStep } from './OnboardingPolicy';
import {
  dismissOnboardingStep,
  loadDismissedOnboardingSteps,
  skipAllOnboarding,
} from './OnboardingStorage';

export type OnboardingHandlers = {
  onDismissStep: (stepId: OnboardingStep['id']) => void;
  onSkipAll: () => void;
};

export class OnboardingController {
  static readonly STEP_GAP_MS = 1500;

  private readonly root: HTMLElement;
  private activeStep: OnboardingStep | null = null;
  private highlightedAnchor: HTMLElement | null = null;
  private anchorClone: HTMLElement | null = null;
  private dismissed = loadDismissedOnboardingSteps();
  private stepCooldownUntil = 0;

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'onboarding-root';
    this.root.className = 'onboarding-root hidden';
    this.root.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.root);

    window.addEventListener('resize', () => this.reposition());
    window.addEventListener('scroll', () => this.reposition(), true);
  }

  getDismissedSteps(): ReadonlySet<OnboardingStep['id']> {
    return this.dismissed;
  }

  isActive(): boolean {
    return this.activeStep !== null && !this.root.classList.contains('hidden');
  }

  getActiveStepId(): OnboardingStep['id'] | null {
    return this.activeStep?.id ?? null;
  }

  dismissStep(stepId: OnboardingStep['id']): void {
    this.dismissed = dismissOnboardingStep(stepId);
    if (this.activeStep?.id === stepId) {
      this.hide();
    }
  }

  skipAll(): void {
    skipAllOnboarding();
    this.dismissed = loadDismissedOnboardingSteps();
    this.hide();
  }

  show(step: OnboardingStep, handlers: OnboardingHandlers): void {
    if (
      this.activeStep &&
      this.activeStep.id !== step.id &&
      !this.root.classList.contains('hidden')
    ) {
      this.reposition();
      return;
    }

    if (!this.activeStep && Date.now() < this.stepCooldownUntil) {
      return;
    }

    if (this.activeStep?.id === step.id && !this.root.classList.contains('hidden')) {
      this.reposition();
      return;
    }

    this.clearHighlight();
    this.activeStep = step;
    this.root.classList.remove('hidden');
    this.root.innerHTML = `
      <div class="onboarding-backdrop" data-onboarding-dismiss></div>
      <div class="onboarding-spotlight hidden" aria-hidden="true"></div>
      <div
        class="onboarding-card"
        role="dialog"
        aria-labelledby="onboarding-title"
        ${step.variant ? `data-variant="${step.variant}"` : ''}
      >
        <p class="onboarding-kicker">${step.kicker ?? 'Dica'}</p>
        <h3 id="onboarding-title" class="onboarding-title">${step.title}</h3>
        <p class="onboarding-message">${step.message}</p>
        <footer class="onboarding-actions">
          <button type="button" class="onboarding-skip" data-onboarding-skip-all>Pular dicas</button>
          <button type="button" class="primary-btn onboarding-ok" data-onboarding-ok>${
            step.confirmLabel ?? 'Entendi'
          }</button>
        </footer>
      </div>
    `;

    this.root.querySelector('[data-onboarding-ok]')?.addEventListener('click', () => {
      handlers.onDismissStep(step.id);
    });

    this.root.querySelector('[data-onboarding-skip-all]')?.addEventListener('click', () => {
      handlers.onSkipAll();
    });

    this.root.querySelector('[data-onboarding-dismiss]')?.addEventListener('click', () => {
      handlers.onDismissStep(step.id);
    });

    requestAnimationFrame(() => this.reposition());
  }

  hide(): void {
    this.clearHighlight();
    if (this.activeStep) {
      this.stepCooldownUntil = Date.now() + OnboardingController.STEP_GAP_MS;
    }
    this.activeStep = null;
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
  }

  destroy(): void {
    this.hide();
    this.root.remove();
  }

  private reposition(): void {
    if (!this.activeStep) return;

    const anchor = this.activeStep.anchorSelector
      ? (document.querySelector(this.activeStep.anchorSelector) as HTMLElement | null)
      : null;
    const card = this.root.querySelector('.onboarding-card') as HTMLElement | null;
    if (!card) return;

    this.setHighlight(anchor);

    if (!anchor) {
      const centered = this.activeStep.variant === 'welcome';
      card.style.left = '50%';
      card.style.top = centered ? '50%' : 'auto';
      card.style.bottom = centered ? 'auto' : '96px';
      card.style.transform = centered ? 'translate(-50%, -50%)' : 'translateX(-50%)';
      card.dataset.placement = centered ? 'center' : 'bottom';
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const margin = 16;
    const viewportPadding = 12;

    let top = rect.bottom + margin;
    let placement: 'top' | 'bottom' = 'bottom';

    if (top + cardRect.height > window.innerHeight - viewportPadding) {
      top = rect.top - cardRect.height - margin;
      placement = 'top';
    }

    if (top < viewportPadding) {
      top = viewportPadding;
    }

    let left = rect.left + rect.width / 2 - cardRect.width / 2;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - cardRect.width - viewportPadding),
    );

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.bottom = 'auto';
    card.style.transform = 'none';
    card.dataset.placement = placement;
  }

  private setHighlight(anchor: HTMLElement | null): void {
    this.clearHighlight();
    const spotlight = this.root.querySelector('.onboarding-spotlight') as HTMLElement | null;
    const backdrop = this.root.querySelector('.onboarding-backdrop') as HTMLElement | null;

    if (!anchor || !spotlight) {
      spotlight?.classList.add('hidden');
      backdrop?.classList.remove('onboarding-backdrop--cutout');
      return;
    }

    anchor.classList.add('onboarding-highlight', 'onboarding-anchor-source');
    this.highlightedAnchor = anchor;

    const pad = 8;
    const rect = anchor.getBoundingClientRect();
    spotlight.classList.remove('hidden');
    backdrop?.classList.add('onboarding-backdrop--cutout');
    spotlight.style.top = `${Math.max(0, rect.top - pad)}px`;
    spotlight.style.left = `${Math.max(0, rect.left - pad)}px`;
    spotlight.style.width = `${rect.width + pad * 2}px`;
    spotlight.style.height = `${rect.height + pad * 2}px`;

    this.mountAnchorClone(anchor, rect);
  }

  /** Cópia visual do alvo acima do véu — garante ícone/texto visíveis no spotlight. */
  private mountAnchorClone(anchor: HTMLElement, rect: DOMRect): void {
    const clone = anchor.cloneNode(true) as HTMLElement;
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    clone.classList.add('onboarding-anchor-clone');
    clone.classList.remove('onboarding-highlight', 'onboarding-anchor-source');
    clone.setAttribute('tabindex', '-1');
    clone.setAttribute('aria-hidden', 'true');
    if (clone instanceof HTMLButtonElement) {
      clone.disabled = false;
    }

    const sourceImgs = anchor.querySelectorAll('img');
    clone.querySelectorAll('img').forEach((img, index) => {
      const source = sourceImgs[index];
      if (!(source instanceof HTMLImageElement)) return;
      img.src = source.currentSrc || source.src;
    });

    clone.style.position = 'fixed';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${Math.max(rect.width, 1)}px`;
    clone.style.height = `${Math.max(rect.height, 1)}px`;
    clone.style.margin = '0';
    // O rect já inclui o transform do âncora (ex.: pinos do mapa) — não reaplicar.
    clone.style.transform = 'none';
    clone.style.zIndex = '2';
    clone.style.pointerEvents = 'auto';
    clone.style.boxSizing = 'border-box';

    clone.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (anchor instanceof HTMLButtonElement && anchor.disabled) return;
      anchor.click();
    });

    this.root.appendChild(clone);
    this.anchorClone = clone;
  }

  private clearHighlight(): void {
    this.highlightedAnchor?.classList.remove('onboarding-highlight', 'onboarding-anchor-source');
    this.highlightedAnchor = null;
    this.anchorClone?.remove();
    this.anchorClone = null;
    const spotlight = this.root.querySelector('.onboarding-spotlight') as HTMLElement | null;
    const backdrop = this.root.querySelector('.onboarding-backdrop') as HTMLElement | null;
    spotlight?.classList.add('hidden');
    backdrop?.classList.remove('onboarding-backdrop--cutout');
  }
}
