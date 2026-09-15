import { GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { MAX_PARTY_SIZE } from '../../domain/party/PartyConstants';
import { getHeroSprite, imgTag } from '../assets/AssetCatalog';
import { renderHeroFormationTooltipContent } from './HeroBattlePresentation';
import { bindHeroTooltips } from './HeroTooltipBinder';

type FormationPanelState = Pick<GameStateDto, 'activeParty' | 'benchHeroes' | 'canEditParty'>;

function renderFormationSprite(hero: HeroDto): string {
  return `
    <div class="formation-slot-sprite" data-hero-tooltip tabindex="0">
      ${imgTag(getHeroSprite(hero), hero.name, 'formation-hero-image')}
      <span class="hero-tooltip-content hidden">${renderHeroFormationTooltipContent(hero)}</span>
    </div>
  `;
}

function renderFormationRemoveButton(
  hero: HeroDto,
  state: Pick<FormationPanelState, 'canEditParty' | 'activeParty'>,
): string {
  if (!state.canEditParty || state.activeParty.length <= 1) {
    return '<div class="formation-slot-toolbar formation-slot-toolbar--spacer" aria-hidden="true"></div>';
  }

  return `
    <div class="formation-slot-toolbar">
      <button
        type="button"
        class="party-btn party-btn-remove formation-remove-btn"
        data-party-remove="${hero.id}"
        title="Enviar para reserva"
        aria-label="Remover ${hero.name} da equipe"
      >−</button>
    </div>
  `;
}

function renderFormationSwapButton(leftIndex: number, canEditParty: boolean): string {
  if (!canEditParty) return '';

  return `
    <button
      type="button"
      class="party-btn formation-swap-btn"
      data-party-swap="${leftIndex}"
      title="Trocar ordem"
      aria-label="Trocar ordem dos heróis"
    >⇄</button>
  `;
}

function renderFormationActiveSlot(
  hero: HeroDto,
  index: number,
  state: Pick<FormationPanelState, 'canEditParty' | 'activeParty'>,
): string {
  const dragAttrs = state.canEditParty
    ? `draggable="true" data-drag-party-hero="${hero.id}" data-party-from-index="${index}"`
    : '';
  const dropAttrs = state.canEditParty ? `data-drop-party-slot="${index}"` : '';

  return `
    <article class="formation-slot" data-formation-hero="${hero.id}" ${dragAttrs} ${dropAttrs}>
      ${renderFormationRemoveButton(hero, state)}
      ${renderFormationSprite(hero)}
    </article>
  `;
}

function renderFormationEmptySlot(index: number, canEditParty: boolean): string {
  const dropAttrs = canEditParty ? `data-drop-party-slot="${index}"` : '';

  return `
    <article class="formation-slot formation-slot--empty" ${dropAttrs} aria-label="Slot ${index + 1} vazio">
      <div class="formation-slot-empty-placeholder" aria-hidden="true">
        <span class="formation-slot-empty-icon">+</span>
        <span class="formation-slot-empty-label">Slot ${index + 1}</span>
      </div>
    </article>
  `;
}

function renderFormationActiveRow(state: FormationPanelState): string {
  const parts: string[] = [];

  for (let index = 0; index < MAX_PARTY_SIZE; index += 1) {
    const hero = state.activeParty[index];
    if (hero) {
      parts.push(renderFormationActiveSlot(hero, index, state));
    } else {
      parts.push(renderFormationEmptySlot(index, state.canEditParty));
    }

    if (index < MAX_PARTY_SIZE - 1) {
      parts.push(`
        <div class="formation-swap-cell">
          ${renderFormationSwapButton(index, state.canEditParty)}
        </div>
      `);
    }
  }

  return parts.join('');
}

function renderFormationBenchSlot(
  hero: HeroDto,
  canEditParty: boolean,
  partyFull: boolean,
): string {
  const dragAttrs = canEditParty ? `draggable="true" data-drag-party-hero="${hero.id}"` : '';

  return `
    <article class="formation-bench-slot" data-bench-hero="${hero.id}" ${dragAttrs}>
      <div class="formation-bench-sprite" data-hero-tooltip tabindex="0">
        ${imgTag(getHeroSprite(hero), hero.name, 'formation-hero-image')}
        <span class="hero-tooltip-content hidden">${renderHeroFormationTooltipContent(hero)}</span>
      </div>
      ${
        canEditParty
          ? `<button type="button" class="party-btn party-btn-add formation-bench-add" data-party-add="${hero.id}" ${
              partyFull ? 'disabled' : ''
            } title="Adicionar à equipe">+</button>`
          : ''
      }
    </article>
  `;
}

function renderPartyLockNotice(canEditParty: boolean): string {
  if (canEditParty) return '';

  return `<p class="party-lock-notice" title="Formação só pode ser editada no acampamento, entre missões.">🔒 Formação bloqueada durante a missão</p>`;
}

export function renderFormationPanel(state: FormationPanelState): string {
  const partyFull = state.activeParty.length >= MAX_PARTY_SIZE;
  const activeHtml = renderFormationActiveRow(state);
  const benchHtml =
    state.benchHeroes.length > 0
      ? state.benchHeroes
          .map((hero) => renderFormationBenchSlot(hero, state.canEditParty, partyFull))
          .join('')
      : '<p class="empty-state formation-empty">Reserva vazia.</p>';

  return `
    <div class="formation-panel">
      ${renderPartyLockNotice(state.canEditParty)}
      <section class="formation-section">
        <h3 class="party-section-title">Equipe <span class="party-count">${state.activeParty.length}/${MAX_PARTY_SIZE}</span></h3>
        <div class="formation-active-row">${activeHtml}</div>
      </section>
      <section class="formation-section formation-bench-section">
        <h3 class="party-section-title">Reserva</h3>
        <div class="formation-bench-row" data-drop-party-bench>${benchHtml}</div>
      </section>
    </div>
  `;
}

export function bindFormationPanelInteractions(container: HTMLElement): void {
  bindHeroTooltips(container);
}
