import { describe, expect, it } from 'vitest';
import { resolveEnemyInnateResists } from './EnemyInnateResists';

describe('EnemyInnateResists', () => {
  it('aplica resistências explícitas do roster', () => {
    const profile = resolveEnemyInnateResists('minor_fire_elemental');

    expect(profile.fire).toBeGreaterThanOrEqual(20);
    expect(profile.cold).toBeLessThan(0);
  });

  it('infere tema por id quando não há override', () => {
    const profile = resolveEnemyInnateResists('giant_spider');

    expect(profile.air).toBeGreaterThan(0);
  });

  it('boss recebe bônus de role', () => {
    const profile = resolveEnemyInnateResists('young_green_dragon');

    expect(profile.fire).toBeGreaterThan(10);
  });

  it('tier global adiciona resist flat em fases altas', () => {
    const low = resolveEnemyInnateResists('giant_spider', 5);
    const high = resolveEnemyInnateResists('giant_spider', 100);

    expect(high.air).toBeGreaterThan(low.air);
  });

  it('aplica bias de mapa quando mapId é informado', () => {
    const base = resolveEnemyInnateResists('giant_rat', 5);
    const onMap = resolveEnemyInnateResists('giant_rat', 5, 'gruftall');
    expect(onMap.fire).toBe(base.fire + 20);
    expect(onMap.cold).toBe(base.cold - 15);
  });
});
