import { EnemyDto } from '../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl, imgTag } from '../assets/AssetCatalog';
import { STAT_LINE_ICON_BY_ID, StatIconKey, statIconImg } from '../assets/StatIconCatalog';
import { renderCombatResistPips } from './ElementPipPresentation';
import { renderBattleActorCard } from './BattleActorCardPresentation';
import { clampHealthPercent, formatStripHealthCurrent } from './BattleActorHealthPresentation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatEnemyHealthLabel(enemy: Pick<EnemyDto, 'health' | 'maxHealth'>): string {
  return `${enemy.health}/${enemy.maxHealth}`;
}

function renderTooltipChip(
  iconHtml: string,
  value: string,
  title: string,
): string {
  return `
    <span class="enemy-tooltip-chip" title="${escapeHtml(title)}">
      ${iconHtml}
      <span class="enemy-tooltip-chip-value">${escapeHtml(value)}</span>
    </span>
  `;
}

function renderStatIconChip(
  key: StatIconKey | undefined,
  value: string,
  title: string,
): string {
  return renderTooltipChip(statIconImg(key, 'enemy-tooltip-stat-icon'), value, title);
}

function renderEnemySkillLines(enemy: EnemyDto): string {
  if (enemy.signatureSkills.length === 0) return '';

  return enemy.signatureSkills
    .map(
      (skill) =>
        `<span class="enemy-tooltip-line enemy-tooltip-skill">${escapeHtml(skill.name)} — ${escapeHtml(skill.description)}</span>`,
    )
    .join('');
}

/** Todas as linhas da ficha em grade 3 colunas: ícone + valor (label só no title). */
function renderEnemyStatSheetGrid(enemy: EnemyDto): string {
  const lines = (enemy.combatStatSheet ?? []).flatMap((section) => section.lines);
  if (lines.length === 0) return '';

  const chips = lines
    .map((line) => {
      const title = [line.label, ...line.tooltipLines].filter(Boolean).join('\n');
      return renderStatIconChip(STAT_LINE_ICON_BY_ID[line.id], line.value, title);
    })
    .join('');

  return `<div class="enemy-tooltip-grid" aria-label="Ficha de combate">${chips}</div>`;
}

function renderFallbackCombatGrid(enemy: EnemyDto): string {
  const tta = (1 / Math.max(enemy.attackSpeed, 0.01)).toFixed(2);
  return `
    <div class="enemy-tooltip-grid">
      ${renderStatIconChip('health', formatEnemyHealthLabel(enemy), 'Vida')}
      ${renderStatIconChip('attack', String(enemy.attack), 'Ataque')}
      ${renderStatIconChip('defense', String(enemy.defense), 'Defesa')}
      ${renderStatIconChip('attackSpeed', `${enemy.attackSpeed.toFixed(2)}/s`, 'Vel. de ataque')}
      ${renderStatIconChip('cooldown', `${tta}s`, 'Tempo até ação')}
    </div>
  `;
}

export function renderEnemyTooltipContent(enemy: EnemyDto, stage: number): string {
  const skillLines = renderEnemySkillLines(enemy);
  const elementalPips = renderCombatResistPips(enemy.combatResists);
  const attrs = enemy.attributes ?? { str: 0, dex: 0, int: 0 };
  const level = enemy.level ?? stage;
  const sheetGrid = renderEnemyStatSheetGrid(enemy);
  const goldIcon = imgTag(getAssetUrl(ASSETS.ui.gold), 'Ouro', 'enemy-tooltip-stat-icon');
  const xpIcon = imgTag(getAssetUrl(ASSETS.ui.xp), 'XP', 'enemy-tooltip-stat-icon');

  return `
    <strong class="enemy-tooltip-name">${escapeHtml(enemy.name)}</strong>
    <span class="enemy-tooltip-line">Nível ${level} · Tier ${stage}</span>
    <div class="enemy-tooltip-grid" aria-label="Atributos">
      ${renderStatIconChip('str', String(attrs.str), 'Força')}
      ${renderStatIconChip('dex', String(attrs.dex), 'Destreza')}
      ${renderStatIconChip('int', String(attrs.int), 'Inteligência')}
    </div>
    ${sheetGrid || renderFallbackCombatGrid(enemy)}
    <div class="enemy-tooltip-grid" aria-label="Recompensas">
      ${renderTooltipChip(goldIcon, `+${enemy.goldReward}`, 'Ouro')}
      ${
        enemy.xpReward > 0
          ? renderTooltipChip(xpIcon, `+${enemy.xpReward} XP`, 'Experiência')
          : ''
      }
    </div>
    ${elementalPips ? `<span class="enemy-tooltip-line enemy-tooltip-elements">${elementalPips}</span>` : ''}
    ${skillLines}
  `;
}

export function renderEnemyBattleCard(
  enemy: EnemyDto,
  stage: number,
  spriteHtml: string,
  options: { isActiveTurn?: boolean } = {},
): string {
  return renderBattleActorCard({
    side: 'enemy',
    id: enemy.id,
    name: enemy.name,
    isActiveTurn: options.isActiveTurn ?? false,
    isBoss: enemy.role === 'boss',
    spriteInnerHtml: spriteHtml,
    tooltipHtml: renderEnemyTooltipContent(enemy, stage),
    healthLabel: formatEnemyHealthLabel(enemy),
    healthCurrent: formatStripHealthCurrent(enemy.health),
    healthPercent: clampHealthPercent(enemy.health, enemy.maxHealth),
    actionTimeRatio: enemy.actionTimeRatio,
    actionTimeRemaining: enemy.actionTimeRemaining,
    actionTimeTotal: enemy.actionTimeTotal,
    attackSpeed: enemy.attackSpeed,
    statusEffects: enemy.statusEffects,
    combatSkills: enemy.combatSkills,
  });
}
