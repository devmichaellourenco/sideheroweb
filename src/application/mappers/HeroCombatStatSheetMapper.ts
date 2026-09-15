import { CombatProfileProvider } from '../../domain/combat/CombatProfileProvider';
import { estimateHeroSkillThroughput } from '../../domain/combat/DamageThroughputEstimate';
import { getClassCombatBaseline } from '../../domain/combat/ClassCombatBaselines';
import { resolveHeroStoredBaseStat } from '../../domain/combat/HeroBaseStatsCatalog';
import { getHeroCombatIdentity } from '../../domain/combat/HeroCombatIdentityCatalog';
import {
  DEX_ATTACK_SPEED_SCALE,
  resolveActionIntervalSeconds,
  STR_ATTACK_SPEED_SCALE,
} from '../../domain/combat/CombatSpeedScaling';
import { DAMAGE_ELEMENT_LABELS, DamageElement } from '../../domain/combat/DamageElement';
import { defensiveMitigationForHero } from '../../domain/combat/HeroDefensiveStatsProvider';
import {
  heroPassiveAttackContributionLines,
  heroPassiveDefenseContributionLines,
  heroPassiveMaxHealthContributionLines,
  heroPassiveMaxHealthPercent,
} from '../../domain/passives/PassiveModifiers';
import {
  getEffectiveResistance,
  ResistanceProfile,
} from '../../domain/combat/ResistanceProfile';
import { resistanceProfileFromHeroEquipment } from '../../domain/combat/ResistanceProfileAggregator';
import { Gear } from '../../domain/entities/Gear';
import { Hero } from '../../domain/entities/Hero';
import { BASIC_ATTACK_SKILL } from '../../domain/progression/combat/BasicAttackSkill';
import {
  HeroCombatStatLineDto,
  HeroCombatStatSectionDto,
} from '../dto/HeroCombatStatSheetDto';

const combatProfiles = new CombatProfileProvider();

function sumGear(equipment: Partial<Record<string, Gear | null>>, selector: (g: Gear) => number): number {
  return Object.values(equipment ?? {}).reduce((sum, gear) => {
    if (!gear) return sum;
    return sum + selector(gear);
  }, 0);
}

function gearContributionLines(
  equipment: Partial<Record<string, Gear | null>>,
  selector: (g: Gear) => number,
  formatter: (value: number) => string,
): string[] {
  const lines: string[] = [];
  for (const gear of Object.values(equipment ?? {})) {
    if (!gear) continue;
    const value = selector(gear);
    if (value === 0) continue;
    lines.push(`${gear.name}: ${formatter(value)}`);
  }
  return lines;
}

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
  gearFlat: number,
  gearFlatLines: string[],
  percentBonus: number,
  passiveLines: string[],
  total: number,
): HeroCombatStatLineDto {
  const tooltipLines = [
    `Base da classe: ${fmtInt(base)}`,
    ...(levelBonus !== 0 ? [`Nível: +${fmtInt(levelBonus)}`] : []),
    `${attrFormula}: +${fmtInt(attrBonus)}`,
  ];

  if (gearFlat > 0) {
    tooltipLines.push(`Equipamento (flat): +${fmtInt(gearFlat)}`);
    tooltipLines.push(...gearFlatLines);
  }

  if (percentBonus !== 0) {
    tooltipLines.push(`Bônus % do equipamento: +${fmtInt(percentBonus)}%`);
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

function buildResistanceLine(
  element: Exclude<DamageElement, 'physical'>,
  profile: ResistanceProfile,
  equipment: Partial<Record<string, Gear | null>>,
): HeroCombatStatLineDto {
  const label = DAMAGE_ELEMENT_LABELS[element];
  const value = getEffectiveResistance(profile, element);
  const tooltipLines = [`Resistência ${label}: ${value >= 0 ? '+' : ''}${Math.round(value)}%`];

  for (const gear of Object.values(equipment ?? {})) {
    if (!gear) continue;
    const direct =
      element === 'fire'
        ? gear.fireResistBonus + gear.fireResistFlat
        : element === 'cold'
          ? gear.coldResistBonus + gear.coldResistFlat
          : element === 'lightning'
            ? gear.lightningResistBonus + gear.lightningResistFlat
            : gear.airResistBonus + gear.airResistFlat;
    const allElemental = gear.allElementalResistBonus;
    const parts: string[] = [];
    if (direct !== 0) parts.push(`${direct >= 0 ? '+' : ''}${Math.round(direct)}%`);
    if (allElemental !== 0) parts.push(`+${Math.round(allElemental)}% (elemental)`);
    if (parts.length > 0) {
      tooltipLines.push(`${gear.name}: ${parts.join(', ')}`);
    }
  }

  if (profile.allElemental !== 0) {
    tooltipLines.push(`Bônus elemental total aplicado: +${Math.round(profile.allElemental)}%`);
  }

  return {
    id: `resist-${element}`,
    label,
    value: `${value >= 0 ? '+' : ''}${Math.round(value)}%`,
    tooltipLines,
  };
}

export function mapHeroCombatStatSheet(hero: Hero): HeroCombatStatSectionDto[] {
  const props = hero.toProps();
  const equipment = props.equipment ?? {};
  const level = hero.level;
  const identity = getHeroCombatIdentity(hero.heroClass);
  const attackLevelBonus = (level - 1) * identity.attackPerLevel;
  const defenseLevelBonus = (level - 1) * identity.defensePerLevel;
  const profile = combatProfiles.forHero(hero);
  const baseline = getClassCombatBaseline(hero.heroClass);
  const resistProfile = resistanceProfileFromHeroEquipment(equipment);
  const defensive = defensiveMitigationForHero(hero);

  const attackAttrBonus = Math.floor(hero.totalAttributes.str * 0.5 + hero.totalAttributes.dex * 0.3);
  const attackGearFlat = sumGear(equipment, (g) => g.attackBonus);
  const attackPercent = sumGear(equipment, (g) => g.attackPercentBonus);

  const defenseAttrBonus = Math.floor(hero.totalAttributes.dex * 0.5 + hero.totalAttributes.str * 0.2);
  const defenseGearFlat = sumGear(equipment, (g) => g.defenseBonus);
  const defensePercent = sumGear(equipment, (g) => g.defensePercentBonus);

  const healthAttrBonus = hero.totalAttributes.str * 2;
  const healthGearFlat = sumGear(equipment, (g) => g.healthBonus);
  const healthPercent = sumGear(equipment, (g) => g.healthPercentBonus);
  const healthPassivePercent = heroPassiveMaxHealthPercent(hero);
  const healthLevelBonus = (level - 1) * identity.healthPerLevel;
  const effectiveBaseAttack = resolveHeroStoredBaseStat(hero.heroClass, hero.baseAttack, 'attack');
  const effectiveBaseDefense = resolveHeroStoredBaseStat(
    hero.heroClass,
    hero.baseDefense,
    'defense',
  );
  const effectiveBaseHealth = resolveHeroStoredBaseStat(
    hero.heroClass,
    hero.baseMaxHealth,
    'health',
  );
  const healthRaw =
    effectiveBaseHealth + healthGearFlat + healthLevelBonus + healthAttrBonus;

  const critMultiplier = 1 + profile.critChance * (profile.critDamage - 1);
  const basicThroughput = estimateHeroSkillThroughput(hero, BASIC_ATTACK_SKILL);
  const estimatedDps = basicThroughput?.dps ?? hero.attack * profile.attackSpeed * critMultiplier;

  const dexAspdBonus = hero.totalAttributes.dex * DEX_ATTACK_SPEED_SCALE;
  const strAspdBonus = ['knight', 'berserker', 'paladin'].includes(hero.heroClass)
    ? hero.totalAttributes.str * STR_ATTACK_SPEED_SCALE
    : 0;
  const gearAspd = sumGear(equipment, (g) => g.attackSpeedBonus);
  const ttaSeconds = resolveActionIntervalSeconds(profile.attackSpeed);
  const gearCast = sumGear(equipment, (g) => g.castSpeedBonus);
  const gearCdr = sumGear(equipment, (g) => g.cooldownReductionBonus);

  const gearDodge = sumGear(equipment, (g) => g.dodgeChanceBonus);
  const gearBlock = sumGear(equipment, (g) => g.blockChanceBonus);
  const gearDr = sumGear(equipment, (g) => g.damageReductionBonus);
  const passiveDodge = hero.totalAttributes.dex * 0.0015;

  const offense: HeroCombatStatLineDto[] = [
    buildScaledStatLines(
      'Ataque',
      effectiveBaseAttack,
      attackLevelBonus,
      attackAttrBonus,
      'Atributos (STR×0,5 + DEX×0,3)',
      attackGearFlat,
      gearContributionLines(equipment, (g) => g.attackBonus, (v) => `+${fmtInt(v)} ATK`),
      attackPercent,
      heroPassiveAttackContributionLines(hero),
      hero.attack,
    ),
    {
      id: 'dps',
      label: 'DPS estimado',
      value: estimatedDps.toFixed(1),
      tooltipLines: [
        'Estimativa com ataque básico contínuo (mesma fórmula da aba Status).',
        `Ataque: ${fmtInt(hero.attack)}`,
        `Vel. de ataque: ${fmtSpeed(profile.attackSpeed)}`,
        `APS efetiva: ${basicThroughput ? basicThroughput.ratePerSecond.toFixed(2) : profile.attackSpeed.toFixed(2)}/s`,
        `Dano/hit esperado: ${basicThroughput ? basicThroughput.expectedDamagePerHit.toFixed(1) : '—'}`,
        `Crítico esperado: ${fmtMultiplier(critMultiplier)} (1 + ${fmtPct(profile.critChance, 1)} × (${fmtMultiplier(profile.critDamage)} − 1))`,
        'Inclui bônus %/flat de dano do equipamento; exclui armadura, resist e esquiva do alvo.',
        `DPS ≈ ${estimatedDps.toFixed(1)}`,
      ],
    },
    {
      id: 'attack-speed',
      label: 'Vel. de ataque',
      value: fmtSpeed(profile.attackSpeed),
      tooltipLines: [
        `Classe (${hero.heroClass}): ${fmtSpeed(baseline.attackSpeed)}`,
        `DEX (${hero.totalAttributes.dex}): +${dexAspdBonus.toFixed(3)}/s`,
        ...(strAspdBonus > 0
          ? [`STR (${hero.totalAttributes.str}): +${strAspdBonus.toFixed(3)}/s`]
          : []),
        ...(gearAspd > 0
          ? [`Equipamento: +${gearAspd.toFixed(2)}/s`, ...gearContributionLines(equipment, (g) => g.attackSpeedBonus, (v) => `+${v.toFixed(2)}/s`)]
          : []),
        `Total: ${fmtSpeed(profile.attackSpeed)}`,
      ],
    },
    {
      id: 'time-to-action',
      label: 'Tempo até ação',
      value: `${ttaSeconds.toFixed(2)}s`,
      tooltipLines: [
        'Intervalo individual entre ações deste herói.',
        `TTA = 1 ÷ ASPD = 1 ÷ ${profile.attackSpeed.toFixed(2)} = ${ttaSeconds.toFixed(2)}s`,
        'Sobe com DEX (e STR em classes físicas) e gear de velocidade de ataque.',
      ],
    },
    {
      id: 'cast-speed',
      label: 'Vel. de conjuração',
      value: fmtSpeed(profile.castSpeed),
      tooltipLines: [
        `Classe (${hero.heroClass}): ${fmtSpeed(baseline.castSpeed)}`,
        ...(gearCast > 0 ? [`Equipamento: +${gearCast.toFixed(2)}×`] : []),
        `Acelera a recuperação após conjurar uma skill.`,
        `Total: ${fmtSpeed(profile.castSpeed)}`,
      ],
    },
    {
      id: 'cooldown-reduction',
      label: 'Redução de recarga',
      value: fmtPct(profile.cooldownReduction, 0),
      tooltipLines: [
        'Reduz o tempo de recarga das skills em percentual direto.',
        'Ex.: 30% em uma skill de 10s → 7s de recarga.',
        ...(gearCdr !== 0
          ? [
              `Equipamento: ${gearCdr >= 0 ? '+' : ''}${Math.round(gearCdr)}%`,
              ...gearContributionLines(
                equipment,
                (g) => g.cooldownReductionBonus,
                (v) => `${v >= 0 ? '+' : ''}${Math.round(v)}%`,
              ),
            ]
          : ['Sem bônus de equipamento.']),
        `Total do herói: ${fmtPct(profile.cooldownReduction, 0)} (teto/piso por skill)`,
      ],
    },
    {
      id: 'crit-chance',
      label: 'Chance de crítico',
      value: fmtPct(profile.critChance, 1),
      tooltipLines: [
        `Classe: ${fmtPct(baseline.critChance, 1)}`,
        ...gearContributionLines(equipment, (g) => g.critChanceBonus, (v) => `+${fmtPct(v, 1)}`),
        `Total (máx. 75%): ${fmtPct(profile.critChance, 1)}`,
      ],
    },
    {
      id: 'crit-damage',
      label: 'Dano crítico',
      value: fmtMultiplier(profile.critDamage),
      tooltipLines: [
        `Classe: ${fmtMultiplier(baseline.critDamage)}`,
        ...gearContributionLines(equipment, (g) => g.critDamageBonus, (v) => `+${v.toFixed(2)}×`),
        `Total: ${fmtMultiplier(profile.critDamage)}`,
      ],
    },
  ];

  const defenseLines: HeroCombatStatLineDto[] = [
    buildScaledStatLines(
      'Defesa',
      effectiveBaseDefense,
      defenseLevelBonus,
      defenseAttrBonus,
      'Atributos (DEX×0,5 + STR×0,2)',
      defenseGearFlat,
      gearContributionLines(equipment, (g) => g.defenseBonus, (v) => `+${fmtInt(v)} DEF`),
      defensePercent,
      heroPassiveDefenseContributionLines(hero),
      hero.defense,
    ),
    {
      id: 'max-health',
      label: 'Vida máxima',
      value: fmtInt(hero.maxHealth),
      tooltipLines: [
        `Base da classe: ${fmtInt(effectiveBaseHealth)}`,
        ...(healthLevelBonus !== 0 ? [`Nível: +${fmtInt(healthLevelBonus)}`] : []),
        `STR (${hero.totalAttributes.str} × 2): +${fmtInt(healthAttrBonus)}`,
        ...(healthGearFlat > 0
          ? [
              `Equipamento: +${fmtInt(healthGearFlat)}`,
              ...gearContributionLines(equipment, (g) => g.healthBonus, (v) => `+${fmtInt(v)} HP`),
            ]
          : []),
        `Subtotal (antes de %): ${fmtInt(healthRaw)}`,
        ...(healthPercent !== 0 ? [`Bônus % do equipamento: +${Math.round(healthPercent)}%`] : []),
        ...heroPassiveMaxHealthContributionLines(hero),
        ...(healthPercent !== 0 || healthPassivePercent !== 0
          ? [
              `Bônus % total: +${(healthPercent + healthPassivePercent).toFixed(1)}% → ×${(1 + (healthPercent + healthPassivePercent) / 100).toFixed(3)}`,
            ]
          : []),
        `Total: ${fmtInt(hero.maxHealth)}`,
      ],
    },
    {
      id: 'dodge',
      label: 'Esquiva',
      value: fmtPct(defensive.dodgeChance, 1),
      tooltipLines: [
        `DEX (${hero.totalAttributes.dex}): +${fmtPct(passiveDodge, 1)}`,
        ...(gearDodge > 0 ? [`Equipamento: +${fmtPct(gearDodge, 1)}`, ...gearContributionLines(equipment, (g) => g.dodgeChanceBonus, (v) => `+${fmtPct(v, 1)}`)] : []),
        `Total (máx. 50%): ${fmtPct(defensive.dodgeChance, 1)}`,
      ],
    },
    {
      id: 'block',
      label: 'Bloqueio',
      value: fmtPct(defensive.blockChance, 1),
      tooltipLines: [
        ...(gearBlock > 0 ? [`Equipamento: +${fmtPct(gearBlock, 1)}`, ...gearContributionLines(equipment, (g) => g.blockChanceBonus, (v) => `+${fmtPct(v, 1)}`)] : ['Equipamento: —']),
        `Total (máx. 50%): ${fmtPct(defensive.blockChance, 1)}`,
      ],
    },
    {
      id: 'damage-reduction',
      label: 'Redução de dano',
      value: fmtPct(defensive.damageReduction, 1),
      tooltipLines: [
        ...(gearDr > 0 ? [`Equipamento: +${fmtPct(gearDr, 1)}`, ...gearContributionLines(equipment, (g) => g.damageReductionBonus, (v) => `+${fmtPct(v, 1)}`)] : ['Equipamento: —']),
        `Total (máx. 75%): ${fmtPct(defensive.damageReduction, 1)}`,
      ],
    },
  ];

  const resistances: HeroCombatStatLineDto[] = (
    ['fire', 'cold', 'lightning', 'air'] as const
  ).map((element) => buildResistanceLine(element, resistProfile, equipment));

  if (resistProfile.allElemental === 0 && resistances.every((line) => line.value === '+0%')) {
    resistances[0] = {
      ...resistances[0],
      tooltipLines: [...resistances[0].tooltipLines, 'Sem bônus de resistência no equipamento.'],
    };
  }

  return [
    { id: 'offense', title: 'Ofensiva', lines: offense },
    { id: 'defense', title: 'Defesa', lines: defenseLines },
    { id: 'resistances', title: 'Resistências', lines: resistances },
  ];
}
