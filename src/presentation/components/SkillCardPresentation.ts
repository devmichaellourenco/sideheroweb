import { SkillNodeDto, SkillRankSlotDto } from '../../application/dto/SkillNodeDto';
import { getSkillIconUrl } from '../assets/SkillIconCatalog';
import { imgTag } from '../assets/AssetCatalog';
import { renderSkillLockIcon, renderSkillRankLabel, renderSkillTooltipContent } from './SkillTooltipPresentation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface SkillCardOptions {
  allocateAttr: string;
  canAllocate: boolean;
  refundAttr?: string;
  canRefund?: boolean;
  /** Rótulo do ponto gasto no tooltip do level (ex.: Aprimoramento). */
  spendPointLabel?: string;
}

const SKILL_STATUS_LABELS: Record<SkillNodeDto['status'], string> = {
  locked: 'Bloqueada',
  ready: 'Disponível',
  owned: 'Desbloqueada',
  maxed: 'Level máximo',
};

function renderRankDotPreview(slot: SkillRankSlotDto): string {
  const lines = slot.previewLines
    .map((line) => `<li class="skill-rank-dot-preview__line">${escapeHtml(line)}</li>`)
    .join('');

  return `
    <span class="skill-rank-dot-preview" role="tooltip">
      <strong class="skill-rank-dot-preview__title">${escapeHtml(slot.previewTitle)}</strong>
      <ul class="skill-rank-dot-preview__lines">${lines}</ul>
    </span>
  `;
}

function renderSkillRankDot(
  node: SkillNodeDto,
  slot: SkillRankSlotDto,
  options: SkillCardOptions,
): string {
  const canAllocate = slot.canAllocate && options.canAllocate;
  const stateClass = slot.filled
    ? 'skill-rank-dot--filled'
    : slot.isNext
      ? 'skill-rank-dot--next'
      : 'skill-rank-dot--empty';
  // Não usar HTML disabled: botões disabled não recebem hover e o preview some.
  const allocateAttrs = canAllocate
    ? `${options.allocateAttr}="${escapeHtml(node.id)}"`
    : 'aria-disabled="true"';
  const interactiveClass = canAllocate ? ' skill-rank-dot--interactive' : '';
  const ariaLabel = slot.filled
    ? `Level ${slot.rank} aplicado`
    : canAllocate
      ? `Adicionar level ${slot.rank}`
      : `Level ${slot.rank} — ver melhoria`;

  return `
    <button
      type="button"
      class="skill-rank-dot ${stateClass}${interactiveClass}"
      data-skill-rank-tooltip
      ${allocateAttrs}
      aria-label="${escapeHtml(ariaLabel)}"
      aria-pressed="${slot.filled ? 'true' : 'false'}"
    >
      <span class="skill-rank-dot__ring" aria-hidden="true"></span>
      ${renderRankDotPreview(slot)}
    </button>
  `;
}

function renderSkillRankDownButton(node: SkillNodeDto, options: SkillCardOptions): string {
  if (!options.refundAttr || !options.canRefund || node.currentRank < 1) return '';

  const tooltip = `Devolver 1 level (${node.currentRank} → ${node.currentRank - 1})`;

  return `
    <button
      type="button"
      class="skill-row-rank-down skill-row-rank-down--available"
      ${options.refundAttr}="${escapeHtml(node.id)}"
      title="${escapeHtml(tooltip)}"
      aria-label="${escapeHtml(tooltip)}"
    >−</button>
  `;
}

export function renderSkillCard(node: SkillNodeDto, options: SkillCardOptions): string {
  const iconUrl = getSkillIconUrl(node.id);
  const isLocked = node.status === 'locked';
  const lockOverlay = isLocked ? renderSkillLockIcon() : '';
  const equipAttrs = node.canEquip
    ? `data-skill-equip="${escapeHtml(node.id)}" draggable="true"`
    : '';
  const equipClass = node.canEquip ? ' skill-row--equippable' : '';
  const equippedClass = node.isEquipped ? ' skill-row--equipped-active' : '';
  const ariaEquipped = node.isEquipped ? ', equipada na batalha' : '';
  const rankDots = (node.rankSlots ?? []).map((slot) => renderSkillRankDot(node, slot, options)).join('');

  return `
    <article
      class="skill-row skill-row--${node.status} skill-row--${node.branch}${equipClass}${equippedClass}"
      aria-label="${escapeHtml(node.name)}${ariaEquipped} — ${escapeHtml(renderSkillRankLabel(node.currentRank, node.maxRank, node.status))}"
    >
      <h4 class="skill-row__name">${escapeHtml(node.name)}</h4>
      <div class="skill-row__body">
        <div
          class="skill-row__icon-wrap${isLocked ? ' skill-row__icon-wrap--locked' : ''}"
          data-skill-tooltip
          tabindex="0"
          ${equipAttrs}
          aria-label="${escapeHtml(node.name)} — detalhes"
        >
          ${imgTag(iconUrl, node.name, 'skill-row__icon')}
          ${lockOverlay}
          ${renderSkillTooltipContent({
            ...node,
            status: node.status,
            statusLabel:
              node.canAllocateRank && node.status === 'ready'
                ? undefined
                : SKILL_STATUS_LABELS[node.status],
          })}
        </div>
        <div class="skill-row__ranks" role="group" aria-label="Progressão de levels">
          ${renderSkillRankDownButton(node, options)}
          ${rankDots}
        </div>
      </div>
    </article>
  `;
}
