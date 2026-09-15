import { CombatFloatingEventDto } from '../../application/dto/CombatFloatingEventDto';
import {
  resolveBattleFloatClass,
  resolveBattleFloatLabel,
} from './BattleFloatingTextPresentation';

const FLOAT_DURATION_MS = 1750;

export class BattleFloatingTextController {
  constructor(
    private readonly layer: HTMLElement,
    private readonly battleStrip: HTMLElement,
  ) {}

  show(events: CombatFloatingEventDto[]): void {
    if (!events.length) return;

    const targetOffsets = new Map<string, number>();

    for (const event of events) {
      if (event.kind === 'buff' || event.kind === 'debuff') continue;

      const anchor = this.findAnchor(event);
      if (!anchor) continue;

      const offsetKey = `${event.target}:${event.targetId}:${event.kind}`;
      const offsetIndex = targetOffsets.get(offsetKey) ?? 0;
      targetOffsets.set(offsetKey, offsetIndex + 1);

      this.spawn(event, anchor, offsetIndex);
    }
  }

  private findAnchor(event: CombatFloatingEventDto): HTMLElement | null {
    if (event.target === 'hero') {
      return this.battleStrip.querySelector(
        `[data-hero-id="${event.targetId}"] [data-float-anchor="hero"]`,
      );
    }

    return this.battleStrip.querySelector(
      `[data-enemy-id="${event.targetId}"] [data-float-anchor="enemy"]`,
    );
  }

  private spawn(event: CombatFloatingEventDto, anchor: HTMLElement, offsetIndex: number): void {
    const label = resolveBattleFloatLabel(event);
    if (!label) return;

    const anchorRect = anchor.getBoundingClientRect();
    const stripRect = this.battleStrip.getBoundingClientRect();

    const float = document.createElement('span');
    float.className = `battle-float battle-float--${resolveBattleFloatClass(event)}`;
    float.textContent = label;
    float.setAttribute('role', 'presentation');
    float.setAttribute('aria-hidden', 'true');
    float.style.left = `${anchorRect.left - stripRect.left + anchorRect.width / 2 + offsetIndex * 8}px`;
    float.style.top = `${anchorRect.top - stripRect.top}px`;
    float.style.animationDelay = `${offsetIndex * 0.08}s`;

    this.layer.appendChild(float);
    window.setTimeout(() => float.remove(), FLOAT_DURATION_MS + offsetIndex * 80);
  }
}
