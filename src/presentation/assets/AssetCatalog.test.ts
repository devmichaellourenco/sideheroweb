import { describe, expect, it } from 'vitest';
import { getAssetUrl, getEnemySpriteUrl } from './AssetCatalog';

describe('AssetCatalog — sprites de inimigo', () => {
  it('usa sprite dedicado por id para Goblin Saqueador', () => {
    const url = getEnemySpriteUrl('goblin_raider', 'Goblin Saqueador Lv.3');
    expect(url).toContain('characters/goblin_raider.png');
    expect(url).not.toContain('goblin_boss');
  });

  it('usa sprite dedicado por id para Kobold Escavador', () => {
    const url = getEnemySpriteUrl('kobold_digger', 'Kobold Escavador Lv.3');
    expect(url).toContain('characters/kobold_digger.png');
  });

  it('usa sprite dedicado por id para Goblin Arqueiro', () => {
    const url = getEnemySpriteUrl('goblin_archer', 'Goblin Arqueiro Lv.3', 'enemy-a');
    expect(url).toContain('characters/goblin_archer.png');
    expect(url).not.toContain('goblin_boss');
  });

  it('usa sprite dedicado por id para Ogro das Colinas', () => {
    const url = getEnemySpriteUrl('hill_ogre', 'Ogro das Colinas');
    expect(url).toContain('characters/hill_ogre.png');
    expect(url).not.toContain('goblin_boss');
  });

  it('usa sprite dedicado por id para Rato Gigante', () => {
    const url = getEnemySpriteUrl('giant_rat', 'Rato Gigante Lv.2');
    expect(url).toContain('characters/giant_rat.png');
  });

  it('usa sprite dedicado por id para Xamã Goblin', () => {
    const url = getEnemySpriteUrl('goblin_shaman', 'Xamã Goblin');
    expect(url).toContain('characters/goblin_shaman.png');
  });

  it('usa sprite dedicado por id para Saci', () => {
    const url = getEnemySpriteUrl('saci', 'Saci');
    expect(url).toContain('characters/saci.png');
  });

  it('usa sprite dedicado por id para Goblin Bombardeiro', () => {
    const url = getEnemySpriteUrl('goblin_bomber', 'Goblin Bombardeiro Lv.5');
    expect(url).toContain('characters/goblin_bomber.png');
  });

  it('usa sprite dedicado por id para Gonodor', () => {
    const url = getEnemySpriteUrl('gonodor', 'Gonodor');
    expect(url).toContain('characters/gonodor.png');
  });

  it('usa sprite dedicado por id para Vorax', () => {
    const url = getEnemySpriteUrl('vorax', 'Vorax');
    expect(url).toContain('characters/vorax.png');
  });

  it('usa sprite dedicado por id para Zumbi Putrefato', () => {
    const url = getEnemySpriteUrl('rot_zombie', 'Zumbi Putrefato');
    expect(url).toContain('characters/rot_zombie.png');
  });

  it('usa sprite dedicado por id para Arquilich', () => {
    const url = getEnemySpriteUrl('archlich', 'Arquilich');
    expect(url).toContain('characters/archlich.png');
  });

  it('usa sprite dedicado por id para Capitão dos Bandidos', () => {
    const url = getEnemySpriteUrl('bandit_captain', 'Capitão dos Bandidos');
    expect(url).toContain('characters/bandit_captain.png');
  });
});

describe('AssetCatalog — URLs', () => {
  it('usa path relativo de assets', () => {
    expect(getAssetUrl('characters/goblin.png')).toBe('./assets/characters/goblin.png');
  });
});
