import { DAMAGE_ELEMENT_LABELS, DamageElement } from '../../domain/combat/DamageElement';
import { CombatResistSummaryDto } from '../../application/dto/GameStateDto';

export type ElementPipVariant = 'skill' | 'inline';

const RESIST_KEYS: Array<keyof CombatResistSummaryDto> = [
  'fire',
  'cold',
  'lightning',
  'air',
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderElementPip(
  element: string,
  options: { variant?: ElementPipVariant; title?: string } = {},
): string {
  const variant = options.variant ?? 'skill';
  const label =
    options.title ??
    DAMAGE_ELEMENT_LABELS[element as DamageElement] ??
    element;

  return `<span class="element-pip element-pip--${escapeHtml(element)} element-pip--${variant}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"></span>`;
}

function renderCombatResistStat(
  element: keyof CombatResistSummaryDto,
  value: number,
): string {
  const label = DAMAGE_ELEMENT_LABELS[element];
  const rounded = Math.round(Math.abs(value));
  const isResist = value > 0;
  const kind = isResist ? 'resist' : 'weakness';
  const pct = isResist ? `−${rounded}%` : `+${rounded}%`;
  const tooltip = isResist
    ? `Resiste a ${label} (−${rounded}% dano)`
    : `Vulnerável a ${label} (+${rounded}% dano)`;

  return `<span class="element-stat element-stat--${kind} element-stat--${element}" title="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}"><span class="element-stat__pct">${pct}</span>${renderElementPip(element, { variant: 'inline' })}</span>`;
}

export function renderCombatResistPips(summary: CombatResistSummaryDto): string {
  const stats = RESIST_KEYS.flatMap((key) => {
    const value = summary[key];
    if (value === 0) return [];
    return [renderCombatResistStat(key, value)];
  });

  if (stats.length === 0) return '';

  return `<span class="element-stat-row" aria-label="Perfil elemental">${stats.join('')}</span>`;
}
