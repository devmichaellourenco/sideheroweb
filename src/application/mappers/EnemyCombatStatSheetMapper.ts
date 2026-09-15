import { getEnemyCombatIdentity } from '../../domain/enemies/EnemyCombatIdentityCatalog';
import { CombatProfileProvider } from '../../domain/combat/CombatProfileProvider';
import {
  DEX_ATTACK_SPEED_SCALE,
  resolveActionIntervalSeconds,
  STR_ATTACK_SPEED_SCALE,
} from '../../domain/combat/CombatSpeedScaling';
import { DAMAGE_ELEMENT_LABELS, DamageElement } from '../../domain/combat/DamageElement';
import { defensiveMitigationForEnemy } from '../../domain/combat/HeroDefensiveStatsProvider';
import {
  getEffectiveResistance,
  ResistanceProfile,
} from '../../domain/combat/ResistanceProfile';
import { resolveEnemyInnateResists } from '../../domain/enemies/EnemyInnateResists';
import { getEnemyTierCombatBaseline } from '../../domain/enemies/EnemyProgressionCatalog';
import { Enemy } from '../../domain/entities/Enemy';
import { getPassiveDefinition } from '../../domain/passives/PassiveCatalog';
import { BASIC_ATTACK_SKILL } from '../../domain/progression/combat/BasicAttackSkill';
import { SkillPowerCalculator } from '../../domain/progression/combat/SkillPowerCalculator';
import {
  HeroCombatStatLineDto,
  HeroCombatStatSectionDto,
} from '../dto/HeroCombatStatSheetDto';

const combatProfiles = new CombatProfileProvider();
const skillPower = new SkillPowerCalculator();

function fmtInt(value: number): string {
  return String(Math.round(value));
}

function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function fmtSpeed(value: number): string {
  return `${value.toFixed(2)}/s`;
}

function fmtMultiplier(value: number): string {
  return `${value.toFixed(2)}×`;
}

function buildScaledStatLines(
  label: string,
  base: number,
  levelBonus: number,
  attrBonus: number,
  attrFormula: string,
  percentBonus: number,
  passiveLines: string[],
  total: number,
): HeroCombatStatLineDto {
  const tooltipLines = [
    `Base do template: ${fmtInt(base)}`,
    `Nível: +${fmtInt(levelBonus)}`,
    `${attrFormula}: +${fmtInt(attrBonus)}`,
  ];

  if (percentBonus !== 0) {
    tooltipLines.push(`Bônus % de passivas: +${fmtInt(percentBonus)}%`);
  }

  tooltipLines.push(...passiveLines);
  tooltipLines.push(`Total: ${fmtInt(total)}`);

  return {
    id: label.toLowerCase(),
    label,
    value: fmtInt(total),
    tooltipLines,
  };
}

function passivePercentLines(enemy: Enemy, kind: 'attack' | 'defense' | 'health'): string[] {
  const lines: string[] = [];
  for (const id of enemy.passiveIds) {
    const def = getPassiveDefinition(id);
    for (const effect of def.effects) {
      if (kind === 'attack' && effect.kind === 'attack_percent_flat') {
        lines.push(`${def.name}: +${effect.percent}% ATK`);
      }
      if (kind === 'defense' && effect.kind === 'defense_percent_flat') {
        lines.push(`${def.name}: +${effect.percent}% DEF`);
      }
      if (kind === 'health' && effect.kind === 'max_health_percent_flat') {
        lines.push(`${def.name}: +${effect.percent}% HP`);
      }
      if (kind === 'health' && effect.kind === 'max_health_percent_per_level') {
        lines.push(
          `${def.name}: +${(effect.percentPerLevel * enemy.level).toFixed(1)}% HP (nível)`,
        );
      }
      if (kind === 'health' && effect.kind === 'max_health_percent_per_defense') {
        lines.push(
          `${def.name}: +${(effect.percentPerPoint * enemy.defense).toFixed(1)}% HP (DEF)`,
        );
      }
    }
  }
  return lines;
}

function buildResistanceLine(
  element: Exclude<DamageElement, 'physical'>,
  profile: ResistanceProfile,
): HeroCombatStatLineDto {
  const label = DAMAGE_ELEMENT_LABELS[element];
  const value = getEffectiveResistance(profile, element);
  return {
    id: `resist-${element}`,
    label,
    value: `${value >= 0 ? '+' : ''}${Math.round(value)}%`,
    tooltipLines: [
      `Resistência inata ${label}: ${value >= 0 ? '+' : ''}${Math.round(value)}%`,
      'Inimigos não usam equipamento — só resists do roster/tema.',
    ],
  };
}

/** Ficha de combate do inimigo — mesmas seções do herói, sem gear. */
export function mapEnemyCombatStatSheet(enemy: Enemy): HeroCombatStatSectionDto[] {
  const level = enemy.level;
  const identity = getEnemyCombatIdentity(enemy.enemyType);
  const attackLevelBonus = (level - 1) * identity.attackPerLevel;
  const defenseLevelBonus = (level - 1) * identity.defensePerLevel;
  const healthLevelBonus = (level - 1) * identity.healthPerLevel;
  const profile = combatProfiles.forEnemy(enemy);
  const baseline = getEnemyTierCombatBaseline(enemy.enemyType);
  const resistProfile = resolveEnemyInnateResists(enemy.enemyType, enemy.stage);
  const defensive = defensiveMitigationForEnemy(enemy);

  const attackAttrBonus = Math.floor(
    enemy.totalAttributes.str * 0.5 + enemy.totalAttributes.dex * 0.3,
  );
  const defenseAttrBonus = Math.floor(
    enemy.totalAttributes.dex * 0.5 + enemy.totalAttributes.str * 0.2,
  );
  const healthAttrBonus = enemy.totalAttributes.str * 2;

  const basicPower = skillPower.calculateForEnemy(BASIC_ATTACK_SKILL, enemy);
  const critMultiplier = 1 + profile.critChance * (profile.critDamage - 1);
  const estimatedDps = basicPower * profile.attackSpeed * critMultiplier;

  const dexAspdBonus = enemy.totalAttributes.dex * DEX_ATTACK_SPEED_SCALE;
  const strAspdBonus = enemy.physicalMeleeAspd
    ? enemy.totalAttributes.str * STR_ATTACK_SPEED_SCALE
    : 0;
  const ttaSeconds = resolveActionIntervalSeconds(profile.attackSpeed);
  const dexDodge = enemy.totalAttributes.dex * 0.0015;

  const offense: HeroCombatStatLineDto[] = [
    buildScaledStatLines(
      'Ataque',
      enemy.baseAttack,
      attackLevelBonus,
      attackAttrBonus,
      'Atributos (STR×0,5 + DEX×0,3)',
      0,
      passivePercentLines(enemy, 'attack'),
      enemy.attack,
    ),
    {
      id: 'dps',
      label: 'DPS estimado',
      value: estimatedDps.toFixed(1),
      tooltipLines: [
        'Estimativa com ataque básico (mesma fórmula do herói).',
        `Dano básico: ${fmtInt(basicPower)} (${fmtInt(enemy.attack)} × 0,5)`,
        `Vel. de ataque: ${fmtSpeed(profile.attackSpeed)}`,
        `Crítico esperado: ${fmtMultiplier(critMultiplier)}`,
        `DPS ≈ ${estimatedDps.toFixed(1)}`,
      ],
    },
    {
      id: 'attack-speed',
      label: 'Vel. de ataque',
      value: fmtSpeed(profile.attackSpeed),
      tooltipLines: [
        `Baseline do tier: ${fmtSpeed(baseline.attackSpeed)}`,
        `DEX (${enemy.totalAttributes.dex}): +${dexAspdBonus.toFixed(3)}/s`,
        ...(strAspdBonus > 0
          ? [`STR (${enemy.totalAttributes.str}): +${strAspdBonus.toFixed(3)}/s`]
          : []),
        `Total: ${fmtSpeed(profile.attackSpeed)}`,
      ],
    },
    {
      id: 'time-to-action',
      label: 'Tempo até ação',
      value: `${ttaSeconds.toFixed(2)}s`,
      tooltipLines: [
        'Intervalo individual entre ações deste inimigo.',
        `TTA = 1 ÷ ASPD = 1 ÷ ${profile.attackSpeed.toFixed(2)} = ${ttaSeconds.toFixed(2)}s`,
      ],
    },
    {
      id: 'cast-speed',
      label: 'Vel. de conjuração',
      value: fmtSpeed(profile.castSpeed),
      tooltipLines: [
        `Baseline do tier: ${fmtSpeed(baseline.castSpeed)}`,
        'Inimigos não têm gear de cast speed.',
      ],
    },
    {
      id: 'crit-chance',
      label: 'Chance de crítico',
      value: fmtPct(profile.critChance, 1),
      tooltipLines: [
        `Baseline do tier: ${fmtPct(baseline.critChance, 1)}`,
        `Total: ${fmtPct(profile.critChance, 1)}`,
      ],
    },
    {
      id: 'crit-damage',
      label: 'Dano crítico',
      value: fmtMultiplier(profile.critDamage),
      tooltipLines: [
        `Baseline do tier: ${fmtMultiplier(baseline.critDamage)}`,
        `Total: ${fmtMultiplier(profile.critDamage)}`,
      ],
    },
  ];

  const defenseLines: HeroCombatStatLineDto[] = [
    buildScaledStatLines(
      'Defesa',
      enemy.baseDefense,
      defenseLevelBonus,
      defenseAttrBonus,
      'Atributos (DEX×0,5 + STR×0,2)',
      0,
      passivePercentLines(enemy, 'defense'),
      enemy.defense,
    ),
    {
      id: 'max-health',
      label: 'Vida máxima',
      value: fmtInt(enemy.maxHealth),
      tooltipLines: [
        `Base do template: ${fmtInt(enemy.baseMaxHealth)}`,
        `Nível: +${fmtInt(healthLevelBonus)}`,
        `STR (${enemy.totalAttributes.str} × 2): +${fmtInt(healthAttrBonus)}`,
        ...passivePercentLines(enemy, 'health'),
        `Total: ${fmtInt(enemy.maxHealth)}`,
      ],
    },
    {
      id: 'dodge',
      label: 'Esquiva',
      value: fmtPct(defensive.dodgeChance, 1),
      tooltipLines: [
        `DEX (${enemy.totalAttributes.dex}): +${fmtPct(dexDodge, 1)}`,
        'Bônus de role (elite/boss) somado no domínio.',
        `Total (máx. 50%): ${fmtPct(defensive.dodgeChance, 1)}`,
      ],
    },
    {
      id: 'block',
      label: 'Bloqueio',
      value: fmtPct(defensive.blockChance, 1),
      tooltipLines: [
        'Inimigos: fração do bônus de role (sem gear).',
        `Total (máx. 50%): ${fmtPct(defensive.blockChance, 1)}`,
      ],
    },
    {
      id: 'damage-reduction',
      label: 'Redução de dano',
      value: fmtPct(defensive.damageReduction, 1),
      tooltipLines: ['Inimigos sem gear/skills de DR no v1.', `Total: ${fmtPct(defensive.damageReduction, 1)}`],
    },
  ];

  const resistances: HeroCombatStatLineDto[] = (
    ['fire', 'cold', 'lightning', 'air'] as const
  ).map((element) => buildResistanceLine(element, resistProfile));

  return [
    { id: 'offense', title: 'Ofensiva', lines: offense },
    { id: 'defense', title: 'Defesa', lines: defenseLines },
    { id: 'resistances', title: 'Resistências', lines: resistances },
  ];
}
