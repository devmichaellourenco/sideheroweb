import { DamageComponent, normalizeDamageComponents } from './DamageComponent';
import { DAMAGE_ELEMENT_LABELS, DamageElement } from './DamageElement';
import {
  ElementalDamageFlatProfile,
  getEffectiveElementalDamageFlat,
  ZERO_ELEMENTAL_DAMAGE_FLAT,
} from './ElementalDamageFlatProfile';
import { elementalDamageFlatFromHeroEquipment } from './ElementalDamageFlatProfileAggregator';
import {
  ElementalDamageProfile,
  getEffectiveElementalDamageBonus,
  ZERO_ELEMENTAL_DAMAGE,
} from './ElementalDamageProfile';
import { elementalDamageProfileFromHeroEquipment } from './ElementalDamageProfileAggregator';
import { physicalDamagePercentFromHeroEquipment } from './GearStatAggregator';
import { elementalPenetrationFromHeroEquipment } from './ElementalPenetrationProfileAggregator';
import {
  resolveMultiComponentDamage,
} from './MitigationPipeline';
import { ResistanceProfile, ZERO_RESISTANCES } from './ResistanceProfile';
import {
  applyCooldownReduction,
  CombatProfileProvider,
} from './CombatProfileProvider';
import { getHeroCombatIdentity } from './HeroCombatIdentityCatalog';
import { resolveActionIntervalSeconds } from './CombatSpeedScaling';
import { getCooldownSeconds } from './SkillCooldownTiming';
import { Hero } from '../entities/Hero';
import { getSkillById } from '../progression/SkillCatalog';
import { CombatSkillDefinition } from '../progression/combat/CombatSkillDefinition';
import {
  applyHeroDamageSkillPower,
  calculateHeroSkillRawPower,
  resolveDamageSkillAttackFloor,
  skillAttributeMultiplier,
  skillRankMultiplier,
} from '../progression/combat/SkillDamageBalance';
import { SkillPowerCalculator } from '../progression/combat/SkillPowerCalculator';
import {
  applyPercentBonus,
  heroPassiveAllySupportPercent,
  heroPassiveSkillPowerContributionLines,
  heroPassiveTreeDamagePercent,
} from '../passives/PassiveModifiers';

/** Chaves de ícone mapeadas na apresentação (`ASSETS.ui` / `ASSETS.skills`). */
export type ThroughputIconKey =
  | 'attack'
  | 'defense'
  | 'health'
  | 'improvement'
  | 'rune'
  | 'power_attack';

export interface ThroughputBreakdownLine {
  text: string;
  icon?: ThroughputIconKey;
}

export interface DamageThroughputEstimate {
  rawPower: number;
  outgoingPower: number;
  expectedDamagePerHit: number;
  ratePerSecond: number;
  dps: number;
  effectiveCooldownSeconds: number | null;
  baseCooldownSeconds: number | null;
  recoverySeconds: number | null;
  critFactor: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number;
  castSpeed: number;
  cooldownReduction: number;
  physicalDamagePercent: number;
  /** Dano mitigado / dano sem resists do mapa (1 = neutro). */
  efficacyRatio: number | null;
  efficacyLabel: 'Bom' | 'Ok' | 'Fraco' | null;
  powerBreakdown: ThroughputBreakdownLine[];
  gearBreakdown: ThroughputBreakdownLine[];
  hitBreakdown: ThroughputBreakdownLine[];
  rateBreakdown: ThroughputBreakdownLine[];
  dpsBreakdown: ThroughputBreakdownLine[];
}

export interface ThroughputEstimateOptions {
  targetResists?: ResistanceProfile;
  targetArmor?: number;
  stageLevel?: number;
}

export function expectedCritFactor(critChance: number, critDamage: number): number {
  return 1 + critChance * (critDamage - 1);
}

export function estimateAttackerOutgoingPower(
  rawPower: number,
  components: DamageComponent[],
  elementalBonus: ElementalDamageProfile = ZERO_ELEMENTAL_DAMAGE,
  elementalFlat: ElementalDamageFlatProfile = ZERO_ELEMENTAL_DAMAGE_FLAT,
  physicalDamagePercent = 0,
): number {
  const normalized = normalizeDamageComponents(components);
  return normalized.reduce((sum, component) => {
    const bonusPercent =
      component.element === 'physical'
        ? physicalDamagePercent
        : getEffectiveElementalDamageBonus(elementalBonus, component.element);
    const bonusFlat =
      component.element === 'physical'
        ? 0
        : getEffectiveElementalDamageFlat(elementalFlat, component.element);
    return (
      sum + rawPower * component.weight * (1 + bonusPercent / 100) + bonusFlat * component.weight
    );
  }, 0);
}

export function basicAttackActionsPerSecond(attackSpeed: number): number {
  return 1 / resolveActionIntervalSeconds(attackSpeed);
}

export function skillCastsPerSecond(
  baseCooldownSeconds: number,
  cooldownReduction: number,
  castSpeed: number,
  skill: CombatSkillDefinition,
): { rate: number; effectiveCooldownSeconds: number; recoverySeconds: number } {
  const effectiveCooldownSeconds = applyCooldownReduction(
    baseCooldownSeconds,
    cooldownReduction,
    skill,
  );
  const recoverySeconds =
    (skill.actionRecoverySeconds ?? 0) / Math.max(castSpeed, 0.01);
  const period = Math.max(effectiveCooldownSeconds, recoverySeconds);
  return {
    rate: 1 / Math.max(period, 0.01),
    effectiveCooldownSeconds,
    recoverySeconds,
  };
}

/** Passo a passo do poder exibido em Status (tooltip da linha Poder). */
export function buildHeroSkillPowerBreakdown(
  combat: CombatSkillDefinition,
  hero: Hero,
  rawPower: number,
): ThroughputBreakdownLine[] {
  if (combat.usesAttackStat) {
    return [
      { icon: 'attack', text: `ATK do herói = ${rawPower}` },
      { text: 'Ataque básico usa o ATK total (nível, atributos e equipamento).' },
      { icon: 'attack', text: `Poder final = ${rawPower}` },
    ];
  }

  const rank = hero.toProps().skillRanks[combat.skillId] ?? 1;
  const definition = getSkillById(combat.skillId);
  const scalingKey = (definition?.scaling ?? 'int') as 'str' | 'dex' | 'int';
  const attributeValue = hero.totalAttributes[scalingKey];
  const base = combat.basePower;
  const rankTerm = skillRankMultiplier(combat.powerPerRank, rank);
  const attrTerm = skillAttributeMultiplier(attributeValue, combat.attributeFactor);
  const product = calculateHeroSkillRawPower(combat, rank, attributeValue);
  const afterFloor = Math.max(1, Math.floor(product));

  const lines: ThroughputBreakdownLine[] = [
    {
      text: `Fórmula: Base × (powerPerRank × nível) × (${scalingKey.toUpperCase()} × fator)`,
    },
    { icon: 'rune', text: `Base = ${base}` },
    {
      icon: 'improvement',
      text: `Rank: ${combat.powerPerRank} × nível ${rank} = ${rankTerm}`,
    },
    {
      icon: 'power_attack',
      text: `${scalingKey.toUpperCase()} ${attributeValue} × ${combat.attributeFactor} = ${attrTerm.toFixed(2)}`,
    },
    {
      text: `Produto = ${base} × ${rankTerm} × ${attrTerm.toFixed(2)} = ${product.toFixed(2)}`,
    },
    { text: `floor(${product.toFixed(2)}) = ${afterFloor}` },
  ];

  const basicRatio = getHeroCombatIdentity(hero.heroClass).basicAttackDamageRatio;
  const attackFloor = resolveDamageSkillAttackFloor(combat, hero.attack, basicRatio);
  const floorRatio = combat.minAttackRatio ?? basicRatio;
  lines.push({
    icon: 'attack',
    text: `Piso vs ATK: ATK ${hero.attack} × ${floorRatio} = ${attackFloor} (mín. = ataque básico)`,
  });
  if (attackFloor > afterFloor) {
    lines.push({
      text: `Piso venceu o produto (${afterFloor} → ${Math.max(afterFloor, attackFloor)}).`,
    });
  }

  const beforePassives = applyHeroDamageSkillPower(combat, product, hero.attack, basicRatio);
  const treePercent = heroPassiveTreeDamagePercent(hero, combat);
  const allyPercent = heroPassiveAllySupportPercent(hero, combat);
  const passiveLines = heroPassiveSkillPowerContributionLines(hero, combat);

  if (passiveLines.length > 0) {
    for (const text of passiveLines) {
      lines.push({ text });
    }
    let afterPassives = beforePassives;
    afterPassives = applyPercentBonus(afterPassives, treePercent);
    afterPassives = applyPercentBonus(afterPassives, allyPercent);
    if (treePercent !== 0 || allyPercent !== 0) {
      lines.push({
        text: `Após passivas: ${beforePassives} → ${afterPassives}`,
      });
    }
  }

  lines.push({ icon: 'attack', text: `Poder final ≈ ${rawPower}` });
  return lines;
}

function buildGearBreakdown(
  components: DamageComponent[],
  elementalBonus: ElementalDamageProfile,
  elementalFlat: ElementalDamageFlatProfile,
  physicalPercent: number,
): ThroughputBreakdownLine[] {
  const lines: ThroughputBreakdownLine[] = [];
  const normalized = normalizeDamageComponents(components);

  for (const component of normalized) {
    const label = DAMAGE_ELEMENT_LABELS[component.element as DamageElement] ?? component.element;
    if (component.element === 'physical') {
      if (physicalPercent !== 0) {
        lines.push({
          icon: 'attack',
          text: `Físico (${(component.weight * 100).toFixed(0)}% do poder): +${physicalPercent}% dano físico do gear`,
        });
      } else {
        lines.push({
          icon: 'attack',
          text: `Físico (${(component.weight * 100).toFixed(0)}% do poder): sem bônus % extra de gear`,
        });
      }
      continue;
    }

    const percent = getEffectiveElementalDamageBonus(elementalBonus, component.element);
    const flat = getEffectiveElementalDamageFlat(elementalFlat, component.element);
    lines.push({
      icon: 'rune',
      text: `${label} (${(component.weight * 100).toFixed(0)}%): +${percent}% · +${flat} flat`,
    });
  }

  if (lines.length === 0) {
    lines.push({ text: 'Sem componentes de dano listados.' });
  }

  return lines;
}

export function classifyBuildEfficacy(ratio: number): 'Bom' | 'Ok' | 'Fraco' {
  if (ratio >= 0.95) return 'Bom';
  if (ratio >= 0.8) return 'Ok';
  return 'Fraco';
}

export function estimateMitigatedHitPower(
  rawPower: number,
  components: DamageComponent[],
  elementalBonus: ElementalDamageProfile,
  elementalFlat: ElementalDamageFlatProfile,
  physicalPercent: number,
  penetration: ReturnType<typeof elementalPenetrationFromHeroEquipment>,
  targetResists: ResistanceProfile,
  targetArmor: number,
  stageLevel: number,
): number {
  return resolveMultiComponentDamage(
    rawPower,
    normalizeDamageComponents(components),
    {
      armor: targetArmor,
      stageLevel,
      resistances: targetResists,
    },
    elementalBonus,
    elementalFlat,
    physicalPercent,
    penetration,
  );
}

export function estimateHeroSkillThroughput(
  hero: Hero,
  combat: CombatSkillDefinition,
  powerCalculator = new SkillPowerCalculator(),
  profiles = new CombatProfileProvider(),
  options: ThroughputEstimateOptions = {},
): DamageThroughputEstimate | null {
  if (combat.kind !== 'damage') return null;

  const profile = profiles.forHero(hero);
  const turnSeconds = getHeroCombatIdentity(hero.heroClass).skillCooldownTurnSeconds;
  const equipment = hero.toProps().equipment;
  const skillRank = hero.toProps().skillRanks[combat.skillId] ?? 1;
  const rawPower = powerCalculator.calculateForHero(combat, hero);
  const components = combat.damageComponents ?? [
    { element: 'physical' as const, delivery: 'melee' as const, weight: 1 },
  ];
  const elementalBonus = elementalDamageProfileFromHeroEquipment(equipment);
  const elementalFlat = elementalDamageFlatFromHeroEquipment(equipment);
  const physicalPercent = physicalDamagePercentFromHeroEquipment(equipment);
  const penetration = elementalPenetrationFromHeroEquipment(equipment);

  const outgoing = estimateAttackerOutgoingPower(
    rawPower,
    components,
    elementalBonus,
    elementalFlat,
    physicalPercent,
  );

  const critFactor = expectedCritFactor(profile.critChance, profile.critDamage);
  let expectedDamagePerHit = outgoing * critFactor;
  let efficacyRatio: number | null = null;
  let efficacyLabel: 'Bom' | 'Ok' | 'Fraco' | null = null;

  const targetResists = options.targetResists;
  if (targetResists) {
    const stageLevel = options.stageLevel ?? hero.level;
    const armor = options.targetArmor ?? Math.max(0, Math.floor(4 + stageLevel * 0.35));
    const vsZero = estimateMitigatedHitPower(
      rawPower,
      components,
      elementalBonus,
      elementalFlat,
      physicalPercent,
      penetration,
      ZERO_RESISTANCES,
      armor,
      stageLevel,
    );
    const vsMap = estimateMitigatedHitPower(
      rawPower,
      components,
      elementalBonus,
      elementalFlat,
      physicalPercent,
      penetration,
      targetResists,
      armor,
      stageLevel,
    );
    efficacyRatio = vsZero > 0 ? vsMap / vsZero : 1;
    efficacyLabel = classifyBuildEfficacy(efficacyRatio);
    expectedDamagePerHit = vsMap * critFactor;
  }

  const powerBreakdown = buildHeroSkillPowerBreakdown(combat, hero, rawPower);
  const gearBreakdown = buildGearBreakdown(
    components,
    elementalBonus,
    elementalFlat,
    physicalPercent,
  );

  const hitBreakdown: ThroughputBreakdownLine[] = [
    { icon: 'attack', text: `Poder bruto = ${rawPower}` },
    { icon: 'rune', text: `Após bônus de gear nos elementos = ${outgoing.toFixed(2)}` },
    {
      icon: 'power_attack',
      text: `Crit esperado = 1 + ${(profile.critChance * 100).toFixed(1)}% × (${profile.critDamage.toFixed(2)} − 1) = ${critFactor.toFixed(3)}`,
    },
    {
      icon: 'attack',
      text: `Dano/hit esperado = ${expectedDamagePerHit.toFixed(2)}`,
    },
  ];

  if (efficacyRatio !== null && efficacyLabel) {
    hitBreakdown.push({
      icon: 'defense',
      text: `Eficácia vs área: ${efficacyLabel} (${(efficacyRatio * 100).toFixed(0)}% do dano sem resists do mapa)`,
    });
  } else {
    hitBreakdown.push({
      text: 'Não inclui armadura, resistências nem esquiva/bloqueio do alvo.',
    });
  }

  const withEfficacy = <T extends Record<string, unknown>>(base: T) => ({
    ...base,
    efficacyRatio,
    efficacyLabel,
  });

  if (
    combat.usesAttackStat ||
    getCooldownSeconds(combat, { rank: skillRank, turnSeconds }) <= 0
  ) {
    const interval = resolveActionIntervalSeconds(profile.attackSpeed);
    const ratePerSecond = 1 / interval;
    const dps = expectedDamagePerHit * ratePerSecond;
    const rateBreakdown: ThroughputBreakdownLine[] = [
      { icon: 'attack', text: `Vel. de ataque (perfil) = ${profile.attackSpeed.toFixed(2)}/s` },
      {
        text: `TTA = 1 ÷ ${profile.attackSpeed.toFixed(2)} = ${interval.toFixed(3)}s`,
      },
      { icon: 'attack', text: `APS efetiva = 1 ÷ ${interval.toFixed(3)} = ${ratePerSecond.toFixed(3)}/s` },
    ];
    const dpsBreakdown: ThroughputBreakdownLine[] = [
      ...hitBreakdown.slice(0, 4),
      ...rateBreakdown,
      {
        icon: 'power_attack',
        text: `DPS = ${expectedDamagePerHit.toFixed(2)} × ${ratePerSecond.toFixed(3)} = ${dps.toFixed(2)}`,
      },
    ];

    return withEfficacy({
      rawPower,
      outgoingPower: outgoing,
      expectedDamagePerHit,
      ratePerSecond,
      dps,
      effectiveCooldownSeconds: null,
      baseCooldownSeconds: null,
      recoverySeconds: null,
      critFactor,
      critChance: profile.critChance,
      critDamage: profile.critDamage,
      attackSpeed: profile.attackSpeed,
      castSpeed: profile.castSpeed,
      cooldownReduction: profile.cooldownReduction,
      physicalDamagePercent: physicalPercent,
      powerBreakdown,
      gearBreakdown,
      hitBreakdown,
      rateBreakdown,
      dpsBreakdown,
    });
  }

  const baseCooldown = getCooldownSeconds(combat, { rank: skillRank, turnSeconds });
  const casting = skillCastsPerSecond(
    baseCooldown,
    profile.cooldownReduction,
    profile.castSpeed,
    combat,
  );
  const dps = expectedDamagePerHit * casting.rate;
  const recoveryBase = combat.actionRecoverySeconds ?? 0;
  const rateBreakdown: ThroughputBreakdownLine[] = [
    { icon: 'rune', text: `Recarga base = ${baseCooldown.toFixed(2)}s` },
    {
      icon: 'improvement',
      text: `CDR do gear = ${(profile.cooldownReduction * 100).toFixed(1)}% → recarga efetiva ${casting.effectiveCooldownSeconds.toFixed(2)}s`,
    },
    {
      icon: 'power_attack',
      text: `Recovery pós-skill = ${recoveryBase} ÷ cast ${profile.castSpeed.toFixed(2)} = ${casting.recoverySeconds.toFixed(3)}s`,
    },
    {
      text: `Período entre casts = máx(recarga efetiva, recovery) = ${Math.max(casting.effectiveCooldownSeconds, casting.recoverySeconds).toFixed(3)}s`,
    },
    { text: `Casts/s = ${casting.rate.toFixed(3)}` },
  ];
  const dpsBreakdown: ThroughputBreakdownLine[] = [
    ...hitBreakdown.slice(0, 4),
    ...rateBreakdown,
    {
      icon: 'power_attack',
      text: `DPS = ${expectedDamagePerHit.toFixed(2)} × ${casting.rate.toFixed(3)} = ${dps.toFixed(2)}`,
    },
  ];

  return withEfficacy({
    rawPower,
    outgoingPower: outgoing,
    expectedDamagePerHit,
    ratePerSecond: casting.rate,
    dps,
    effectiveCooldownSeconds: casting.effectiveCooldownSeconds,
    baseCooldownSeconds: baseCooldown,
    recoverySeconds: casting.recoverySeconds,
    critFactor,
    critChance: profile.critChance,
    critDamage: profile.critDamage,
    attackSpeed: profile.attackSpeed,
    castSpeed: profile.castSpeed,
    cooldownReduction: profile.cooldownReduction,
    physicalDamagePercent: physicalPercent,
    powerBreakdown,
    gearBreakdown,
    hitBreakdown,
    rateBreakdown,
    dpsBreakdown,
  });
}
