import { HeroDto } from '../../application/dto/GameStateDto';
import { GearSlotKey, renderHeroEquipmentLoadout } from './GearPresentation';
import {
  HeroSkillSlotBarOptions,
  renderHeroSkillSlotsRow,
} from './HeroActiveSkillsPresentation';

export type HeroLoadoutStripVariant = 'default' | 'featured';

export function renderHeroLoadoutStrip(
  hero: HeroDto,
  options: {
    variant?: HeroLoadoutStripVariant;
    skillSlotMode?: HeroSkillSlotBarOptions['mode'];
    heroId?: string;
    showSkills?: boolean;
    showGear?: boolean;
    activeEquipSlot?: GearSlotKey;
    equipPickerMode?: boolean;
  } = {},
): string {
  const variantClass =
    options.variant === 'featured' ? ' hero-loadout-strip--featured' : '';
  const skillSlotMode = options.skillSlotMode ?? 'loadout';
  const heroId = options.heroId ?? hero.id;
  const showSkills = options.showSkills ?? true;
  const showGear = options.showGear ?? true;
  const equippedSkillCount = hero.activeSkills.filter(Boolean).length;

  const skillsSection = showSkills
    ? `
      <div class="hero-loadout-group hero-loadout-skills">
        ${renderHeroSkillSlotsRow(hero, { mode: skillSlotMode, heroId })}
      </div>
    `
    : '';

  const divider =
    showSkills && showGear
      ? '<div class="hero-loadout-divider" aria-hidden="true"></div>'
      : '';

  const gearSection = showGear
    ? `
      <div class="hero-loadout-group hero-loadout-gear">
        ${renderHeroEquipmentLoadout(hero, {
          activeSlot: options.activeEquipSlot,
          equipPickerMode: options.equipPickerMode,
        })}
      </div>
    `
    : '';

  const ariaLabel =
    showSkills && showGear
      ? `Loadout de batalha: ${equippedSkillCount}/${hero.maxActiveSkills} skills`
      : showSkills
        ? `Skills equipadas: ${equippedSkillCount}/${hero.maxActiveSkills}`
        : 'Equipamento';

  return `
    <div class="hero-loadout-strip${variantClass}" aria-label="${ariaLabel}">
      ${skillsSection}
      ${divider}
      ${gearSection}
    </div>
  `;
}
