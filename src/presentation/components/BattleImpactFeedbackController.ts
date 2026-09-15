import { CombatFloatingEventDto, CombatFloatKind } from '../../application/dto/CombatFloatingEventDto';
import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

const IMPACT_DURATION_MS = 700;

const IMPACT_ICON: Record<'damage' | 'heal' | 'buff' | 'debuff', string> = {
  damage: ASSETS.ui.attack,
  heal: ASSETS.skills.heal,
  buff: ASSETS.skills.buff,
  debuff: ASSETS.skills.debuff,
};

export class BattleImpactFeedbackController {
  constructor(
    private readonly floatLayer: HTMLElement,
    private readonly battleStrip: HTMLElement,
  ) {}

  show(events: CombatFloatingEventDto[]): void {
    if (!events.length) return;

    for (const event of events) {
      const visualKind = this.resolveVisualKind(event.kind);
      if (!visualKind) continue;

      const card = this.findCard(event);
      const anchor = this.findAnchor(event);
      if (!card || !anchor) continue;

      this.spawnImpact(card, anchor, visualKind);
    }
  }

  private resolveVisualKind(kind: CombatFloatKind): keyof typeof IMPACT_ICON | null {
    if (kind === 'crit') return 'damage';
    if (kind === 'crit-heal') return 'heal';
    if (kind === 'crit-buff') return 'buff';
    if (kind in IMPACT_ICON) return kind as keyof typeof IMPACT_ICON;
    return null;
  }

  private findCard(event: CombatFloatingEventDto): HTMLElement | null {
    if (event.target === 'hero') {
      return this.battleStrip.querySelector(`[data-hero-id="${event.targetId}"]`);
    }

    return this.battleStrip.querySelector(`[data-enemy-id="${event.targetId}"]`);
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

  private spawnImpact(
    card: HTMLElement,
    anchor: HTMLElement,
    kind: keyof typeof IMPACT_ICON,
  ): void {
    const anchorRect = anchor.getBoundingClientRect();
    const stripRect = this.battleStrip.getBoundingClientRect();

    card.classList.remove(
      'battle-card--impact-damage',
      'battle-card--impact-heal',
      'battle-card--impact-buff',
      'battle-card--impact-debuff',
    );
    void card.offsetWidth;
    card.classList.add(`battle-card--impact-${kind}`);

    if (kind === 'damage') {
      card.classList.add('battle-card--shake');
      window.setTimeout(() => card.classList.remove('battle-card--shake'), 380);
    }

    window.setTimeout(() => {
      card.classList.remove(`battle-card--impact-${kind}`);
    }, IMPACT_DURATION_MS);

    const overlay = document.createElement('span');
    overlay.className = `battle-impact battle-impact--${kind}`;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.left = `${anchorRect.left - stripRect.left + anchorRect.width / 2}px`;
    overlay.style.top = `${anchorRect.top - stripRect.top + 4}px`;

    const icon = document.createElement('img');
    icon.src = getAssetUrl(IMPACT_ICON[kind]);
    icon.alt = '';
    icon.className = 'battle-impact-icon';
    overlay.appendChild(icon);

    this.floatLayer.appendChild(overlay);
    window.setTimeout(() => overlay.remove(), IMPACT_DURATION_MS);
  }
}
