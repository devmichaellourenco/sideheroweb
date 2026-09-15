import { describe, expect, it } from 'vitest';
import { resolveActionTimeRatio } from './ActionTimerTypes';
import { ActionTimerService } from './ActionTimerService';
import { Enemy } from '../../entities/Enemy';
import { Hero } from '../../entities/Hero';
import { CombatProfileProvider } from '../../combat/CombatProfileProvider';
import { resolveActionIntervalSeconds } from '../../combat/CombatSpeedScaling';

describe('ActionTimerTypes', () => {
  it('retorna barra cheia quando o timer está pronto', () => {
    expect(resolveActionTimeRatio({ remaining: 0, total: 1 })).toBe(1);
    expect(resolveActionTimeRatio({ remaining: -0.2, total: 0.8 })).toBe(1);
  });

  it('calcula progresso proporcional durante a recarga', () => {
    expect(resolveActionTimeRatio({ remaining: 0.5, total: 1 })).toBeCloseTo(0.5);
    expect(resolveActionTimeRatio({ remaining: 0.8, total: 1 })).toBeCloseTo(0.2);
  });
});

describe('ActionTimerService', () => {
  const service = new ActionTimerService();
  const profiles = new CombatProfileProvider();

  it('agenda TTA individual = 1/ASPD do combatente', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Gal');
    const timers = service.createInitial([hero], []);
    const key = 'hero:h1';
    const attackSpeed = profiles.forHero(hero).attackSpeed;
    const expected = resolveActionIntervalSeconds(attackSpeed);

    const updated = service.scheduleAfterAction(
      timers,
      { side: 'hero', id: 'h1' },
      attackSpeed,
      1,
      null,
    );

    expect(updated[key]).toMatchObject({ remaining: expected, total: expected });
    expect(expected).toBeCloseTo(1 / attackSpeed, 5);
    expect(resolveActionTimeRatio(updated[key])).toBe(0);
  });

  it('TTA de archer é menor que knight (ASPD individual)', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Gal');
    const archer = Hero.createStarter('a1', 'archer', 'Lyn');
    const knightInterval = resolveActionIntervalSeconds(profiles.forHero(knight).attackSpeed);
    const archerInterval = resolveActionIntervalSeconds(profiles.forHero(archer).attackSpeed);

    expect(archerInterval).toBeLessThan(knightInterval);
  });

  it('TTA de inimigo segue ASPD próprio (não um piso global)', () => {
    const early = Enemy.forStage(1);
    const late = Enemy.forStage(40);
    const earlyInterval = resolveActionIntervalSeconds(profiles.forEnemy(early).attackSpeed);
    const lateInterval = resolveActionIntervalSeconds(profiles.forEnemy(late).attackSpeed);

    expect(lateInterval).toBeLessThan(earlyInterval);
  });

  it('não carrega dívida negativa — uma ação por TTA mesmo após tick grande', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Nix');
    const key = 'hero:h1';
    const overdue = { [key]: { remaining: -0.9, total: 1 } };

    const afterSkill = service.scheduleAfterAction(
      overdue,
      { side: 'hero', id: 'h1' },
      1,
      1,
      0.7,
    );

    expect(afterSkill[key]?.remaining).toBeGreaterThan(0);
    expect(service.listReadyActors(afterSkill, [hero], [])).toHaveLength(0);
  });

  it('migra timers legados numéricos via normalize no advance', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Gal');
    const legacy = { 'hero:h1': 0.4 } as unknown as ReturnType<ActionTimerService['createInitial']>;

    const advanced = service.advanceAll(legacy, 0.1);
    expect(advanced['hero:h1']?.total).toBe(0.4);
    expect(advanced['hero:h1']?.remaining).toBeCloseTo(0.3);
    // Sem entrada de timer, inimigo aparece "pronto" (remaining 0) — escopo só do herói migrado.
    expect(service.listReadyActors(advanced, [hero], [])).toHaveLength(0);
  });
});
