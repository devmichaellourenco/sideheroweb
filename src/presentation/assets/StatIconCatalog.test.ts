import { describe, expect, it } from 'vitest';
import {
  STAT_LINE_ICON_BY_ID,
  getStatIconPath,
  getStatIconUrl,
  statIconImg,
} from './StatIconCatalog';

describe('StatIconCatalog', () => {
  it('expõe path relativo do ícone', () => {
    expect(getStatIconPath('attack')).toBe('ui/stats/attack.png');
  });

  it('resolve URL de ícone para cada atributo base', () => {
    expect(getStatIconUrl('str')).toContain('ui/stats/str.png');
    expect(getStatIconUrl('dex')).toContain('ui/stats/dex.png');
    expect(getStatIconUrl('int')).toContain('ui/stats/int.png');
  });

  it('cobre todas as linhas da ficha de combate do herói', () => {
    const statSheetLineIds = [
      'ataque',
      'dps',
      'attack-speed',
      'cast-speed',
      'cooldown-reduction',
      'time-to-action',
      'crit-chance',
      'crit-damage',
      'defesa',
      'max-health',
      'dodge',
      'block',
      'damage-reduction',
      'resist-fire',
      'resist-cold',
      'resist-lightning',
      'resist-air',
    ];

    for (const lineId of statSheetLineIds) {
      const iconKey = STAT_LINE_ICON_BY_ID[lineId];
      expect(iconKey, `linha sem ícone: ${lineId}`).toBeTruthy();
      expect(getStatIconUrl(iconKey)).toContain('ui/stats/');
    }
  });

  it('resolve ícone do elemento ar em ui/stats/air.png', () => {
    expect(getStatIconUrl('air')).toContain('ui/stats/air.png');
    expect(STAT_LINE_ICON_BY_ID['resist-air']).toBe('air');
  });

  it('gera img decorativa com classe customizada', () => {
    const html = statIconImg('critChance', 'hero-stat-icon');
    expect(html).toContain('class="hero-stat-icon"');
    expect(html).toContain('ui/stats/crit-chance.png');
    expect(html).toContain('aria-hidden="true"');
  });

  it('retorna string vazia sem chave', () => {
    expect(statIconImg(undefined)).toBe('');
  });
});
