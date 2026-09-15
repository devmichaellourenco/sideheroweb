import { describe, expect, it } from 'vitest';
import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import {
  evaluateForgeSelection,
  listForgeEligibleGear,
  renderCreateTabPanel,
  renderForgeCapacityBar,
  renderForgeTabs,
  renderSalvageTabPanel,
} from './DivineForgePresentation';

function gear(id: string, rarity: GearDto['rarity'] = 'common'): GearDto {
  return {
    id,
    name: id,
    templateId: 'equip_axe_1',
    slot: 'weapon',
    rarity,
    attackBonus: 1,
    defenseBonus: 0,
    healthBonus: 0,
    requirements: { minLevel: 1 },
  } as GearDto;
}

describe('listForgeEligibleGear', () => {
  it('inclui itens do inventário e do baú', () => {
    const state = {
      inventory: [gear('inv-1'), gear('inv-2')],
      stash: [gear('stash-1')],
    } as GameStateDto;

    const items = listForgeEligibleGear(state);

    expect(items).toHaveLength(3);
    expect(items.map((entry) => entry.id)).toEqual(['inv-1', 'inv-2', 'stash-1']);
  });
});

describe('renderForgeTabs', () => {
  it('marca aba ativa e usa ícones temáticos', () => {
    const html = renderForgeTabs('create');

    expect(html).toContain('forge-tab--active');
    expect(html).toContain('data-forge-tab="create"');
    expect(html).toContain('forge-tab-icon');
    expect(html).toContain('Fundir');
    expect(html).toContain('Destruir');
    expect(html).not.toContain('primary-btn');
  });
});

describe('renderForgeCapacityBar', () => {
  it('renderiza chips de inventário e baú', () => {
    const html = renderForgeCapacityBar(12, 8, 24, 4, 36);

    expect(html).toContain('forge-capacity-bar');
    expect(html).toContain('forge-capacity-chip');
    expect(html).toContain('Itens <strong>12</strong>');
    expect(html).toContain('Inventário <strong>8/24</strong>');
    expect(html).toContain('Baú <strong>4/36</strong>');
  });
});

describe('renderCreateTabPanel', () => {
  it('usa dock game-like com botão de fusão desabilitado até seleção válida', () => {
    const pending = evaluateForgeSelection(new Set(), []);
    const ready = evaluateForgeSelection(
      new Set(Array.from({ length: 9 }, (_, index) => `g-${index}`)),
      Array.from({ length: 9 }, (_, index) => gear(`g-${index}`)),
    );

    const pendingHtml = renderCreateTabPanel(pending);
    const readyHtml = renderCreateTabPanel(ready);

    expect(pendingHtml).toContain('forge-dock');
    expect(pendingHtml).toContain('forge-dock-badge');
    expect(pendingHtml).toContain('forge-game-btn--fuse');
    expect(pendingHtml).toContain('disabled');
    expect(pendingHtml).not.toContain('data-forge-clear-selection');
    expect(readyHtml).not.toContain('disabled');
    expect(readyHtml).toContain('forge-dock-line--highlight');
    expect(readyHtml).toContain('data-forge-clear-selection');
    expect(readyHtml).toContain('forge-clear-btn');
    expect(readyHtml).toContain('title="Limpar seleção"');
    expect(readyHtml).toContain('ui/clear.png');
    expect(readyHtml).not.toMatch(/>\s*Limpar seleção\s*</);
  });

  it('mostra Limpar seleção quando há itens parcialmente selecionados', () => {
    const partial = evaluateForgeSelection(
      new Set(['g-0', 'g-1', 'g-2']),
      [gear('g-0'), gear('g-1'), gear('g-2')],
    );

    const html = renderCreateTabPanel(partial);

    expect(html).toContain('data-forge-clear-selection');
    expect(html).toContain('forge-clear-btn');
    expect(html).toContain('title="Limpar seleção"');
    expect(html).toContain('3/9');
  });
});

describe('renderSalvageTabPanel', () => {
  it('usa dock com botão salvage e preview de ouro', () => {
    const emptyHtml = renderSalvageTabPanel(null, 1);
    const selectedHtml = renderSalvageTabPanel(gear('axe-1', 'rare'), 3);

    expect(emptyHtml).toContain('forge-game-btn--salvage');
    expect(emptyHtml).toContain('disabled');
    expect(emptyHtml).not.toContain('data-forge-clear-selection');
    expect(selectedHtml).toContain('forge-dock-status--ready');
    expect(selectedHtml).not.toContain('disabled');
    expect(selectedHtml).toContain('forge-dock-line--highlight');
    expect(selectedHtml).toContain('data-forge-clear-selection');
    expect(selectedHtml).toContain('forge-clear-btn');
    expect(selectedHtml).toContain('title="Limpar seleção"');
    expect(selectedHtml).not.toMatch(/>\s*Limpar seleção\s*</);
  });
});
