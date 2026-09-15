import { AchievementListEntryDto } from '../../application/dto/AchievementDto';
import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class AchievementsModalRenderer {
  render(
    container: HTMLElement,
    entries: readonly AchievementListEntryDto[],
    summary: { completedCount: number; totalCount: number },
  ): void {
    const iconUrl = getAssetUrl(ASSETS.ui.bookOpen);
    const completed = summary.completedCount;
    const total = summary.totalCount;

    container.innerHTML = `
      <p class="achievements-intro">
        Conquistas registram feitos da campanha. Progresso persiste mesmo após Novo Jogo.
      </p>
      <div class="achievements-summary" aria-label="Progresso de achievements">
        <img class="achievements-summary-icon" src="${iconUrl}" alt="" aria-hidden="true" />
        <span class="achievements-summary-count">${completed}/${total} desbloqueados</span>
      </div>
      <div class="achievements-list" role="list">
        ${entries.map((entry) => this.renderCard(entry, iconUrl)).join('')}
      </div>
    `;
  }

  private renderCard(entry: AchievementListEntryDto, iconUrl: string): string {
    const status = entry.completed ? 'unlocked' : 'locked';
    const statusLabel = entry.completed ? 'Desbloqueado' : 'Em progresso';
    const ratioPct = Math.round(entry.progressRatio * 100);

    return `
      <article class="achievement-card achievement-card--${status}" role="listitem" data-achievement-id="${escapeHtml(entry.id)}">
        <div class="achievement-card-icon-wrap" aria-hidden="true">
          <img class="achievement-card-icon" src="${iconUrl}" alt="" />
        </div>
        <div class="achievement-card-copy">
          <h4 class="achievement-card-title">${escapeHtml(entry.title)}</h4>
          <p class="achievement-card-desc">${escapeHtml(entry.description)}</p>
          <div
            class="achievement-card-progress"
            role="progressbar"
            aria-valuenow="${entry.currentProgress}"
            aria-valuemin="0"
            aria-valuemax="${entry.target}"
            aria-label="Progresso de ${escapeHtml(entry.title)}"
          >
            <div class="achievement-card-progress-track">
              <div class="achievement-card-progress-fill" style="width: ${ratioPct}%"></div>
            </div>
            <span class="achievement-card-progress-label">${entry.currentProgress}/${entry.target}</span>
          </div>
          <p class="achievement-card-status">${statusLabel}</p>
        </div>
      </article>
    `;
  }
}
