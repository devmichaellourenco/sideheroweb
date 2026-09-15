import { MetaNodeDto } from '../../application/dto/MetaDto';
import { GameStateDto } from '../../application/dto/GameStateDto';

export type MetaLegacyHandlers = {
  onPurchase: (upgradeId: string) => void;
};

const STATUS_LABELS: Record<MetaNodeDto['status'], string> = {
  locked: 'Bloqueado',
  ready: 'Selos insuficientes',
  available: 'Disponível',
  owned: 'Ativo',
};

export class MetaLegacyModalRenderer {
  render(
    container: HTMLElement,
    state: GameStateDto,
    nodes: MetaNodeDto[],
    handlers: MetaLegacyHandlers,
  ): void {
    const meta = state.meta;
    const bonusLines: string[] = [];

    if (meta) {
      if (meta.startGoldBonus > 0) bonusLines.push(`+${meta.startGoldBonus} ouro inicial`);
      if (meta.goldBonusPercent > 0) bonusLines.push(`+${meta.goldBonusPercent}% ouro`);
      if (meta.xpBonusPercent > 0) bonusLines.push(`+${meta.xpBonusPercent}% XP`);
    }

    const bonusMarkup =
      bonusLines.length > 0
        ? `<p class="meta-legacy-bonuses">Bônus ativos: ${bonusLines.join(' · ')}</p>`
        : '';

    container.innerHTML = `
      <p class="meta-legacy-intro">
        Selos persistem entre temporadas. Gaste-os em bônus permanentes para acelerar a próxima run.
      </p>
      <div class="meta-legacy-balance">
        <span class="meta-legacy-sigils" aria-label="Selos">${meta?.sigils ?? 0} ✦</span>
        <span class="meta-legacy-stats">
          ${meta?.seasonsCompleted ?? 0} temporada${(meta?.seasonsCompleted ?? 0) === 1 ? '' : 's'} concluída${(meta?.seasonsCompleted ?? 0) === 1 ? '' : 's'}
        </span>
      </div>
      ${bonusMarkup}
      <div class="meta-legacy-list">
        ${nodes
          .map((node) => {
            const canBuy = node.status === 'available';
            const owned = node.status === 'owned';
            return `
              <article class="meta-legacy-card meta-legacy-card--${node.status}">
                <div class="meta-legacy-card-copy">
                  <h4 class="meta-legacy-card-title">${node.name}</h4>
                  <p class="meta-legacy-card-desc">${node.description}</p>
                  <p class="meta-legacy-card-status">${STATUS_LABELS[node.status]}</p>
                </div>
                <div class="meta-legacy-card-action">
                  ${
                    owned
                      ? '<span class="meta-legacy-owned">✓</span>'
                      : `<button
                          type="button"
                          class="meta-legacy-buy"
                          data-meta-buy="${node.id}"
                          ${canBuy ? '' : 'disabled'}
                        >${node.cost} ✦</button>`
                  }
                </div>
              </article>
            `;
          })
          .join('')}
      </div>
    `;

    container.querySelectorAll('[data-meta-buy]').forEach((element) => {
      element.addEventListener('click', () => {
        const upgradeId = element.getAttribute('data-meta-buy');
        if (!upgradeId) return;
        handlers.onPurchase(upgradeId);
      });
    });
  }
}
