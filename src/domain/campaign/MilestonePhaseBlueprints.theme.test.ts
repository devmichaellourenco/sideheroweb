import { describe, expect, it } from 'vitest';
import { buildPhaseId } from './CampaignIds';
import { getMilestoneBlueprint } from './MilestonePhaseBlueprints';
import { resolveEnemyInnateResists } from '../enemies/EnemyInnateResists';
import { MAP_RESIST_BIAS_MAX, MAP_RESIST_BIAS_MIN } from './MapCombatIdentityCatalog';

describe('Milestone X-50 temática', () => {
  it('1-50 usa trash goblin/beast', () => {
    const waves = getMilestoneBlueprint(buildPhaseId(1, 50))!.waves;
    const types = waves.flatMap((wave) => wave.slots.map((slot) => slot.enemyType));
    expect(types).toEqual(expect.arrayContaining(['goblin_raider', 'gray_wolf', 'saci']));
  });

  it('3-50 favorece undead/poison', () => {
    const waves = getMilestoneBlueprint(buildPhaseId(3, 50))!.waves;
    const types = waves.flatMap((wave) => wave.slots.map((slot) => slot.enemyType));
    expect(types).toEqual(
      expect.arrayContaining(['skeleton_warrior', 'rot_zombie', 'renegade_necromancer']),
    );
  });

  it('4-50 é majorMilestone e termina com o Duque', () => {
    const bp = getMilestoneBlueprint(buildPhaseId(4, 50))!;
    expect(bp.majorMilestone).toBe(true);
    expect(bp.waves.at(-1)?.slots.some((slot) => slot.enemyType === 'morthaven_duke')).toBe(true);
  });

  it('bosses de capítulo mantêm resists no soft band após bias de mapa', () => {
    const gonodor = resolveEnemyInnateResists('gonodor', 50, 'gruftall');
    expect(gonodor.fire).toBeLessThanOrEqual(MAP_RESIST_BIAS_MAX + 30);
    expect(gonodor.cold).toBeGreaterThanOrEqual(MAP_RESIST_BIAS_MIN - 10);

    const duke = resolveEnemyInnateResists('morthaven_duke', 200, 'morthaven');
    expect(duke.cold).toBeGreaterThan(0);
    expect(duke.lightning).toBeLessThan(0);
  });
});
