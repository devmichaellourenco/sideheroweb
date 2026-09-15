import { AscensionOptionDto } from '../../../application/dto/AscensionOptionDto';
import { HeroDto } from '../../../application/dto/GameStateDto';
import { getHeroSprite, imgTag } from '../../assets/AssetCatalog';

export type AscensionPathTheme =
  | 'military'
  | 'martial'
  | 'arcane'
  | 'innate'
  | 'sacred'
  | 'life'
  | 'default';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolveAscensionPathTheme(
  ascensionId: string,
  pathLabel?: string,
): AscensionPathTheme {
  const label = pathLabel?.toLowerCase() ?? '';
  const id = ascensionId.toLowerCase();

  if (id.includes('military') || label.includes('militar')) return 'military';
  if (id.includes('martial') || label.includes('marcial')) return 'martial';
  if (id.includes('arcane') || label.includes('arcano')) return 'arcane';
  if (id.includes('innate') || label.includes('inato')) return 'innate';
  if (id.includes('sacred') || label.includes('sagrado')) return 'sacred';
  if (id.includes('life') || label.includes('vida')) return 'life';
  return 'default';
}

export function renderAscensionMomentBanner(isUpgrade: boolean, heroName: string): string {
  if (isUpgrade) {
    return `
      <div class="ascension-moment-header ascension-moment-header--upgrade">
        <h3
          class="ascension-moment-header__title"
          data-ascension-moment-tooltip
          tabindex="0"
          aria-label="Próxima Classe — passe o mouse para detalhes"
        >
          Próxima Classe
        </h3>
        <span class="ascension-moment-tooltip-content hidden">
          <strong class="ascension-moment-tooltip-title">Evolução iminente</strong>
          <span class="ascension-moment-tooltip-line">
            ${escapeHtml(heroName)} está pronto para avançar — nova forma, skills exclusivas e mais Aprimoramento.
          </span>
        </span>
      </div>
    `;
  }

  return `
    <div class="ascension-moment-header ascension-moment-header--fork">
      <h3
        class="ascension-moment-header__title"
        data-ascension-moment-tooltip
        tabindex="0"
        aria-label="Escolha seu destino — passe o mouse para detalhes"
      >
        Escolha seu destino
        <span class="ascension-moment-header__hint" aria-hidden="true">ⓘ</span>
      </h3>
      <span class="ascension-moment-tooltip-content hidden">
        <strong class="ascension-moment-tooltip-title">Momento decisivo</strong>
        <span class="ascension-moment-tooltip-line">
          Uma evolução permanente transforma o visual de ${escapeHtml(heroName)} e abre skills exclusivas de caminho.
        </span>
        <span class="ascension-moment-tooltip-line ascension-moment-tooltip-section">Benefícios</span>
        <span class="ascension-moment-tooltip-line">· Novo visual</span>
        <span class="ascension-moment-tooltip-line">· Skills de caminho</span>
        <span class="ascension-moment-tooltip-line">· Pontos de aprimoramento</span>
      </span>
    </div>
  `;
}

function renderAscensionRequirements(requirements: AscensionOptionDto['requirements']): string {
  if (requirements.length === 0) {
    return '<p class="ascension-path-tooltip-reqs-empty">Sem requisitos adicionais</p>';
  }

  const items = requirements
    .map((req) => {
      const stateClass = req.met ? 'ascension-req--met' : 'ascension-req--unmet';
      const icon = req.met ? '✓' : '○';
      return `
        <li class="ascension-req ${stateClass}">
          <span class="ascension-req__icon" aria-hidden="true">${icon}</span>
          <span class="ascension-req__label">${escapeHtml(req.label)}</span>
        </li>
      `;
    })
    .join('');

  return `<ul class="ascension-path-tooltip-reqs">${items}</ul>`;
}

function renderAscensionPathTooltipContent(
  option: AscensionOptionDto,
  isUpgrade: boolean,
): string {
  const ctaLabel = isUpgrade ? 'Evoluir agora' : 'Seguir este caminho';
  const statusLabel = option.canAscend
    ? 'Pronto para ascender'
    : 'Complete os requisitos para desbloquear';

  return `
    <span class="ascension-path-tooltip-content hidden">
      <strong class="ascension-path-tooltip-title">Requisitos</strong>
      ${renderAscensionRequirements(option.requirements)}
      <span class="ascension-path-tooltip-status">${escapeHtml(statusLabel)}</span>
      ${
        option.canAscend && !isUpgrade
          ? `<span class="ascension-path-tooltip-cta">${escapeHtml(ctaLabel)}</span>`
          : ''
      }
    </span>
  `;
}

export function renderAscensionPathCard(
  hero: HeroDto,
  option: AscensionOptionDto,
  isUpgrade: boolean,
): string {
  const theme = resolveAscensionPathTheme(option.id, option.pathLabel);
  const stateClass = option.canAscend ? 'ascension-path-card--ready' : 'ascension-path-card--locked';
  const selectableClass = option.canAscend ? ' ascension-path-card--selectable' : '';
  const pathLabel = option.pathLabel
    ? `<span class="ascension-path-card__ribbon">${escapeHtml(option.pathLabel)}</span>`
    : '';
  const selectAttrs = option.canAscend
    ? `data-ascension-select="${escapeHtml(option.id)}" role="button"`
    : '';

  return `
    <article
      class="ascension-path-card ascension-path-card--${theme} ${stateClass}${selectableClass}"
      data-ascension-theme="${theme}"
      data-ascension-path-tooltip
      tabindex="0"
      ${selectAttrs}
      aria-label="${escapeHtml(option.name)} — +${option.pointsGranted} pts de aprimoramento"
    >
      <div class="ascension-path-card__glow" aria-hidden="true"></div>
      <div class="ascension-path-card__frame">
        ${pathLabel}
        <div class="ascension-path-card__showcase">
          <div class="ascension-path-card__spark" aria-hidden="true"></div>
          ${imgTag(
            getHeroSprite({ id: hero.id, heroClass: hero.heroClass, ascensionId: option.id }),
            option.name,
            'ascension-path-card__sprite',
          )}
        </div>
        <div class="ascension-path-card__body">
          <header class="ascension-path-card__header">
            <h4 class="ascension-path-card__title">${escapeHtml(option.name)}</h4>
            <span class="ascension-path-card__points">+${option.pointsGranted} Aprim.</span>
          </header>
          <p class="ascension-path-card__desc">${escapeHtml(option.description)}</p>
          ${renderAscensionPathTooltipContent(option, isUpgrade)}
        </div>
      </div>
    </article>
  `;
}

export function renderAscensionPathGrid(
  hero: HeroDto,
  options: AscensionOptionDto[],
  isUpgrade: boolean,
): string {
  const cards = options.map((option) => renderAscensionPathCard(hero, option, isUpgrade)).join('');

  return `
    <div class="ascension-path-grid${options.length > 1 ? ' ascension-path-grid--fork' : ''}">
      ${cards}
    </div>
  `;
}
