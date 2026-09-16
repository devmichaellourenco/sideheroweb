import { describe, expect, it } from 'vitest';
import { buildEnemyCombatLabPayload } from './enemyCombatCatalog';

describe('enemyCombatCatalog dex', () => {
  it('expõe índice, papel e sprite no snapshot do lab', () => {
    const payload = buildEnemyCombatLabPayload();
    expect(payload.enemies.length).toBeGreaterThan(10);
    const rat = payload.enemies[0];
    expect(rat?.name).toBe('Rato Gigante');
    expect(rat?.dexNo).toBe(1);
    expect(rat?.roleLabel).toBe('Comum');
    expect(rat?.spriteUrl).toContain('giant_rat');
    const bite = rat?.monsterSkills.find((skill) => skill.skillId === 'wild_bite');
    expect(bite?.name).toMatch(/Mordida/i);
    expect(bite?.iconUrl).toContain('/panel/assets/');
    expect(payload.skillFields.find((field) => field.key === 'powerPerRank')?.label).toBe(
      'Poder / rank',
    );
  });
});
