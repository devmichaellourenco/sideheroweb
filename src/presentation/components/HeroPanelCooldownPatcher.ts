import { GameStateDto, HeroSkillCooldownDto } from '../../application/dto/GameStateDto';
import { getSkillCooldownRatio } from './HeroSkillCooldownPresentation';
import { stampSkillCooldownOverlay } from './SkillCooldownDisplayAnimator';

function findCooldown(
  heroId: string,
  skillId: string,
  state: GameStateDto,
): HeroSkillCooldownDto | undefined {
  const hero = state.activeParty.find((entry) => entry.id === heroId);
  return hero?.combatSkillCooldowns.find((entry) => entry.skillId === skillId);
}

function ensureCooldownOverlay(chip: HTMLElement): HTMLElement {
  let media = chip.querySelector<HTMLElement>('.hero-skill-chip-media');
  if (!media) {
    const icon = chip.querySelector('.hero-skill-chip-icon');
    media = document.createElement('span');
    media.className = 'hero-skill-chip-media';
    if (icon) {
      chip.insertBefore(media, icon);
      media.appendChild(icon);
    } else {
      chip.prepend(media);
    }
  }

  let overlay = media.querySelector<HTMLElement>('.hero-skill-cooldown');
  if (!overlay) {
    overlay = document.createElement('span');
    overlay.className = 'hero-skill-cooldown hero-skill-cooldown--ready';
    overlay.setAttribute('aria-hidden', 'true');

    const shade = document.createElement('span');
    shade.className = 'hero-skill-cooldown-shade';
    overlay.appendChild(shade);

    const label = document.createElement('span');
    label.className = 'hero-skill-cooldown-label';
    overlay.appendChild(label);

    media.appendChild(overlay);
  }

  return overlay;
}

function patchChip(chip: HTMLElement, cooldown: HeroSkillCooldownDto | undefined): void {
  const overlay = ensureCooldownOverlay(chip);
  const shade = overlay.querySelector<HTMLElement>('.hero-skill-cooldown-shade');
  const label = overlay.querySelector<HTMLElement>('.hero-skill-cooldown-label');
  if (!shade || !label) return;

  if (!cooldown || cooldown.ready) {
    overlay.classList.add('hero-skill-cooldown--ready');
    shade.style.setProperty('--cooldown-ratio', '0');
    label.textContent = '';
    overlay.removeAttribute('data-remaining-label');
    delete overlay.dataset.cdRemaining;
    delete overlay.dataset.cdTotal;
    delete overlay.dataset.cdCapturedAt;
    return;
  }

  const ratio = getSkillCooldownRatio(cooldown);
  const remainingLabel = cooldown.cooldownLabel;

  overlay.classList.remove('hero-skill-cooldown--ready');
  shade.style.setProperty('--cooldown-ratio', String(ratio));
  label.textContent = remainingLabel;
  overlay.setAttribute('data-remaining-label', remainingLabel);
  stampSkillCooldownOverlay(overlay, cooldown.secondsRemaining, cooldown.cooldownTotal);
}

export function patchHeroPanelCooldowns(container: HTMLElement, state: GameStateDto): void {
  if (state.canEditParty) {
    container.querySelectorAll('.hero-skill-cooldown').forEach((overlay) => {
      overlay.classList.add('hero-skill-cooldown--ready');
      const shade = overlay.querySelector<HTMLElement>('.hero-skill-cooldown-shade');
      shade?.style.setProperty('--cooldown-ratio', '0');
      const label = overlay.querySelector<HTMLElement>('.hero-skill-cooldown-label');
      if (label) label.textContent = '';
    });
    return;
  }

  container.querySelectorAll<HTMLElement>('[data-hero-skill-chip][data-skill-id]').forEach((chip) => {
    const heroId = chip.dataset.heroSkillChip;
    const skillId = chip.dataset.skillId;
    if (!heroId || !skillId) return;

    patchChip(chip, findCooldown(heroId, skillId, state));
  });
}
