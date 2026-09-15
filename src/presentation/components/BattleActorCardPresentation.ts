import {
  CombatBattleSkillDto,
  CombatStatusEffectDto,
} from '../../application/dto/GameStateDto';
import { renderCombatSkillBar } from './CombatSkillIntentPresentation';
import { renderCombatStatusEffects } from './CombatStatusEffectPresentation';
import { renderStripActorBars } from './BattleActorHealthPresentation';

export type BattleActorSide = 'hero' | 'enemy';

export interface BattleActorCardViewModel {
  side: BattleActorSide;
  id: string;
  name: string;
  isActiveTurn: boolean;
  isBoss?: boolean;
  spriteInnerHtml: string;
  tooltipHtml: string;
  healthLabel: string;
  /** Vida atual exibida sobre a barra (sem máximo). */
  healthCurrent: string;
  healthPercent: number;
  actionTimeRatio: number;
  actionTimeRemaining: number;
  actionTimeTotal: number;
  attackSpeed: number;
  statusEffects: CombatStatusEffectDto[];
  combatSkills: CombatBattleSkillDto[] | null | undefined;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHitbox(vm: BattleActorCardViewModel): string {
  const statusHtml = renderCombatStatusEffects(vm.statusEffects);
  const safeId = escapeHtml(vm.id);
  const safeName = escapeHtml(vm.name);

  if (vm.side === 'hero') {
    return `
      <button
        type="button"
        class="hero-sprite hero-sprite--interactive battle-actor-hitbox"
        data-float-anchor="hero"
        data-hero-tooltip
        data-hero-battle-open="${safeId}"
        aria-label="Abrir ${safeName}"
      >
        ${vm.spriteInnerHtml}
        ${statusHtml}
        <span class="hero-tooltip-content hidden">${vm.tooltipHtml}</span>
      </button>
    `;
  }

  return `
    <div
      class="enemy-battle-hitbox battle-actor-hitbox"
      data-float-anchor="enemy"
      data-enemy-tooltip
      tabindex="0"
      aria-label="${safeName}"
    >
      ${vm.spriteInnerHtml}
      ${statusHtml}
      <span class="enemy-tooltip-content hidden">${vm.tooltipHtml}</span>
    </div>
  `;
}

export function renderBattleActorCard(vm: BattleActorCardViewModel): string {
  const activeClass =
    vm.isActiveTurn && vm.side === 'hero'
      ? ' hero-battle-card--active-turn'
      : vm.isActiveTurn
        ? ' enemy-battle-card--active-turn'
        : '';
  const sideClass = vm.side === 'hero' ? 'hero-battle-card' : 'enemy-battle-card';
  const bossClass = vm.isBoss ? ' enemy-battle-card--boss' : '';
  const idAttr = vm.side === 'hero' ? 'data-hero-id' : 'data-enemy-id';

  return `
    <div class="battle-actor-card ${sideClass}${activeClass}${bossClass}" ${idAttr}="${escapeHtml(vm.id)}">
      ${renderHitbox(vm)}
      ${renderStripActorBars({
        side: vm.side,
        healthLabel: vm.healthLabel,
        healthCurrent: vm.healthCurrent,
        healthPercent: vm.healthPercent,
        actionTimeRatio: vm.actionTimeRatio,
        actionTimeRemaining: vm.actionTimeRemaining,
        actionTimeTotal: vm.actionTimeTotal,
        attackSpeed: vm.attackSpeed,
      })}
      ${renderCombatSkillBar(vm.combatSkills)}
    </div>
  `;
}
