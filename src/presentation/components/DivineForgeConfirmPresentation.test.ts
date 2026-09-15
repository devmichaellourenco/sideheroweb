import { describe, expect, it } from 'vitest';
import { GearDto } from '../../application/dto/GameStateDto';
import {
  renderForgeFuseConfirmContent,
  renderForgeSalvageConfirmContent,
} from './DivineForgeConfirmPresentation';

function gear(id: string): GearDto {
  return {
    id,
    name: id,
    templateId: 'equip_axe_1',
    slot: 'weapon',
    rarity: 'common',
    attackBonus: 1,
    defenseBonus: 0,
    healthBonus: 0,
    requirements: { minLevel: 1 },
  } as GearDto;
}

describe('DivineForgeConfirmPresentation', () => {
  it('renderiza ritual 9→1 e grid compacta na fusão', () => {
    const gears = Array.from({ length: 9 }, (_, index) => gear(`item-${index}`));
    const html = renderForgeFuseConfirmContent(gears, 'Incomum');

    expect(html).toContain('forge-confirm-ritual');
    expect(html).toContain('9 itens');
    expect(html).toContain('1 Incomum');
    expect(html).toContain('forge-confirm-grid');
    expect(html).toContain('forge-confirm-gear--compact');
    expect(html).toContain('forge-confirm-warning');
    expect(html).not.toContain('destroy-confirm-gear');
  });

  it('renderiza card de recompensa no salvage', () => {
    const html = renderForgeSalvageConfirmContent(gear('axe-1'), 42);

    expect(html).toContain('forge-confirm-gear');
    expect(html).toContain('forge-confirm-reward-card');
    expect(html).toContain('+42 ouro');
    expect(html).toContain('forge-confirm-warning');
    expect(html).not.toContain('destroy-confirm-gear');
  });
});
