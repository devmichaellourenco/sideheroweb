import { FeatureFlagsDto } from '../../../application/dto/FeatureFlagsDto';
import { HeroDto } from '../../../application/dto/GameStateDto';
import { STAT_LINE_ICON_BY_ID, statIconImg } from '../../assets/StatIconCatalog';
import { improvementRefundLabel, improvementSpendLabel } from './HeroImprovementPointsPresentation';
import { renderHeroStatusExtras } from './HeroStatusSkillsPresentation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAttributeChip(
  key: 'str' | 'dex' | 'int',
  label: string,
  total: number,
  allocated: number,
  canSpend: boolean,
  canRefund: boolean,
): string {
  const allocatedHint =
    allocated > 0 ? `<span class="hero-attr-allocated">+${allocated}</span>` : '';

  return `
    <div class="hero-attr-chip">
      <span class="hero-attr-label">${statIconImg(key, 'hero-attr-icon')}${label}</span>
      <span class="hero-attr-value">${total}${allocatedHint}</span>
      <div class="hero-attr-actions">
        ${
          canRefund
            ? `<button
          type="button"
          class="hero-attr-refund"
          data-attr-refund="${key}"
          title="${improvementRefundLabel(label)}"
          aria-label="Reduzir ${label}"
        >−</button>`
            : ''
        }
        <button
          type="button"
          class="hero-attr-add"
          data-attr-spend="${key}"
          title="${improvementSpendLabel(label)}"
          aria-label="Aumentar ${label}"
          ${canSpend ? '' : 'disabled'}
        >+</button>
      </div>
    </div>
  `;
}

function renderStatRow(line: HeroDto['combatStatSheet'][number]['lines'][number]): string {
  const tooltip = line.tooltipLines
    .map((entry) => `<span class="hero-stat-tooltip-line">${escapeHtml(entry)}</span>`)
    .join('');
  const icon = statIconImg(STAT_LINE_ICON_BY_ID[line.id], 'hero-stat-icon');

  return `
    <div class="hero-stat-row" data-hero-stat-tooltip tabindex="0" aria-label="${escapeHtml(line.label)}: ${escapeHtml(line.value)}">
      <span class="hero-stat-label">${icon}${escapeHtml(line.label)}</span>
      <span class="hero-stat-value">${escapeHtml(line.value)}</span>
      <span class="hero-stat-tooltip-content hidden">
        <strong class="hero-stat-tooltip-title">${icon}${escapeHtml(line.label)}</strong>
        ${tooltip}
      </span>
    </div>
  `;
}

function renderStatSection(section: HeroDto['combatStatSheet'][number]): string {
  if (section.lines.length === 0) return '';

  return `
    <section class="hero-stat-section" aria-label="${escapeHtml(section.title)}">
      <h3 class="hero-stat-section-title">${escapeHtml(section.title)}</h3>
      <div class="hero-stat-list">
        ${section.lines.map(renderStatRow).join('')}
      </div>
    </section>
  `;
}

function renderMassResetButton(canMassReset: boolean): string {
  if (!canMassReset) return '';

  return `
    <div class="hero-mass-reset-row">
      <button type="button" class="hero-mass-reset-btn" data-mass-refund>
        Reset em massa
      </button>
    </div>
  `;
}

export function renderHeroAttributesTab(
  hero: HeroDto,
  featureFlags: Pick<FeatureFlagsDto, 'improvementReset'> = { improvementReset: 0 },
): string {
  const canSpend = hero.unspentImprovementPoints >= 1;
  const unitaryUnlocked = featureFlags.improvementReset >= 1;
  const massUnlocked = featureFlags.improvementReset >= 2;

  return `
    <section class="hero-attributes-tab">
      <div class="hero-attr-row">
        ${renderAttributeChip(
          'str',
          'STR',
          hero.totalAttributes.str,
          hero.allocatedAttributes.str,
          canSpend,
          unitaryUnlocked && hero.allocatedAttributes.str > 0,
        )}
        ${renderAttributeChip(
          'dex',
          'DEX',
          hero.totalAttributes.dex,
          hero.allocatedAttributes.dex,
          canSpend,
          unitaryUnlocked && hero.allocatedAttributes.dex > 0,
        )}
        ${renderAttributeChip(
          'int',
          'INT',
          hero.totalAttributes.int,
          hero.allocatedAttributes.int,
          canSpend,
          unitaryUnlocked && hero.allocatedAttributes.int > 0,
        )}
      </div>
      ${renderMassResetButton(massUnlocked)}
      <div class="hero-combat-stat-sheet">
        ${hero.combatStatSheet.map(renderStatSection).join('')}
      </div>
      ${renderHeroStatusExtras(hero)}
    </section>
  `;
}
