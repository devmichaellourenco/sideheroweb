import { GearDto, HeroActiveSkillDto, HeroActiveSkillStatDto, HeroDto } from '../../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl } from '../../assets/AssetCatalog';
import { getSkillIconUrl } from '../../assets/SkillIconCatalog';
import { statIconImg } from '../../assets/StatIconCatalog';
import { GEAR_SLOT_LABELS, GearSlotKey, listGearBonusEntries, renderUniqueEffectLine } from '../GearPresentation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TOOLTIP_ICON_PATHS: Record<string, string> = {
  attack: ASSETS.ui.attack,
  defense: ASSETS.ui.defense,
  health: ASSETS.ui.health,
  improvement: ASSETS.ui.improvement,
  rune: ASSETS.ui.rune,
  power_attack: ASSETS.skills.power_attack,
};

function listEquippedBattleSkills(hero: HeroDto): HeroActiveSkillDto[] {
  return hero.activeSkills.filter((skill): skill is HeroActiveSkillDto => skill !== null);
}

function asGearDto(
  gear: NonNullable<HeroDto['equipment'][string]>,
): Partial<GearDto> & Pick<GearDto, 'id' | 'name' | 'slot' | 'attackBonus' | 'defenseBonus' | 'healthBonus'> {
  return gear as Partial<GearDto> &
    Pick<GearDto, 'id' | 'name' | 'slot' | 'attackBonus' | 'defenseBonus' | 'healthBonus'>;
}

function renderTooltipIcon(iconKey: string | undefined): string {
  if (!iconKey) return '';
  const path = TOOLTIP_ICON_PATHS[iconKey];
  if (!path) return '';
  return `<img class="hero-stat-tooltip-icon" src="${getAssetUrl(path)}" alt="" aria-hidden="true" />`;
}

function renderStatTooltipContent(stat: HeroActiveSkillStatDto): string {
  const lines = stat.tooltipLines ?? [];
  if (lines.length === 0) {
    return `
      <span class="hero-stat-tooltip-content hidden">
        <strong class="hero-stat-tooltip-title">${escapeHtml(stat.label)}</strong>
        <span class="hero-stat-tooltip-line">${escapeHtml(stat.value)}</span>
      </span>
    `;
  }

  const body = lines
    .map(
      (line) => `
        <span class="hero-stat-tooltip-line">
          ${renderTooltipIcon(line.icon)}
          <span class="hero-stat-tooltip-line-text">${escapeHtml(line.text)}</span>
        </span>
      `,
    )
    .join('');

  return `
    <span class="hero-stat-tooltip-content hidden">
      <strong class="hero-stat-tooltip-title">${escapeHtml(stat.label)}</strong>
      ${body}
    </span>
  `;
}

function renderBattleStatRows(skill: HeroActiveSkillDto): string {
  if (skill.battleStats.length === 0) {
    return `<p class="hero-status-skill-empty">Sem estatísticas de batalha.</p>`;
  }

  return `
    <div class="hero-status-skill-stats" aria-label="Efeitos de ${escapeHtml(skill.name)}">
      ${skill.battleStats
        .map((stat) => {
          const emphasize = stat.emphasize ? ' hero-status-skill-stat--emphasize' : '';
          return `
            <div
              class="hero-status-skill-stat hero-stat-row${emphasize}"
              data-hero-stat-tooltip
              tabindex="0"
              aria-label="${escapeHtml(stat.label)}: ${escapeHtml(stat.value)}"
            >
              <span class="hero-status-skill-stat-label">${escapeHtml(stat.label)}</span>
              <span class="hero-status-skill-stat-value">${escapeHtml(stat.value)}</span>
              ${renderStatTooltipContent(stat)}
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderBattleSkillCard(skill: HeroActiveSkillDto): string {
  const iconUrl = getSkillIconUrl(skill.id);

  return `
    <article class="hero-status-skill-card" data-status-skill-id="${escapeHtml(skill.id)}">
      <header class="hero-status-skill-header">
        <img class="hero-status-skill-icon" src="${iconUrl}" alt="" aria-hidden="true" />
        <div class="hero-status-skill-titles">
          <h4 class="hero-status-skill-name">${escapeHtml(skill.name)}</h4>
          <p class="hero-status-skill-meta">
            ${escapeHtml(skill.branchLabel)} · Level ${skill.currentRank}/${skill.maxRank} · escala ${escapeHtml(skill.scalingLabel)}
          </p>
        </div>
      </header>
      <p class="hero-status-skill-hint">Passe o mouse em cada estatística para ver o cálculo.</p>
      ${renderBattleStatRows(skill)}
    </article>
  `;
}

export function renderStatusBattleSkillsSection(hero: HeroDto): string {
  const skills = listEquippedBattleSkills(hero);

  if (skills.length === 0) {
    return `
      <section class="hero-status-section" aria-label="Skills de batalha">
        <h3 class="hero-stat-section-title">Skills de batalha</h3>
        <p class="hero-status-empty">Nenhuma skill equipada nos slots de batalha.</p>
      </section>
    `;
  }

  return `
    <section class="hero-status-section" aria-label="Skills de batalha">
      <h3 class="hero-stat-section-title">Skills de batalha</h3>
      <p class="hero-status-section-intro">Números com o loadout atual. Hover revela a fórmula completa.</p>
      <div class="hero-status-skill-list">
        ${skills.map(renderBattleSkillCard).join('')}
      </div>
    </section>
  `;
}

function renderEquippedGearCard(
  gear: Partial<GearDto> & Pick<GearDto, 'id' | 'name' | 'slot' | 'attackBonus' | 'defenseBonus' | 'healthBonus'>,
): string {
  const slotKey = gear.slot as GearSlotKey;
  const slotLabel = GEAR_SLOT_LABELS[slotKey] ?? gear.slot;
  const bonusEntries = listGearBonusEntries(gear);
  const uniqueLine = renderUniqueEffectLine(gear);
  const hasBody = bonusEntries.length > 0 || Boolean(uniqueLine);

  return `
    <article class="hero-status-gear-card" data-status-gear-id="${escapeHtml(gear.id)}">
      <header class="hero-status-gear-header">
        <span class="hero-status-gear-slot">${escapeHtml(slotLabel)}</span>
        <h4 class="hero-status-gear-name">${escapeHtml(gear.name)}</h4>
      </header>
      ${
        hasBody
          ? `
            <ul class="hero-status-gear-bonuses">
              ${bonusEntries
                .map(
                  (entry) =>
                    `<li class="hero-status-gear-bonus">${statIconImg(entry.icon, 'gear-stat-icon')}<span class="gear-stat-line-text">${escapeHtml(entry.text)}</span></li>`,
                )
                .join('')}
            </ul>
            ${uniqueLine ? `<div class="hero-status-gear-unique">${uniqueLine}</div>` : ''}
          `
          : `<p class="hero-status-empty">Sem bônus listados neste item.</p>`
      }
    </article>
  `;
}

export function renderStatusEquipmentEffectsSection(hero: HeroDto): string {
  const equipped = Object.values(hero.equipment)
    .filter((gear): gear is NonNullable<typeof gear> => gear !== null)
    .map(asGearDto);

  if (equipped.length === 0) {
    return `
      <section class="hero-status-section" aria-label="Equipamento e passivas">
        <h3 class="hero-stat-section-title">Equipamento e passivas</h3>
        <p class="hero-status-empty">Nenhum item equipado.</p>
      </section>
    `;
  }

  return `
    <section class="hero-status-section" aria-label="Equipamento e passivas">
      <h3 class="hero-stat-section-title">Equipamento e passivas</h3>
      <p class="hero-status-section-intro">Bônus e efeitos únicos dos itens vestidos.</p>
      <div class="hero-status-gear-list">
        ${equipped.map(renderEquippedGearCard).join('')}
      </div>
    </section>
  `;
}

export function renderStatusPassivesSection(hero: HeroDto): string {
  const passives = hero.activePassives ?? [];

  if (passives.length === 0) {
    return `
      <section class="hero-status-section" aria-label="Passivas">
        <h3 class="hero-stat-section-title">Passivas</h3>
        <p class="hero-status-empty">Nenhuma passiva ativa.</p>
      </section>
    `;
  }

  return `
    <section class="hero-status-section" aria-label="Passivas">
      <h3 class="hero-stat-section-title">Passivas</h3>
      <p class="hero-status-section-intro">Traços sempre ativos da classe, ascensão e itens.</p>
      <ul class="hero-status-passive-list">
        ${passives
          .map(
            (passive) => `
          <li class="hero-status-passive-card" data-passive-id="${escapeHtml(passive.id)}">
            <div class="hero-status-passive-heading">
              <strong class="hero-status-passive-name">${escapeHtml(passive.name)}</strong>
              <span class="hero-status-passive-source">${escapeHtml(passive.sourceLabel)}</span>
            </div>
            <p class="hero-status-passive-summary">${escapeHtml(passive.effectiveSummary)}</p>
            <p class="hero-status-passive-desc">${escapeHtml(passive.description)}</p>
          </li>
        `,
          )
          .join('')}
      </ul>
    </section>
  `;
}

export function renderHeroStatusExtras(hero: HeroDto): string {
  return `
    ${renderStatusPassivesSection(hero)}
    ${renderStatusBattleSkillsSection(hero)}
    ${renderStatusEquipmentEffectsSection(hero)}
  `;
}
