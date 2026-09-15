import { describe, expect, it } from 'vitest';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { Stats } from '../../value-objects/Stats';
import { getClassCombatBaseline } from '../../combat/ClassCombatBaselines';
import { resolveHeroAttributeAttackSpeed } from '../../combat/CombatSpeedScaling';
import { buildEnemyCombatSheet } from '../../enemies/EnemyProgressionCatalog';
import { deriveCombatMaxHealth } from '../../combat/CombatantDerivedStats';
import { resolveEnemySpawnMaxHealth } from '../../combat/EnemyCombatBalance';
import { getHeroCombatIdentity } from '../../combat/HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../../enemies/EnemyCombatIdentityCatalog';
import { PHYSICAL_DAMAGE_SKILL_MIN_ATK_RATIO } from './SkillDamageBalance';
import { getHeroCombatSkill } from './HeroCombatSkillCatalog';
import { listEnemyCombatSkillsByType } from './EnemyCombatSkillCatalog';
import { SkillPowerCalculator } from './SkillPowerCalculator';

function enemyFromSheet(
  enemyType: string,
  level: number,
  role: 'trash' | 'elite' | 'boss' = 'trash',
): Enemy {
  const sheet = buildEnemyCombatSheet({ enemyType, level, role });
  const maxHealth = resolveEnemySpawnMaxHealth(
    deriveCombatMaxHealth({
      baseMaxHealth: sheet.baseMaxHealth,
      level: sheet.level,
      attributes: sheet.attributes,
      attackPerLevel: 4,
      defensePerLevel: 3,
      healthPerLevel: 15,
    }),
  );

  return Enemy.restore({
    id: `${enemyType}-l${level}`,
    name: enemyType,
    enemyType: enemyType as Enemy['enemyType'],
    stage: level,
    level: sheet.level,
    attributes: sheet.attributes,
    baseAttack: sheet.baseAttack,
    baseDefense: sheet.baseDefense,
    baseMaxHealth: sheet.baseMaxHealth,
    skillRanks: sheet.skillRanks,
    passiveIds: sheet.passiveIds,
    physicalMeleeAspd: sheet.physicalMeleeAspd,
    stats: Stats.fromBase(sheet.baseAttack, sheet.baseDefense, maxHealth),
    goldReward: 1,
    xpReward: 1,
    role,
  });
}

describe('SkillPowerCalculator', () => {
  const calculator = new SkillPowerCalculator();

  it('calcula poder de magia com scaling de INT', () => {
    let sorcerer = Hero.createStarter('s1', 'sorcerer', 'Nix');
    sorcerer = Hero.restore({
      ...sorcerer.toProps(),
      skillRanks: { fireball: 1 },
    });

    const profile = getHeroCombatSkill('fireball')!;
    const power = calculator.calculateForHero(profile, sorcerer);

    expect(power).toBeGreaterThan(profile.basePower);
    expect(power).toBeGreaterThan(sorcerer.attack);
  });

  it('skills físicas ficam acima do auto-ataque no nível inicial', () => {
    let knight = Hero.createStarter('k1', 'knight', 'Galneon');
    knight = Hero.restore({
      ...knight.toProps(),
      skillRanks: { power_attack: 1 },
    });

    const profile = getHeroCombatSkill('power_attack')!;
    const power = calculator.calculateForHero(profile, knight);
    const basic = calculator.calculateForHero(getHeroCombatSkill('basic_attack')!, knight);

    expect(power).toBeGreaterThan(basic);
    expect(basic).toBe(
      Math.max(
        1,
        Math.floor(knight.attack * getHeroCombatIdentity('knight').basicAttackDamageRatio),
      ),
    );
  });

  it('inimigo usa a mesma fórmula de skill/básico do herói (BAL-013)', () => {
    const goblin = enemyFromSheet('goblin_raider', 2);
    const dragon = enemyFromSheet('young_green_dragon', 5);
    const rat = enemyFromSheet('giant_rat', 1);

    const goblinStab = listEnemyCombatSkillsByType('goblin_raider').find(
      (skill) => skill.skillId === 'goblin_stab',
    )!;
    const dragonBreath = listEnemyCombatSkillsByType('young_green_dragon').find(
      (skill) => skill.skillId === 'dragon_breath',
    )!;
    const wildBite = listEnemyCombatSkillsByType('giant_rat').find(
      (skill) => skill.skillId === 'wild_bite',
    )!;
    const basic = listEnemyCombatSkillsByType('goblin_raider').find(
      (skill) => skill.skillId === 'basic_attack',
    )!;

    expect(calculator.calculateForEnemy(basic, goblin)).toBe(
      Math.max(
        1,
        Math.floor(goblin.attack * getEnemyCombatIdentity(goblin.enemyType).basicAttackDamageRatio),
      ),
    );
    expect(calculator.calculateForEnemy(goblinStab, goblin)).toBe(
      Math.max(1, Math.floor(goblin.attack * PHYSICAL_DAMAGE_SKILL_MIN_ATK_RATIO)),
    );
    expect(calculator.calculateForEnemy(wildBite, rat)).toBe(
      Math.max(1, Math.floor(rat.attack * PHYSICAL_DAMAGE_SKILL_MIN_ATK_RATIO)),
    );
    expect(calculator.calculateForEnemy(dragonBreath, dragon)).toBeGreaterThanOrEqual(
      Math.floor(dragon.attack * getEnemyCombatIdentity(dragon.enemyType).basicAttackDamageRatio),
    );
    expect(calculator.calculateForEnemy(goblinStab, goblin)).toBeGreaterThan(
      calculator.calculateForEnemy(basic, goblin),
    );
  });
});

describe('resolveHeroAttributeAttackSpeed', () => {
  it('começa mais lento que o baseline de classe puro', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const baseline = getClassCombatBaseline('knight').attackSpeed;

    expect(resolveHeroAttributeAttackSpeed(baseline, knight)).toBeLessThan(baseline);
  });

  it('acelera conforme DEX e STR aumentam', () => {
    const baseline = getClassCombatBaseline('knight').attackSpeed;
    const starter = Hero.createStarter('k1', 'knight', 'Galneon');
    const invested = Hero.restore({
      ...starter.toProps(),
      allocatedAttributes: { str: 10, dex: 10, int: 0 },
    });

    expect(resolveHeroAttributeAttackSpeed(baseline, invested)).toBeGreaterThan(
      resolveHeroAttributeAttackSpeed(baseline, starter),
    );
  });

  it('sorcerer não ganha ASPD de STR', () => {
    const baseline = getClassCombatBaseline('sorcerer').attackSpeed;
    const withStr = Hero.restore({
      ...Hero.createStarter('s1', 'sorcerer', 'Lyra').toProps(),
      allocatedAttributes: { str: 20, dex: 0, int: 0 },
    });
    const withoutStr = Hero.restore({
      ...Hero.createStarter('s1', 'sorcerer', 'Lyra').toProps(),
      allocatedAttributes: { str: 0, dex: 0, int: 20 },
    });

    expect(resolveHeroAttributeAttackSpeed(baseline, withStr)).toBe(
      resolveHeroAttributeAttackSpeed(baseline, withoutStr),
    );
  });
});
