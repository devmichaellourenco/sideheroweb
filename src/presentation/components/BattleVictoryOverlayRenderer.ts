import { ASSETS, getAssetUrl, imgTag } from '../assets/AssetCatalog';
import { BattleVictoryPayload } from './BattleVictoryDetector';

export class BattleVictoryOverlayRenderer {
  render(container: HTMLElement, payload: BattleVictoryPayload): void {
    const isDefeat = payload.variant === 'defeat';
    const isWarning = payload.variant === 'boss-approach';
    const isMilestone = payload.milestoneVictory?.isMilestone === true;
    const isMajorMilestone = payload.milestoneVictory?.isMajorMilestone === true;
    const isTerminal = payload.variant === 'phase-clear' || payload.variant === 'defeat';
    const toneClass = isDefeat
      ? 'battle-victory-compact--defeat'
      : isWarning
        ? 'battle-victory-compact--warning'
        : isMilestone
          ? isMajorMilestone
            ? 'battle-victory-compact--milestone-major'
            : 'battle-victory-compact--milestone'
          : 'battle-victory-compact--clear';
    const headline = isDefeat
      ? 'DEFEAT'
      : isWarning
        ? 'WARNING'
        : isMilestone
          ? isMajorMilestone
            ? 'CONQUISTA'
            : 'MARCO'
          : 'CLEAR';
    const subtitle = this.buildSubtitle(payload);

    const detailsPanel = isTerminal ? this.buildDetailsPanel(payload, isDefeat) : '';
    const actions = isTerminal
      ? `<div class="battle-victory-compact-actions">
          <button type="button" class="battle-victory-continue-btn hidden" data-victory-continue>
            Continuar
          </button>
        </div>`
      : '';

    container.innerHTML = `
      <div class="battle-victory-compact ${toneClass}${isMilestone ? ' battle-victory-compact--celebration' : ''}" data-victory-compact>
        <div class="battle-victory-stage">
          <div class="battle-victory-compact-main" data-victory-headline>
            <span class="battle-victory-compact-label${isMilestone ? ' battle-victory-compact-label--milestone' : ''}">${headline}</span>
            <span class="battle-victory-compact-sub">${subtitle}</span>
          </div>
          ${detailsPanel}
        </div>
        ${actions}
      </div>
    `;
  }

  renderStart(container: HTMLElement): void {
    container.innerHTML = `
      <div class="battle-victory-compact battle-victory-compact--start" data-victory-compact>
        <div class="battle-victory-stage">
          <div class="battle-victory-compact-main" data-victory-headline>
            <span class="battle-victory-compact-label">START</span>
            <span class="battle-victory-compact-sub">Missão iniciada</span>
          </div>
        </div>
        <div class="battle-victory-compact-actions" aria-hidden="true"></div>
      </div>
    `;
  }

  private buildDetailsPanel(payload: BattleVictoryPayload, isDefeat: boolean): string {
    const rewardRows = this.buildRewardRows(payload);
    const levelUpRows = this.buildLevelUpRows(payload);
    const nextPhaseLine = payload.nextPhaseName
      ? `<p class="battle-victory-detail-line">Próxima fase: <strong>${payload.nextPhaseName}</strong></p>`
      : payload.seasonCompleted
        ? '<p class="battle-victory-detail-line">Jornada concluída!</p>'
        : '';
    const defeatHint =
      isDefeat && payload.defeatHint
        ? `<p class="battle-victory-defeat-hint">${payload.defeatHint}</p>`
        : isDefeat
          ? `<p class="battle-victory-defeat-hint">No Acampamento: ajuste formação, skills ou resistências e tente de novo.</p>`
          : '';

    return `
      <div class="battle-victory-details hidden" data-victory-details-panel>
        <p class="battle-victory-detail-line battle-victory-detail-line--title">${payload.clearedPhaseName}</p>
        ${defeatHint}
        <ul class="battle-victory-rewards" aria-label="Recompensas">
          ${rewardRows}
        </ul>
        ${levelUpRows}
        ${nextPhaseLine}
      </div>
    `;
  }

  private buildSubtitle(payload: BattleVictoryPayload): string {
    if (payload.variant === 'defeat') {
      return 'Party derrotada';
    }

    if (payload.variant === 'boss-approach') {
      return 'Boss à frente';
    }

    if (payload.variant === 'wave-clear') {
      return 'Wave concluída';
    }

    if (payload.variant === 'phase-clear') {
      if (payload.milestoneVictory?.isMilestone) {
        return payload.milestoneVictory.chapterTitle;
      }
      if (payload.seasonCompleted) {
        return 'Boss final';
      }
      return 'Fase concluída';
    }

    return 'Fase concluída';
  }

  private buildRewardRows(payload: BattleVictoryPayload): string {
    const rows: string[] = [];

    if (payload.goldGained > 0) {
      rows.push(this.rewardRow(ASSETS.ui.gold, `+${payload.goldGained} ouro`));
    }

    if (payload.xpGained > 0) {
      rows.push(this.rewardRow(ASSETS.ui.energy, `+${payload.xpGained} XP`));
    }

    if (payload.tierReached !== null) {
      rows.push(this.rewardRow(ASSETS.ui.stage, `Tier ${payload.tierReached} alcançado`));
    }

    if (payload.chestDropped) {
      const label =
        payload.chestCount === 1 ? 'Baú obtido!' : `${payload.chestCount} baús obtidos!`;
      rows.push(this.rewardRow(ASSETS.ui.chestOpen, label));
    }

    if (rows.length === 0) {
      rows.push(
        `<li class="battle-victory-reward battle-victory-reward--empty">${
          payload.variant === 'defeat'
            ? 'Sem recompensas nesta tentativa'
            : 'Sem recompensas extras'
        }</li>`,
      );
    }

    return rows.join('');
  }

  private buildLevelUpRows(payload: BattleVictoryPayload): string {
    if (payload.heroRewards.length === 0) return '';

    const items = payload.heroRewards
      .map(
        (hero) =>
          `<li class="battle-victory-levelup">${hero.name} subiu para Lv.${hero.newLevel}</li>`,
      )
      .join('');

    return `<ul class="battle-victory-levelups" aria-label="Level-ups">${items}</ul>`;
  }

  private rewardRow(iconPath: string, label: string): string {
    return `
      <li class="battle-victory-reward">
        ${imgTag(getAssetUrl(iconPath), '', 'battle-victory-reward-icon')}
        <span>${label}</span>
      </li>
    `;
  }
}
