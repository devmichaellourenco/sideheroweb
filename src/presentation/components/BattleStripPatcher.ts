import { EnemyDto, GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { shouldAnimateBattleStripTimers } from './SkillCooldownDisplayAnimator';
import { renderCombatStatusEffects } from './CombatStatusEffectPresentation';
import { patchCombatSkillBar } from './CombatSkillIntentPresentation';
import { formatEnemyHealthLabel } from './EnemyBattlePresentation';
import { formatHealthLabel } from './HeroBarsPresentation';
import { clampHealthPercent, freezeActionTimeVisualOnCard, formatStripHealthCurrent, patchActionTimeBar } from './BattleActorHealthPresentation';

function updateHealthBar(
  card: HTMLElement,
  selector: string,
  healthLabel: string,
  healthCurrent: string,
  healthPercent: number,
): void {
  const bar = card.querySelector(selector);
  if (!bar) return;

  bar.setAttribute('data-bar-label', healthLabel);
  bar.setAttribute('aria-label', `Vida ${healthLabel}`);

  const fill = bar.querySelector('.health-fill') as HTMLElement | null;
  if (fill) {
    fill.style.width = `${healthPercent}%`;
  }

  const label = bar.querySelector('.strip-health-label');
  if (label) {
    label.textContent = healthCurrent;
  }
}

function replaceOrRemoveStatusBadges(card: HTMLElement, effectsHtml: string): void {
  const hitbox = card.querySelector('.battle-actor-hitbox');
  if (!hitbox) return;

  const existing = hitbox.querySelector('.combat-status-badges');
  if (!effectsHtml) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.outerHTML = effectsHtml;
    return;
  }

  hitbox.insertAdjacentHTML('beforeend', effectsHtml);
}

function patchActorCard(
  card: HTMLElement,
  options: {
    isActiveTurn: boolean;
    activeTurnClass: string;
    healthLabel: string;
    healthCurrent: string;
    healthPercent: number;
    actionTimeRatio: number;
    actionTimeRemaining: number;
    actionTimeTotal: number;
    attackSpeed: number;
    statusEffectsHtml: string;
    combatSkills: HeroDto['combatSkills'] | EnemyDto['combatSkills'];
    freezeTimers: boolean;
    forceResetActionTime: boolean;
  },
): void {
  card.classList.toggle(options.activeTurnClass, options.isActiveTurn);

  updateHealthBar(
    card,
    '.health-bar',
    options.healthLabel,
    options.healthCurrent,
    options.healthPercent,
  );
  replaceOrRemoveStatusBadges(card, options.statusEffectsHtml);

  if (options.freezeTimers && !options.forceResetActionTime) {
    freezeActionTimeVisualOnCard(card);
    patchCombatSkillBar(card, options.combatSkills, true);
    return;
  }

  const applyActionTimeWidth = !options.freezeTimers || options.forceResetActionTime;
  patchActionTimeBar(
    card,
    options.actionTimeRatio,
    options.actionTimeRemaining,
    options.actionTimeTotal,
    options.freezeTimers,
    applyActionTimeWidth,
    options.attackSpeed,
  );
  patchCombatSkillBar(card, options.combatSkills, options.freezeTimers);
}

export function patchBattleStripInPlace(
  state: GameStateDto,
  heroesContainer: HTMLElement,
  enemyContainer: HTMLElement,
  options: { forceResetActionTime?: boolean } = {},
): void {
  const freezeTimers = !shouldAnimateBattleStripTimers(state);
  const forceResetActionTime = options.forceResetActionTime ?? false;
  const activeTurn = state.activeTurn;

  for (const hero of state.activeParty) {
    const card = heroesContainer.querySelector<HTMLElement>(`[data-hero-id="${hero.id}"]`);
    if (!card) continue;

    patchActorCard(card, {
      isActiveTurn: activeTurn?.side === 'hero' && activeTurn.id === hero.id,
      activeTurnClass: 'hero-battle-card--active-turn',
      healthLabel: formatHealthLabel(hero),
      healthCurrent: formatStripHealthCurrent(hero.health),
      healthPercent: clampHealthPercent(hero.health, hero.maxHealth),
      actionTimeRatio: hero.actionTimeRatio,
      actionTimeRemaining: hero.actionTimeRemaining,
      actionTimeTotal: hero.actionTimeTotal,
      attackSpeed: hero.attackSpeed,
      statusEffectsHtml: renderCombatStatusEffects(hero.statusEffects),
      combatSkills: hero.combatSkills,
      freezeTimers,
      forceResetActionTime,
    });
  }

  if (state.enemies.length === 0) return;

  for (const enemy of state.enemies) {
    const card = enemyContainer.querySelector<HTMLElement>(`[data-enemy-id="${enemy.id}"]`);
    if (!card) continue;

    patchActorCard(card, {
      isActiveTurn: activeTurn?.side === 'enemy' && activeTurn.id === enemy.id,
      activeTurnClass: 'enemy-battle-card--active-turn',
      healthLabel: formatEnemyHealthLabel(enemy),
      healthCurrent: formatStripHealthCurrent(enemy.health),
      healthPercent: clampHealthPercent(enemy.health, enemy.maxHealth),
      actionTimeRatio: enemy.actionTimeRatio,
      actionTimeRemaining: enemy.actionTimeRemaining,
      actionTimeTotal: enemy.actionTimeTotal,
      attackSpeed: enemy.attackSpeed,
      statusEffectsHtml: renderCombatStatusEffects(enemy.statusEffects),
      combatSkills: enemy.combatSkills,
      freezeTimers,
      forceResetActionTime,
    });
  }
}

export function shouldUseCrowdedBattleStrip(_heroCount: number, _enemyCount: number): boolean {
  // Layout compacto desativado: strip mantém tamanho grande com qualquer quantidade de combatentes.
  // Para reativar:
  // return heroCount + enemyCount >= 5 || (heroCount >= 3 && enemyCount >= 2);
  return false;
}

export function syncBattleStripCrowdedLayout(
  battleField: HTMLElement,
  heroCount: number,
  enemyCount: number,
): void {
  battleField.classList.toggle(
    'battle-field--crowded',
    shouldUseCrowdedBattleStrip(heroCount, enemyCount),
  );
}
