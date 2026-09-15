import { FeatureFlagsDto } from '../../../application/dto/FeatureFlagsDto';
import { HeroDto } from '../../../application/dto/GameStateDto';
import { SkillNodeDto } from '../../../application/dto/SkillNodeDto';
import { renderSkillCard } from '../SkillCardPresentation';

export function renderHeroSkillsTab(
  hero: HeroDto,
  nodes: SkillNodeDto[],
  ascensionSkillNodes: SkillNodeDto[] = [],
  featureFlags: Pick<FeatureFlagsDto, 'improvementReset'> = { improvementReset: 0 },
): string {
  if (nodes.length === 0 && ascensionSkillNodes.length === 0) {
    return '<p class="empty-state">Carregando árvore de skills...</p>';
  }

  const canRefund = featureFlags.improvementReset >= 1;

  const classCards = nodes
    .map((node) =>
      renderSkillCard(node, {
        allocateAttr: 'data-skill-allocate',
        canAllocate: node.canAllocateRank,
        refundAttr: 'data-skill-refund',
        canRefund: canRefund && node.currentRank > 0,
        spendPointLabel: 'Aprimoramento',
      }),
    )
    .join('');

  const evolutionSection =
    hero.ascensionId && ascensionSkillNodes.length > 0
      ? renderEvolutionSkillSection(ascensionSkillNodes, canRefund)
      : '';

  return `
    <section class="hero-skills-tab">
      <div class="hero-skills-tab-scroll game-scroll">
        ${classCards ? `<div class="skill-list">${classCards}</div>` : ''}
        ${evolutionSection}
      </div>
    </section>
  `;
}

function renderEvolutionSkillSection(nodes: SkillNodeDto[], canRefund: boolean): string {
  const cards = nodes
    .map((node) =>
      renderSkillCard(node, {
        allocateAttr: 'data-ascension-allocate',
        canAllocate: node.canAllocateRank,
        refundAttr: 'data-ascension-refund',
        canRefund: canRefund && node.currentRank > 0,
        spendPointLabel: 'Aprimoramento',
      }),
    )
    .join('');

  return `
    <h4 class="hero-skills-subtitle hero-skills-subtitle--evolution">Skills de evolução</h4>
    <div class="skill-list skill-list--evolution">${cards}</div>
  `;
}
