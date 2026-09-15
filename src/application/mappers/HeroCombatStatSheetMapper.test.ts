import { describe, expect, it } from 'vitest';
import { Hero } from '../../domain/entities/Hero';
import { mapHeroCombatStatSheet } from './HeroCombatStatSheetMapper';

describe('HeroCombatStatSheetMapper', () => {
  it('monta seções ofensiva, defesa e resistências', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const sheet = mapHeroCombatStatSheet(hero);

    expect(sheet.map((section) => section.id)).toEqual(['offense', 'defense', 'resistances']);

    const dps = sheet[0].lines.find((line) => line.id === 'dps');
    expect(dps?.value).toMatch(/\d+\.\d/);
    expect(dps?.tooltipLines.some((line) => line.includes('Ataque:'))).toBe(true);

    const attack = sheet[0].lines.find((line) => line.id === 'ataque');
    expect(attack?.tooltipLines[0]).toContain('Base da classe');

    const dodge = sheet[1].lines.find((line) => line.id === 'dodge');
    expect(dodge?.tooltipLines.some((line) => line.includes('DEX'))).toBe(true);
  });

  it('inclui Saúde de Titã no detalhe de vida máxima do Galneon', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const sheet = mapHeroCombatStatSheet(hero);
    const maxHealth = sheet[1].lines.find((line) => line.id === 'max-health');

    expect(maxHealth?.value).toBe(String(hero.maxHealth));
    expect(maxHealth?.tooltipLines.some((line) => line.includes('Saúde de Titã'))).toBe(true);
    expect(maxHealth?.tooltipLines.some((line) => line.includes('Subtotal (antes de %)'))).toBe(
      true,
    );
    expect(maxHealth?.tooltipLines.some((line) => line.startsWith('Bônus % total:'))).toBe(true);
    expect(maxHealth?.tooltipLines.at(-1)).toBe(`Total: ${Math.round(hero.maxHealth)}`);
  });
});
