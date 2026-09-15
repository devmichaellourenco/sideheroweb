import { describe, expect, it } from 'vitest';
import { CombatSkillDefinition } from '../../progression/combat/CombatSkillDefinition';
import { SkillCooldownTracker } from './SkillCooldownTracker';

const TEST_SKILL: CombatSkillDefinition = {
  skillId: 'test_bolt',
  kind: 'damage',
  targetPool: 'enemies',
  targetScope: 'single',
  targetPriority: 'lowest_hp_percent',
  usePriority: 80,
  initialCooldown: 0,
  cooldownTurns: 0,
  cooldownSeconds: 10,
  actionRecoverySeconds: 0.7,
  cooldownSecondsPerRank: 1.5,
  maxCooldownReduction: 0.45,
  minCooldownReduction: -0.25,
  basePower: 20,
  powerPerRank: 1,
  attributeFactor: 1,
};

describe('SkillCooldownTracker', () => {
  it('aplica redução de recarga como percentual do tempo base', () => {
    const key = 'hero:h1';
    const tracker = SkillCooldownTracker.fromMap({ [key]: {} });
    const withCdr = tracker.onSkillUsed(key, 'test_bolt', [TEST_SKILL], 0.3);

    expect(withCdr.getRemaining(key, 'test_bolt')).toBe(7);
  });

  it('mantém cooldown integral sem redução de recarga', () => {
    const key = 'hero:h1';
    const tracker = SkillCooldownTracker.fromMap({ [key]: {} });
    const applied = tracker.onSkillUsed(key, 'test_bolt', [TEST_SKILL], 0);

    expect(applied.getRemaining(key, 'test_bolt')).toBe(10);
  });

  it('reduz recarga conforme level da skill', () => {
    const key = 'hero:h1';
    const tracker = SkillCooldownTracker.fromMap({ [key]: {} });
    const ranked = tracker.onSkillUsed(key, 'test_bolt', [TEST_SKILL], 0, { rank: 3 });

    expect(ranked.getRemaining(key, 'test_bolt')).toBe(7);
  });
});
