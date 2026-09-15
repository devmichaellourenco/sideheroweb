import { HeroDto } from '../../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl, getHeroSprite, imgTag } from '../../assets/AssetCatalog';
import { getStatIconUrl } from '../../assets/StatIconCatalog';
import { renderHeroBars } from '../HeroBarsPresentation';
import { getHeroEvolutionLabel } from './HeroClassLinePresentation';
import { renderHeroImprovementStat } from './HeroImprovementPointsPresentation';

export function renderHeroDetailHeader(hero: HeroDto, ascensionName: string | null = null): string {
  const glowUrl = getAssetUrl(ASSETS.characters.glow);
  const titleLabel = getHeroEvolutionLabel(hero, ascensionName);

  return `
    <div class="hero-detail">
      <div class="hero-detail-portrait">
        <img class="hero-detail-glow" src="${glowUrl}" alt="" aria-hidden="true" />
        ${imgTag(getHeroSprite(hero), hero.name, 'hero-detail-sprite')}
      </div>
      <div class="hero-detail-info">
        <div class="hero-detail-title">
          <span class="hero-level">Lv.${hero.level}</span>
          <span class="hero-level-class-line">${titleLabel}</span>
        </div>
        <div class="hero-stats hero-detail-stats">
          <span class="hero-detail-stat" title="Ataque">${imgTag(getStatIconUrl('attack'), 'Ataque', 'stat-icon')} ${hero.attack}</span>
          <span class="hero-detail-stat" title="Defesa">${imgTag(getStatIconUrl('defense'), 'Defesa', 'stat-icon')} ${hero.defense}</span>
          <span class="hero-detail-stat" title="Vida">${imgTag(getStatIconUrl('health'), 'Vida', 'stat-icon')} ${hero.maxHealth}</span>
          ${renderHeroImprovementStat(hero)}
        </div>
        ${renderHeroBars(hero, { showHealth: false })}
      </div>
    </div>
  `;
}
