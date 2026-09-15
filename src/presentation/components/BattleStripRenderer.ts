import { GameStateDto } from '../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl, getEnemySpriteUrl, getHeroSprite, imgTag } from '../assets/AssetCatalog';
import { bindBarTooltips } from './BarTooltipBinder';
import { actNumberFromPhaseId } from '../assets/CampaignSceneCatalog';
import { applyBattleScene } from './BattleScenePresentation';
import { freezeActionTimeVisualOnCard } from './BattleActorHealthPresentation';
import { patchBattleStripInPlace, syncBattleStripCrowdedLayout } from './BattleStripPatcher';
import { shouldAnimateBattleStripTimers } from './SkillCooldownDisplayAnimator';
import { freezeCombatSkillCooldownVisuals } from './CombatSkillIntentPresentation';
import {
  battleStripDomMatchesStructure,
  buildBattleStripStructureKey,
  hasBattleStripPhaseChanged,
  resolveBattleStripPhaseId,
} from './BattleStripStructure';
import { renderEnemyBattleCard } from './EnemyBattlePresentation';
import { bindEnemyTooltips } from './EnemyTooltipBinder';
import { renderHeroBattleSprite } from './HeroBattlePresentation';
import { bindHeroTooltips } from './HeroTooltipBinder';

export class BattleStripRenderer {
  private structureKey: string | null = null;
  private sceneKey: string | null = null;
  private lastPhaseId: string | null = null;

  constructor(
    private readonly heroesContainer: HTMLElement,
    private readonly enemyContainer: HTMLElement,
    private readonly battleField: HTMLElement,
    private readonly battleStrip: HTMLElement,
    private readonly stripBg: HTMLElement,
    private readonly stripFloor: HTMLElement,
  ) {}

  render(state: GameStateDto): void {
    const freezeTimers = !shouldAnimateBattleStripTimers(state);
    this.battleField.classList.toggle('battle-field--timers-frozen', freezeTimers);

    const phaseId = resolveBattleStripPhaseId(state);
    const actNumber = actNumberFromPhaseId(phaseId);
    const nextSceneKey = `${state.mapId}:${actNumber ?? 0}`;
    if (nextSceneKey !== this.sceneKey) {
      applyBattleScene(this.stripBg, state.mapId, this.stripFloor, actNumber);
      this.sceneKey = nextSceneKey;
    }

    syncBattleStripCrowdedLayout(
      this.battleField,
      state.activeParty.length,
      state.enemies.length,
    );

    const forceResetActionTime = hasBattleStripPhaseChanged(this.lastPhaseId, phaseId);

    const nextStructureKey = buildBattleStripStructureKey(state);
    if (
      nextStructureKey === this.structureKey &&
      battleStripDomMatchesStructure(state, this.heroesContainer, this.enemyContainer)
    ) {
      patchBattleStripInPlace(state, this.heroesContainer, this.enemyContainer, {
        forceResetActionTime,
      });
      this.lastPhaseId = phaseId;
      return;
    }

    this.structureKey = nextStructureKey;
    this.renderFull(state);
    this.lastPhaseId = phaseId;
  }

  private renderFull(state: GameStateDto): void {
    const glowUrl = getAssetUrl(ASSETS.characters.glow);
    const activeTurn = state.activeTurn;

    this.heroesContainer.innerHTML = state.activeParty
      .map((hero) => {
        const glowHtml = `<img class="hero-glow" src="${glowUrl}" alt="" aria-hidden="true" />`;
        const spriteHtml = imgTag(getHeroSprite(hero), hero.name, 'hero-image');
        const isActive = activeTurn?.side === 'hero' && activeTurn.id === hero.id;
        return renderHeroBattleSprite(hero, glowHtml, spriteHtml, { isActiveTurn: isActive });
      })
      .join('');

    bindBarTooltips(this.heroesContainer);
    bindHeroTooltips(this.heroesContainer);

    if (state.enemies.length === 0) {
      this.enemyContainer.innerHTML = '<span class="empty-state">...</span>';
      return;
    }

    this.enemyContainer.innerHTML = `
      <div class="enemies-row">
        ${state.enemies
          .map((enemy) => {
            const spriteHtml = imgTag(
              getEnemySpriteUrl(enemy.enemyType, enemy.name, enemy.id),
              enemy.name,
              'enemy-image',
            );
            const isActive = activeTurn?.side === 'enemy' && activeTurn.id === enemy.id;
            return renderEnemyBattleCard(enemy, state.difficultyTier, spriteHtml, {
              isActiveTurn: isActive,
            });
          })
          .join('')}
      </div>
    `;

    bindBarTooltips(this.enemyContainer);
    bindEnemyTooltips(this.enemyContainer);
  }

  /** Congela timers visuais no frame atual (pausa imediata, sem reaplicar DTO). */
  freezeTimersVisual(): void {
    this.battleField.classList.add('battle-field--timers-frozen');
    for (const card of this.battleField.querySelectorAll<HTMLElement>('.battle-actor-card')) {
      freezeActionTimeVisualOnCard(card);
      freezeCombatSkillCooldownVisuals(card);
    }
  }
}
