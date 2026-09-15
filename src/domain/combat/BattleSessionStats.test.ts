import { describe, expect, it } from 'vitest';
import {
  accumulateBattleStatsStrikes,
  emptyBattleSessionStats,
  normalizeBattleSessionStats,
} from './BattleSessionStats';

describe('BattleSessionStats', () => {
  it('acumula totais, herói, skill e elementos', () => {
    const next = accumulateBattleStatsStrikes(emptyBattleSessionStats(), [
      {
        actorSide: 'hero',
        actorId: 'h1',
        skillId: 'basic_attack',
        isBasicAttack: true,
        events: [
          { target: 'enemy', targetId: 'e1', kind: 'damage', amount: 40, damageElement: 'physical' },
          { target: 'enemy', targetId: 'e1', kind: 'crit', amount: 20, damageElement: 'fire' },
        ],
        mitigatedDamage: 0,
      },
      {
        actorSide: 'hero',
        actorId: 'h1',
        skillId: 'fireball',
        isBasicAttack: false,
        events: [{ target: 'hero', targetId: 'h2', kind: 'heal', amount: 15 }],
        mitigatedDamage: 0,
      },
      {
        actorSide: 'enemy',
        actorId: 'e1',
        skillId: 'claw',
        isBasicAttack: false,
        events: [
          { target: 'hero', targetId: 'h1', kind: 'damage', amount: 8, damageElement: 'physical' },
        ],
        mitigatedDamage: 12,
        primaryDamageElement: 'physical',
      },
    ]);

    expect(next.damageDealt).toBe(60);
    expect(next.healingDone).toBe(15);
    expect(next.damageTaken).toBe(8);
    expect(next.damageMitigated).toBe(12);
    expect(next.critCount).toBe(1);
    expect(next.damageByElement.physical).toBe(40);
    expect(next.damageByElement.fire).toBe(20);
    expect(next.damageTakenByElement.physical).toBe(8);
    expect(next.damageMitigatedByElement.physical).toBe(12);
    expect(next.heroes.h1.damageDealt).toBe(60);
    expect(next.heroes.h1.critCount).toBe(1);
    expect(next.heroes.h1.basicAttackUses).toBe(1);
    expect(next.heroes.h1.skillUses).toBe(1);
    expect(next.heroes.h1.healingDone).toBe(15);
    expect(next.heroes.h1.damageTaken).toBe(8);
    expect(next.heroes.h1.damageMitigated).toBe(12);
    expect(next.heroes.h1.damageTakenByElement.physical).toBe(8);
    expect(next.heroes.h1.damageMitigatedByElement.physical).toBe(12);
    expect(next.skills['h1::fireball']).toMatchObject({
      uses: 1,
      healingDone: 15,
      damageDealt: 0,
    });
  });

  it('atribui sofrido e mitigado por elemento elemental', () => {
    const next = accumulateBattleStatsStrikes(emptyBattleSessionStats(), [
      {
        actorSide: 'enemy',
        actorId: 'e1',
        skillId: 'firebolt',
        isBasicAttack: false,
        events: [
          { target: 'hero', targetId: 'h1', kind: 'damage', amount: 10, damageElement: 'fire' },
        ],
        mitigatedDamage: 5,
        primaryDamageElement: 'fire',
      },
    ]);

    expect(next.damageTakenByElement.fire).toBe(10);
    expect(next.damageMitigatedByElement.fire).toBe(5);
    expect(next.heroes.h1.damageTakenByElement.fire).toBe(10);
    expect(next.heroes.h1.damageMitigatedByElement.fire).toBe(5);
  });

  it('normaliza saves legados sem campos novos', () => {
    expect(normalizeBattleSessionStats({ damageDealt: 10 })).toMatchObject({
      damageDealt: 10,
      healingDone: 0,
      damageMitigated: 0,
      damageTakenByElement: {
        physical: 0,
        fire: 0,
        cold: 0,
        lightning: 0,
        air: 0,
      },
      damageMitigatedByElement: {
        physical: 0,
        fire: 0,
        cold: 0,
        lightning: 0,
        air: 0,
      },
      heroes: {},
      skills: {},
    });
  });
});
