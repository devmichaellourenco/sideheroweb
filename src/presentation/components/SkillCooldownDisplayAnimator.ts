import { formatSkillCooldownCountdown } from '../../domain/combat/SkillCooldownTiming';
import { formatActionTimeBarTooltip, formatActionTimeCountdown } from './ActionTimeBarPresentation';

const UPDATE_INTERVAL_MS = 100;

/** Timers visuais só avançam com combate simulando (não em pausa/intermissão/acampamento). */
export function shouldAnimateBattleStripTimers(state: {
  phaseRun: unknown;
  canEditParty: boolean;
  battlePaused: boolean;
  combatIntermission: unknown;
}): boolean {
  return Boolean(
    state.phaseRun &&
      !state.canEditParty &&
      !state.battlePaused &&
      !state.combatIntermission,
  );
}

function updateOverlayElement(overlay: HTMLElement, remaining: number, total: number): void {
  const shade = overlay.querySelector<HTMLElement>('.hero-skill-cooldown-shade, .combat-skill-cooldown-shade');
  const label = overlay.querySelector<HTMLElement>('.hero-skill-cooldown-label, .combat-skill-cooldown-label');
  if (!shade) return;

  const ready = remaining <= 0 || total <= 0;
  const ratio = ready ? 0 : Math.min(1, remaining / total);

  if (ready) {
    overlay.classList.add('hero-skill-cooldown--ready', 'combat-skill-cooldown--ready');
    shade.style.setProperty('--cooldown-ratio', '0');
    if (label) label.textContent = '';
    overlay.removeAttribute('data-remaining-label');
    return;
  }

  overlay.classList.remove('hero-skill-cooldown--ready', 'combat-skill-cooldown--ready');
  shade.style.setProperty('--cooldown-ratio', String(ratio));
  if (label) {
    const countdown = formatSkillCooldownCountdown(remaining);
    label.textContent = countdown;
    overlay.setAttribute('data-remaining-label', countdown);
  }
}

function updateActionTimeBar(bar: HTMLElement, remaining: number, total: number): void {
  const fill = bar.querySelector<HTMLElement>('.action-time-fill');
  if (!fill) return;

  const ready = remaining <= 0 || total <= 0;
  const ratio = ready ? 1 : Math.max(0, Math.min(1, 1 - remaining / total));
  fill.style.width = `${ratio * 100}%`;

  const label = bar.querySelector<HTMLElement>('.strip-action-time-label');
  if (label) {
    label.textContent = formatActionTimeCountdown(remaining);
  }

  const attackSpeed = Number.parseFloat(bar.dataset.atAttackSpeed ?? '0');
  if (attackSpeed > 0) {
    bar.setAttribute('data-bar-label', formatActionTimeBarTooltip(attackSpeed, remaining, total));
  }
  bar.setAttribute(
    'aria-label',
    `Tempo até ação ${formatActionTimeCountdown(remaining) || 'pronto'}`,
  );
}

/** Interpola cooldowns de skills entre ticks de simulação. */
export class SkillCooldownDisplayAnimator {
  private intervalId: number | null = null;
  private combatActive = false;

  setCombatActive(active: boolean): void {
    this.combatActive = active;
    if (active) {
      this.start();
    } else {
      this.stop();
    }
  }

  /** Registra snapshot de cooldown para interpolação visual. */
  stampOverlay(overlay: HTMLElement, secondsRemaining: number, cooldownTotal: number): void {
    overlay.dataset.cdRemaining = String(Math.max(0, secondsRemaining));
    overlay.dataset.cdTotal = String(Math.max(0, cooldownTotal));
    overlay.dataset.cdCapturedAt = String(performance.now());
  }

  private start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = window.setInterval(() => this.tick(), UPDATE_INTERVAL_MS);
  }

  private stop(): void {
    if (this.intervalId === null) return;
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private tick(): void {
    if (!this.combatActive) return;

    const now = performance.now();
    document.querySelectorAll<HTMLElement>('[data-cd-remaining]').forEach((overlay) => {
      const baseRemaining = Number.parseFloat(overlay.dataset.cdRemaining ?? '0');
      const total = Number.parseFloat(overlay.dataset.cdTotal ?? '0');
      const capturedAt = Number.parseFloat(overlay.dataset.cdCapturedAt ?? String(now));
      const elapsed = (now - capturedAt) / 1000;
      const remaining = Math.max(0, baseRemaining - elapsed);
      updateOverlayElement(overlay, remaining, total);
    });

    document.querySelectorAll<HTMLElement>('[data-at-remaining]').forEach((bar) => {
      const baseRemaining = Number.parseFloat(bar.dataset.atRemaining ?? '0');
      const total = Number.parseFloat(bar.dataset.atTotal ?? '0');
      const capturedAt = Number.parseFloat(bar.dataset.atCapturedAt ?? String(now));
      const elapsed = (now - capturedAt) / 1000;
      const remaining = Math.max(0, baseRemaining - elapsed);
      updateActionTimeBar(bar, remaining, total);
    });
  }
}

export function stampSkillCooldownOverlay(
  overlay: HTMLElement,
  secondsRemaining: number,
  cooldownTotal: number,
): void {
  overlay.dataset.cdRemaining = String(Math.max(0, secondsRemaining));
  overlay.dataset.cdTotal = String(Math.max(0, cooldownTotal));
  overlay.dataset.cdCapturedAt = String(performance.now());
}
