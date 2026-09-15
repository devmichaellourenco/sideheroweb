import { GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl, getHeroSprite, imgTag } from '../assets/AssetCatalog';
import { bindHeroTooltips } from './HeroTooltipBinder';

function rosterHeroes(state: GameStateDto): HeroDto[] {
  const seen = new Set<string>();
  const ordered: HeroDto[] = [];

  for (const hero of state.activeParty) {
    if (seen.has(hero.id)) continue;
    seen.add(hero.id);
    ordered.push(hero);
  }

  for (const hero of state.benchHeroes) {
    if (seen.has(hero.id)) continue;
    seen.add(hero.id);
    ordered.push(hero);
  }

  for (const hero of state.heroes) {
    if (seen.has(hero.id)) continue;
    ordered.push(hero);
  }

  return ordered;
}

function isHeroInActiveParty(state: GameStateDto, heroId: string): boolean {
  return state.activePartyIds.includes(heroId);
}

function renderHeroRosterCard(hero: HeroDto, state: GameStateDto): string {
  const attackIcon = getAssetUrl(ASSETS.ui.attack);
  const defenseIcon = getAssetUrl(ASSETS.ui.defense);
  const healthIcon = getAssetUrl(ASSETS.ui.health);
  const inParty = isHeroInActiveParty(state, hero.id);
  const upgradeBadge = hero.hasUnspentPoints
    ? '<span class="inventory-upgrade-badge hero-roster-upgrade">!</span>'
    : '';

  return `
    <article class="hero-roster-card hero-card" data-hero-card="${hero.id}">
      <button type="button" class="hero-card-main" data-hero-open="${hero.id}">
        <div class="hero-card-header">
          <div class="hero-card-title">
            ${imgTag(getHeroSprite(hero), hero.name, 'hero-card-icon')}
            <span>${hero.name}</span>
            ${upgradeBadge}
          </div>
          <div class="hero-card-meta">
            ${inParty ? '<span class="hero-roster-badge hero-roster-badge--active">Equipe</span>' : ''}
            <span class="hero-level">Lv.${hero.level}</span>
          </div>
        </div>
        <div class="hero-inline-stats">
          ${imgTag(attackIcon, 'Ataque', 'stat-icon')} ${hero.attack}
          ${imgTag(defenseIcon, 'Defesa', 'stat-icon')} ${hero.defense}
          ${imgTag(healthIcon, 'Vida', 'stat-icon')} ${hero.health}/${hero.maxHealth}
        </div>
      </button>
    </article>
  `;
}

export function renderHeroesPanel(state: GameStateDto): string {
  const heroes = rosterHeroes(state);
  const cards =
    heroes.length > 0
      ? heroes.map((hero) => renderHeroRosterCard(hero, state)).join('')
      : '<p class="empty-state">Nenhum herói disponível.</p>';

  return `
    <div class="heroes-panel-view">
      <div class="heroes-roster party-active-list">${cards}</div>
    </div>
  `;
}

export function bindHeroesPanelInteractions(container: HTMLElement): void {
  bindHeroTooltips(container);
}
