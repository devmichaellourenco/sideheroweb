import { HeroDto } from '../../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl, imgTag } from '../../assets/AssetCatalog';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderImprovementTooltipContent(): string {
  return `
    <strong class="hero-improvement-tooltip-title">Aprimoramento</strong>
    <span class="hero-improvement-tooltip-line">Você ganha <strong>1 Aprimoramento</strong> a cada nível.</span>
    <span class="hero-improvement-tooltip-line">Ao <strong>ascender</strong>, ganha pontos extras neste mesmo saldo.</span>
    <span class="hero-improvement-tooltip-line hero-improvement-tooltip-section">Como usar</span>
    <span class="hero-improvement-tooltip-line">· <strong>Status</strong> — toque em <strong>+</strong> em STR, DEX ou INT.</span>
    <span class="hero-improvement-tooltip-line">· <strong>Skills</strong> — ranks de classe e de evolução.</span>
    <span class="hero-improvement-tooltip-line hero-improvement-tooltip-note">Um único saldo para atributos e todas as skills.</span>
  `;
}

/** Chip compacto de Aprimoramento para a linha de stats do header (ícone + valor + tooltip rico). */
export function renderHeroImprovementStat(hero: HeroDto): string {
  const points = hero.unspentImprovementPoints;
  const availableClass = points > 0 ? ' hero-improvement-stat--available' : '';
  const icon = imgTag(getAssetUrl(ASSETS.ui.improvement), 'Aprimoramento', 'stat-icon');

  return `
    <span
      class="hero-improvement-stat${availableClass}"
      data-hero-improvement-tooltip
      tabindex="0"
      aria-label="Aprimoramento: ${points}"
    >
      ${icon}<span class="hero-improvement-stat-value">${points}</span>
      <span class="hero-improvement-tooltip-content hidden">${renderImprovementTooltipContent()}</span>
    </span>
  `;
}

export function improvementSpendLabel(attributeLabel: string): string {
  return `Gastar 1 Aprimoramento em ${escapeHtml(attributeLabel)}`;
}

export function improvementRefundLabel(attributeLabel: string): string {
  return `Devolver 1 Aprimoramento de ${escapeHtml(attributeLabel)}`;
}
