import { ActSceneDto } from '../../application/dto/CampaignDto';
import { getAssetUrl } from '../assets/AssetCatalog';
import { escapeHtml } from './CampaignMapPresentation';

const CAMPAIGN_FINALE_SCENE_ID = 'morthaven-season-epilogue';
/** Arte dedicada full-bleed (proporção do painel 355×895). */
const FULL_BLEED_ACT_SCENE_IDS = new Set([
  'stendra-act-1',
  'stendra-act-2',
  'stendra-act-3',
  'stendra-act-4',
  'stendra-act-5',
  'gruftall-act-1',
  'valdris-act-1',
  'morthaven-act-1',
]);

const FINALE_CREDITS = [
  { label: 'Stendra', detail: 'Planícies e o Guardião Saci' },
  { label: 'Gruftall', detail: 'Ruínas e a Centelha de Gonodor' },
  { label: 'Valdris', detail: 'Terras espectrais e o arco sombrio' },
  { label: 'Morthaven', detail: 'O castelo e a queda do Duque' },
] as const;

export function resolveActSceneImageUrl(scene: ActSceneDto): string | null {
  return scene.imageAssetPath ? getAssetUrl(scene.imageAssetPath) : null;
}

export function renderActSceneCard(scene: ActSceneDto): string {
  if (!scene.unlocked) {
    return `
      <article class="campaign-act-scene campaign-act-scene--locked" data-campaign-act-scene="${escapeHtml(scene.id)}" aria-hidden="true">
        <div class="campaign-act-scene-locked-copy">
          <span class="campaign-act-scene-eyebrow">Cena do ato</span>
          <p>Desbloqueie este ato para revelar a narrativa.</p>
        </div>
      </article>
    `;
  }

  const imageUrl = resolveActSceneImageUrl(scene);
  const imageMarkup = imageUrl
    ? `<img class="campaign-act-scene-image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />`
    : '<div class="campaign-act-scene-image campaign-act-scene-image--placeholder" aria-hidden="true"></div>';

  const viewedBadge = scene.viewed
    ? '<span class="campaign-act-scene-badge">Vista</span>'
    : '<span class="campaign-act-scene-badge campaign-act-scene-badge--new">Nova</span>';

  return `
    <article class="campaign-act-scene" data-campaign-act-scene="${escapeHtml(scene.id)}">
      <div class="campaign-act-scene-media">${imageMarkup}</div>
      <div class="campaign-act-scene-copy">
        <div class="campaign-act-scene-heading">
          <span class="campaign-act-scene-eyebrow">Cena · Ato ${scene.actNumber}</span>
          ${viewedBadge}
        </div>
        <h4 class="campaign-act-scene-title">${escapeHtml(scene.title)}</h4>
        <p class="campaign-act-scene-recap">${escapeHtml(scene.recap)}</p>
        <button type="button" class="campaign-act-scene-read-btn" data-act-scene-read="${escapeHtml(scene.id)}">
          Ver cena
        </button>
      </div>
    </article>
  `;
}

export function renderActSceneOverlay(scene: ActSceneDto): string {
  if (scene.id === CAMPAIGN_FINALE_SCENE_ID) {
    return renderFinaleCreditsOverlay(scene);
  }

  if (FULL_BLEED_ACT_SCENE_IDS.has(scene.id)) {
    return renderFullBleedActSceneOverlay(scene);
  }

  const imageUrl = resolveActSceneImageUrl(scene);
  const imageMarkup = imageUrl
    ? `<img class="act-scene-overlay-image" src="${escapeHtml(imageUrl)}" alt="" />`
    : '';

  return `
    <div class="act-scene-overlay-card" data-act-scene-overlay="${escapeHtml(scene.id)}">
      <div class="act-scene-overlay-media">${imageMarkup}</div>
      <div class="act-scene-overlay-copy">
        <span class="act-scene-overlay-eyebrow">Ato ${scene.actNumber}</span>
        <h2 class="act-scene-overlay-title">${escapeHtml(scene.title)}</h2>
        <section class="act-scene-overlay-section">
          <h3>O que passou</h3>
          <p>${escapeHtml(scene.recap)}</p>
        </section>
        <section class="act-scene-overlay-section">
          <h3>Pela frente</h3>
          <p>${escapeHtml(scene.preview)}</p>
        </section>
        <button type="button" class="act-scene-overlay-dismiss" data-act-scene-dismiss>
          CONTINUAR
        </button>
      </div>
    </div>
  `;
}

function renderFullBleedActSceneOverlay(scene: ActSceneDto): string {
  const imageUrl = resolveActSceneImageUrl(scene);
  const imageMarkup = imageUrl
    ? `<img class="act-scene-overlay-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(scene.title)}" />`
    : '';

  return `
    <div
      class="act-scene-overlay-card act-scene-overlay-card--full-bleed"
      data-act-scene-overlay="${escapeHtml(scene.id)}"
    >
      <div class="act-scene-overlay-media">${imageMarkup}</div>
      <button type="button" class="act-scene-overlay-dismiss" data-act-scene-dismiss>
        CONTINUAR
      </button>
    </div>
  `;
}

function renderFinaleCreditsOverlay(scene: ActSceneDto): string {
  const imageUrl = resolveActSceneImageUrl(scene);
  const imageMarkup = imageUrl
    ? `<img class="act-scene-overlay-image" src="${escapeHtml(imageUrl)}" alt="" />`
    : '';

  const creditRows = FINALE_CREDITS.map(
    (entry) => `
      <li class="act-scene-credit-row">
        <strong>${escapeHtml(entry.label)}</strong>
        <span>${escapeHtml(entry.detail)}</span>
      </li>
    `,
  ).join('');

  return `
    <div class="act-scene-overlay-card act-scene-overlay-card--finale" data-act-scene-overlay="${escapeHtml(scene.id)}">
      <div class="act-scene-overlay-media">${imageMarkup}</div>
      <div class="act-scene-overlay-copy">
        <span class="act-scene-overlay-eyebrow">Créditos da campanha</span>
        <h2 class="act-scene-overlay-title">${escapeHtml(scene.title)}</h2>
        <section class="act-scene-overlay-section">
          <h3>A jornada</h3>
          <p>${escapeHtml(scene.recap)}</p>
        </section>
        <ul class="act-scene-credits" aria-label="Regiões conquistadas">
          ${creditRows}
        </ul>
        <section class="act-scene-overlay-section">
          <h3>Depois do fim</h3>
          <p>${escapeHtml(scene.preview)}</p>
        </section>
        <button type="button" class="act-scene-overlay-dismiss" data-act-scene-dismiss>
          ENCERRAR
        </button>
      </div>
    </div>
  `;
}
