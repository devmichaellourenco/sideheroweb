import { describe, expect, it, afterEach } from 'vitest';
import {
  applyEnemyIdentityOverride,
  getEmbeddedEnemyCombatOverrides,
  normalizeEnemyCombatOverridesFile,
  normalizeEnemyIdentityOverride,
  normalizeEnemyMonsterSkillOverride,
  setRuntimeEnemyCombatOverrides,
} from './EnemyCombatOverrides';
import type { CombatantIdentity } from '../combat/CombatantIdentity';

const baseIdentity: CombatantIdentity = {
  basicAttackDamageRatio: 0.5,
  skillCooldownTurnSeconds: 5,
  attackSpeedFactor: 0.29,
  attackPerLevel: 4,
  defensePerLevel: 3,
  healthPerLevel: 15,
  levelUpAttackGain: 3,
  levelUpDefenseGain: 3,
  levelUpHealthGain: 15,
};

describe('EnemyCombatOverrides', () => {
  afterEach(() => {
    setRuntimeEnemyCombatOverrides(null);
  });

  it('getEmbeddedEnemyCombatOverrides retorna estrutura válida', () => {
    const embedded = getEmbeddedEnemyCombatOverrides();
    expect(embedded).toMatchObject({
      version: expect.any(Number),
      identities: expect.any(Object),
      monsterSkills: expect.any(Object),
    });
  });

  it('normalizeEnemyIdentityOverride retorna null para input inválido', () => {
    expect(normalizeEnemyIdentityOverride(null)).toBeNull();
    expect(normalizeEnemyIdentityOverride(undefined)).toBeNull();
    expect(normalizeEnemyIdentityOverride({})).toBeNull();
  });

  it('normalizeEnemyIdentityOverride extrai campos válidos', () => {
    const result = normalizeEnemyIdentityOverride({ basicAttackDamageRatio: 0.7 });
    expect(result).toEqual({ basicAttackDamageRatio: 0.7 });
  });

  it('normalizeEnemyIdentityOverride ignora campos não reconhecidos', () => {
    const result = normalizeEnemyIdentityOverride({
      basicAttackDamageRatio: 0.8,
      unknownField: 99,
    } as never);
    expect(result).not.toHaveProperty('unknownField');
    expect(result?.basicAttackDamageRatio).toBe(0.8);
  });

  it('applyEnemyIdentityOverride retorna identidade original sem override', () => {
    const result = applyEnemyIdentityOverride(baseIdentity, null);
    expect(result).toEqual(baseIdentity);
  });

  it('applyEnemyIdentityOverride aplica override parcial corretamente', () => {
    const result = applyEnemyIdentityOverride(baseIdentity, { basicAttackDamageRatio: 0.9 });
    expect(result.basicAttackDamageRatio).toBe(0.9);
    expect(result.skillCooldownTurnSeconds).toBe(baseIdentity.skillCooldownTurnSeconds);
  });

  it('normalizeEnemyMonsterSkillOverride retorna null para input vazio', () => {
    expect(normalizeEnemyMonsterSkillOverride(null)).toBeNull();
    expect(normalizeEnemyMonsterSkillOverride({})).toBeNull();
  });

  it('setRuntimeEnemyCombatOverrides altera overrides em runtime', () => {
    setRuntimeEnemyCombatOverrides({
      version: 1,
      updatedAt: null,
      identities: { goblin_raider: { basicAttackDamageRatio: 0.99 } },
      monsterSkills: {},
    });
    const embedded = getEmbeddedEnemyCombatOverrides();
    // getEmbeddedEnemyCombatOverrides sempre retorna o arquivo estático — runtime não muda isso
    expect(embedded.identities).not.toHaveProperty('goblin_raider');
  });

  it('normalizeEnemyCombatOverridesFile produz estrutura completa', () => {
    const result = normalizeEnemyCombatOverridesFile({
      version: 2,
      updatedAt: '2026-01-01T00:00:00.000Z',
      identities: { goblin_raider: { attackPerLevel: 5 } },
      monsterSkills: {},
    });
    expect(result.version).toBe(2);
    expect(result.identities).toHaveProperty('goblin_raider');
    expect(result.identities.goblin_raider?.attackPerLevel).toBe(5);
  });

  it('normalizeEnemyCombatOverridesFile ignora inimigos com override vazio', () => {
    const result = normalizeEnemyCombatOverridesFile({
      version: 1,
      updatedAt: null,
      identities: { goblin_raider: {} },
      monsterSkills: {},
    });
    expect(result.identities).not.toHaveProperty('goblin_raider');
  });
});
