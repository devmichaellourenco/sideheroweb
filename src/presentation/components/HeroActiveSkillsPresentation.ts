import { HeroDto } from '../../application/dto/GameStateDto';
import { imgTag, getGearFrameSprite } from '../assets/AssetCatalog';
import { getSkillBranchFrameUrl, getSkillIconUrl } from '../assets/SkillIconCatalog';
import { renderSkillCooldownOverlay } from './HeroSkillCooldownPresentation';
import { renderSkillRankLabel, renderSkillTooltipContent } from './SkillTooltipPresentation';

const LOCKED_SLOT_UPGRADE_NAMES: Record<number, string> = {
  2: 'Slot de skill II',
  3: 'Slot de skill III',
};

export interface HeroSkillSlotBarOptions {
  mode: 'loadout' | 'skills-tab';
  heroId: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInteractiveSkillChip(
  skill: HeroDto['activeSkills'][number],
  hero: HeroDto,
  slotIndex: number,
): string {
  if (!skill) return '';

  const rankLabel = renderSkillRankLabel(skill.currentRank, skill.maxRank);
  const frameUrl = getSkillBranchFrameUrl(skill.branch);
  const isBasicAttack = skill.id === 'basic_attack';

  if (isBasicAttack) {
    return `
      <button
        type="button"
        class="loadout-slot loadout-slot--skill hero-skill-chip hero-skill-chip--${skill.branch} hero-skill-slot-bar__slot hero-skill-slot-bar__slot--fixed"
        data-skill-slot-index="${slotIndex}"
        data-skill-tooltip
        aria-label="${escapeHtml(skill.name)} — ${escapeHtml(rankLabel)}"
        title="${escapeHtml(skill.name)}"
        style="--slot-frame: url('${frameUrl}')"
      >
        <span class="hero-skill-chip-media">
          ${imgTag(getSkillIconUrl(skill.id), skill.name, 'loadout-slot-icon hero-skill-chip-icon')}
        </span>
        ${renderSkillTooltipContent(skill)}
      </button>
    `;
  }

  return `
    <button
      type="button"
      class="loadout-slot loadout-slot--skill hero-skill-chip hero-skill-chip--${skill.branch} hero-skill-slot-bar__slot hero-skill-slot-bar__slot--filled"
      data-skill-slot-index="${slotIndex}"
      data-skill-id="${skill.id}"
      data-skill-tooltip
      aria-label="${escapeHtml(skill.name)} — ${escapeHtml(rankLabel)}"
      title="Clique para trocar · × para remover"
      style="--slot-frame: url('${frameUrl}')"
    >
      <span class="hero-skill-chip-media">
        ${imgTag(getSkillIconUrl(skill.id), skill.name, 'loadout-slot-icon hero-skill-chip-icon')}
      </span>
      <span class="hero-skill-slot-bar__remove" data-skill-slot-clear="${skill.id}" title="Remover do slot" aria-label="Remover ${escapeHtml(skill.name)} do slot">×</span>
      ${renderSkillTooltipContent(skill)}
    </button>
  `;
}

function renderEmptyAssignableSlot(slotIndex: number, heroId: string): string {
  const frameUrl = getGearFrameSprite('common');
  const title = 'Slot vazio — clique para escolher uma skill ou arraste uma skill até aqui';

  return `
    <button
      type="button"
      class="loadout-slot loadout-slot--skill loadout-slot--empty hero-skill-chip hero-skill-chip--empty hero-skill-slot-bar__slot hero-skill-slot-bar__slot--empty"
      data-skill-slot-index="${slotIndex}"
      data-skill-slot-hero="${heroId}"
      style="--slot-frame: url('${frameUrl}')"
      title="${title}"
      aria-label="${title}"
    >
      <span class="hero-skill-slot-bar__plus" aria-hidden="true">+</span>
    </button>
  `;
}

function renderLockedSkillSlot(slotNumber: number): string {
  const frameUrl = getGearFrameSprite('common');
  const upgradeName = LOCKED_SLOT_UPGRADE_NAMES[slotNumber] ?? 'Runas';
  const title = `Slot bloqueado — desbloqueie em Runas (${upgradeName})`;

  return `
    <button
      type="button"
      class="loadout-slot loadout-slot--skill loadout-slot--locked hero-skill-slot-bar__slot hero-skill-slot-bar__slot--locked"
      data-open-upgrades
      style="--slot-frame: url('${frameUrl}')"
      title="${title}"
      aria-label="${title}"
    >
      <span class="loadout-slot-lock" aria-hidden="true">🔒</span>
    </button>
  `;
}

function renderLoadoutSkillChip(
  skill: NonNullable<HeroDto['activeSkills'][number]>,
  hero: HeroDto,
): string {
  const rankLabel = renderSkillRankLabel(skill.currentRank, skill.maxRank);
  const frameUrl = getSkillBranchFrameUrl(skill.branch);
  const cooldown = hero.combatSkillCooldowns.find((entry) => entry.skillId === skill.id);
  const cooldownHint =
    cooldown && !cooldown.ready ? ` · recarga ${cooldown.cooldownLabel}` : '';

  return `
    <button
      type="button"
      class="loadout-slot loadout-slot--skill hero-skill-chip hero-skill-chip--${skill.branch}"
      data-hero-skills-open="${hero.id}"
      data-hero-skill-chip="${hero.id}"
      data-skill-id="${skill.id}"
      data-skill-tooltip
      aria-label="${escapeHtml(skill.name)} — ${escapeHtml(rankLabel)}${cooldownHint}"
      title="${escapeHtml(skill.name)}"
      style="--slot-frame: url('${frameUrl}')"
    >
      <span class="hero-skill-chip-media">
        ${imgTag(getSkillIconUrl(skill.id), skill.name, 'loadout-slot-icon hero-skill-chip-icon')}
        ${renderSkillCooldownOverlay(cooldown)}
      </span>
      ${renderSkillTooltipContent(skill)}
    </button>
  `;
}

function renderLoadoutEmptySlot(heroId: string): string {
  const frameUrl = getGearFrameSprite('common');
  const title = 'Slot de skill vazio — clique para gerenciar skills';

  return `
    <button
      type="button"
      class="loadout-slot loadout-slot--skill loadout-slot--empty hero-skill-chip hero-skill-chip--empty"
      data-hero-skills-open="${heroId}"
      style="--slot-frame: url('${frameUrl}')"
      title="${title}"
      aria-label="${title}"
    ></button>
  `;
}

export function renderHeroSkillSlotsRow(hero: HeroDto, options: HeroSkillSlotBarOptions): string {
  return Array.from({ length: hero.maxActiveSkills }, (_, index) => {
    const slotNumber = index + 1;

    if (slotNumber > hero.unlockedActiveSkillSlots) {
      return renderLockedSkillSlot(slotNumber);
    }

    const skill = hero.activeSkills[index] ?? null;

    if (options.mode === 'skills-tab') {
      return skill
        ? renderInteractiveSkillChip(skill, hero, index)
        : renderEmptyAssignableSlot(index, options.heroId);
    }

    return skill ? renderLoadoutSkillChip(skill, hero) : renderLoadoutEmptySlot(hero.id);
  }).join('');
}

export function renderHeroSkillSlotBar(hero: HeroDto, options: HeroSkillSlotBarOptions): string {
  const slots = renderHeroSkillSlotsRow(hero, options);

  return `
    <div class="hero-skill-slot-bar hero-skill-slot-bar--${options.mode}">
      ${options.mode === 'skills-tab' ? `<p class="hero-skill-slot-bar-label">Skills ativas</p>` : ''}
      <div class="hero-skill-slot-bar-slots">${slots}</div>
    </div>
  `;
}

export function renderHeroActiveSkillSlots(hero: HeroDto): string {
  return renderHeroSkillSlotsRow(hero, { mode: 'loadout', heroId: hero.id });
}
