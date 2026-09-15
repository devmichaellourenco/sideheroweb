import { AscensionOptionDto } from '../../../application/dto/AscensionOptionDto';
import { HeroDto } from '../../../application/dto/GameStateDto';
import {
  renderAscensionMomentBanner,
  renderAscensionPathGrid,
} from './HeroClassAscensionPresentation';

export interface HeroClassTabData {
  hero: HeroDto;
  options: AscensionOptionDto[];
  ascensionName: string | null;
}

export function renderHeroClassTab(data: HeroClassTabData): string {
  const { hero, options } = data;

  const choiceSection =
    options.length > 0 ? renderEvolutionChoiceView(hero, options, Boolean(hero.ascensionId)) : '';

  return `
    <section class="hero-class-tab">
      ${choiceSection || '<p class="empty-state">Nenhum caminho de classe disponível.</p>'}
    </section>
  `;
}

function renderEvolutionChoiceView(
  hero: HeroDto,
  options: AscensionOptionDto[],
  isUpgrade: boolean,
): string {
  return `
    ${renderAscensionMomentBanner(isUpgrade, hero.name)}
    ${renderAscensionPathGrid(hero, options, isUpgrade)}
  `;
}
