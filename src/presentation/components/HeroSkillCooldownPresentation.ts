import { HeroSkillCooldownDto } from '../../application/dto/GameStateDto';

export function getSkillCooldownRatio(cooldown: HeroSkillCooldownDto): number {
  return cooldown.cooldownRatio;
}

export function renderSkillCooldownOverlay(cooldown: HeroSkillCooldownDto | undefined): string {
  if (!cooldown || cooldown.ready) {
    return `
      <span class="hero-skill-cooldown hero-skill-cooldown--ready" aria-hidden="true">
        <span class="hero-skill-cooldown-shade"></span>
      </span>
    `;
  }

  return `
    <span
      class="hero-skill-cooldown"
      aria-hidden="true"
      data-remaining-label="${cooldown.cooldownLabel}"
    >
      <span
        class="hero-skill-cooldown-shade"
        style="--cooldown-ratio: ${cooldown.cooldownRatio}"
      ></span>
      <span class="hero-skill-cooldown-label">${cooldown.cooldownLabel}</span>
    </span>
  `;
}
