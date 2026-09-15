import { describe, expect, it } from 'vitest';
import { AscensionOptionDto } from '../../application/dto/AscensionOptionDto';
import { HeroDto } from '../../application/dto/GameStateDto';
import { renderAscendClassConfirmContent } from './AscendClassConfirmPresentation';

function minimalHero(): HeroDto {
  return {
    id: 'h1',
    name: 'Elara',
    heroClass: 'priest',
    emoji: '✨',
  } as HeroDto;
}

function ascensionOption(): AscensionOptionDto {
  return {
    id: 'priest_sacred_cleriga',
    name: 'Clériga Sagrada',
    description: 'Caminho da luz.',
    pathLabel: 'Caminho Sagrado',
    pointsGranted: 2,
    canAscend: true,
    requirements: [],
  };
}

describe('AscendClassConfirmPresentation', () => {
  it('renderiza preview, pontos e aviso de escolha permanente', () => {
    const html = renderAscendClassConfirmContent(minimalHero(), ascensionOption(), false);

    expect(html).toContain('ascend-confirm-preview');
    expect(html).toContain('Clériga Sagrada');
    expect(html).toContain('+2 pts de aprimoramento');
    expect(html).toContain('permanente');
    expect(html).toContain('seguir este caminho');
  });
});
