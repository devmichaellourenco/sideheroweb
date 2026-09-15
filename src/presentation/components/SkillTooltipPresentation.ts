import { HeroActiveSkillStatDto } from '../../application/dto/GameStateDto';
import { SkillBranchDto, SkillNodeStatusDto, SkillRequirementDto } from '../../application/dto/SkillNodeDto';
import { getSkillElementLabel, getSkillPrimaryElement } from '../../domain/progression/combat/SkillElementResolver';
import { getSkillIconUrl } from '../assets/SkillIconCatalog';
import { renderElementPip } from './ElementPipPresentation';
import { renderTooltipPreviewImage } from './TooltipPreviewPresentation';

export interface SkillTooltipData {
  id: string;
  name: string;
  branch: SkillBranchDto;
  branchLabel: string;
  scopeLabel: string;
  scalingLabel: string;
  description: string;
  currentRank: number;
  maxRank: number;
  battleStats: HeroActiveSkillStatDto[];
  requirements?: SkillRequirementDto[];
  status?: SkillNodeStatusDto;
  statusLabel?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSkillElementMeta(skill: SkillTooltipData): string {
  const element = getSkillPrimaryElement(skill.id);
  if (!element || element === 'physical') {
    return '';
  }

  return ` ${renderElementPip(element, {
    variant: 'skill',
    title: getSkillElementLabel(skill.id) ?? undefined,
  })}`;
}

function renderBattleStats(battleStats: HeroActiveSkillStatDto[]): string {
  if (battleStats.length === 0) return '';

  const rows = battleStats
    .map(
      (stat) => `
        <div class="hero-skill-chip-tooltip-stat">
          <span class="hero-skill-chip-tooltip-stat-label">${escapeHtml(stat.label)}</span>
          <span class="hero-skill-chip-tooltip-stat-value">${escapeHtml(stat.value)}</span>
        </div>
      `,
    )
    .join('');

  return `
    <div class="hero-skill-chip-tooltip-section">
      <span class="hero-skill-chip-tooltip-section-title">Na batalha</span>
      <div class="hero-skill-chip-tooltip-stats">${rows}</div>
    </div>
  `;
}

function renderRequirements(requirements: SkillRequirementDto[]): string {
  if (requirements.length === 0) return '';

  const items = requirements
    .map(
      (req) =>
        `<li class="hero-skill-chip-tooltip-req hero-skill-chip-tooltip-req--${req.met ? 'met' : 'unmet'}">${escapeHtml(req.label)}</li>`,
    )
    .join('');

  return `
    <div class="hero-skill-chip-tooltip-section">
      <span class="hero-skill-chip-tooltip-section-title">Requisitos</span>
      <ul class="hero-skill-chip-tooltip-reqs">${items}</ul>
    </div>
  `;
}

export function renderSkillLockIcon(className = 'loadout-slot-lock'): string {
  return `<span class="skill-card-lock" aria-hidden="true"><span class="${className}">🔒</span></span>`;
}

export function renderSkillRankLabel(
  currentRank: number,
  maxRank: number,
  status?: SkillNodeStatusDto,
): string {
  if (maxRank <= 1) {
    if (currentRank > 0) return 'Level único';
    return status === 'locked' ? 'Bloqueada' : 'Disponível';
  }

  if (currentRank <= 0) {
    if (status === 'locked') return `Bloqueada (máx. ${maxRank})`;
    if (status === 'ready') return `0/${maxRank}`;
    return `Não desbloqueada (máx. ${maxRank})`;
  }

  return `Level ${currentRank}/${maxRank}`;
}

export function renderSkillRankDisplay(
  currentRank: number,
  maxRank: number,
  status: SkillNodeStatusDto,
): string {
  if (status === 'locked') {
    if (maxRank <= 1) return '';
    return `<span class="skill-card-rank skill-card-rank--muted">máx. ${maxRank}</span>`;
  }

  const label = renderSkillRankLabel(currentRank, maxRank, status);
  return `<span class="skill-card-rank">${escapeHtml(label)}</span>`;
}

export function renderSkillTooltipContent(skill: SkillTooltipData): string {
  const rankLabel = renderSkillRankLabel(skill.currentRank, skill.maxRank, skill.status);
  const statusLine = skill.statusLabel
    ? `<span class="hero-skill-chip-tooltip-status">${escapeHtml(skill.statusLabel)}</span>`
    : '';

  return `
    <span class="hero-skill-chip-tooltip" role="tooltip">
      ${renderTooltipPreviewImage(getSkillIconUrl(skill.id), skill.name)}
      <strong class="hero-skill-chip-tooltip-name">${escapeHtml(skill.name)}</strong>
      <span class="hero-skill-chip-tooltip-meta">
        ${escapeHtml(skill.branchLabel)} · ${escapeHtml(skill.scopeLabel)} · ${escapeHtml(skill.scalingLabel)}${renderSkillElementMeta(skill)}
      </span>
      <p class="hero-skill-chip-tooltip-desc">${escapeHtml(skill.description)}</p>
      ${renderBattleStats(skill.battleStats)}
      ${renderRequirements(skill.requirements ?? [])}
      <span class="hero-skill-chip-tooltip-rank">${escapeHtml(rankLabel)}</span>
      ${statusLine}
    </span>
  `;
}
