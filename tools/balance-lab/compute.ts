import { getClassCombatBaseline } from '../../src/domain/combat/ClassCombatBaselines';
import { resolveActionIntervalSeconds } from '../../src/domain/combat/CombatSpeedScaling';
import { ENEMY_ROSTER } from '../../src/domain/enemies/EnemyRosterCatalog';
import { enemySpriteUrlForLab } from './enemySprites';
import { buildEnemyCombatSheet } from '../../src/domain/enemies/EnemyProgressionCatalog';
import { HeroClass, HERO_CLASSES } from '../../src/domain/entities/HeroClass';
import { getBaseAttributes } from '../../src/domain/progression/BaseAttributes';
import { defaultFormulaConstants, mergeFormulaConstants } from './formulas';
import {
  catalogIdentityFor,
  identityFromLegacyFormulas,
  resolveLabIdentity,
} from './identity';
import {
  defaultEnemyResists,
  sampleElementalHits,
  zeroElemFlat,
  zeroElemPercent,
  zeroPenetration,
  zeroResists,
  LAB_DEFAULT_SKILL_RANK,
} from './elemental';
import { buildHeroPassiveSlots, sumPassiveBonuses } from './passives';
import {
  LabCombatantIdentity,
  LabCombatantInput,
  LabCombatantResult,
  LabDocument,
  LabEnemyRole,
  LabFormulaConstants,
  LabHeroClass,
} from './types';

const HERO_CLASS_BASE: Record<
  HeroClass,
  { attack: number; defense: number; health: number }
> = {
  knight: { attack: 26, defense: 8, health: 120 },
  sorcerer: { attack: 22, defense: 3, health: 80 },
  priest: { attack: 14, defense: 5, health: 100 },
  berserker: { attack: 24, defense: 4, health: 110 },
  archer: { attack: 23, defense: 5, health: 95 },
  paladin: { attack: 22, defense: 10, health: 115 },
};

const PHYSICAL_MELEE: ReadonlySet<HeroClass> = new Set(['knight', 'berserker', 'paladin']);

export function listEnemyTypeOptions(): Array<{
  id: string;
  name: string;
  tier: number;
  spriteUrl: string;
}> {
  return ENEMY_ROSTER.map((entry) => ({
    id: entry.id,
    name: entry.name,
    tier: entry.powerTier,
    spriteUrl: enemySpriteUrlForLab(entry.id),
  }));
}

export function listHeroClassOptions(): readonly LabHeroClass[] {
  return HERO_CLASSES;
}

export function defaultHeroInput(heroClass: LabHeroClass = 'knight', level = 1): LabCombatantInput {
  const base = HERO_CLASS_BASE[heroClass];
  const attrs = getBaseAttributes(heroClass);
  const identity = catalogIdentityFor({ kind: 'hero', heroClass });
  const levelsGained = Math.max(0, level - 1);
  return {
    kind: 'hero',
    label: `Herói ${heroClass}`,
    level,
    str: attrs.str,
    dex: attrs.dex,
    int: attrs.int,
    baseAttack: base.attack + levelsGained * identity.levelUpAttackGain,
    baseDefense: base.defense + levelsGained * identity.levelUpDefenseGain,
    baseMaxHealth: base.health + levelsGained * identity.levelUpHealthGain,
    gearAttack: 0,
    gearDefense: 0,
    gearHealth: 0,
    attackPercent: 0,
    defensePercent: 0,
    healthPercent: 0,
    heroClass,
    physicalMeleeAspd: PHYSICAL_MELEE.has(heroClass),
    aspdBaseline: 0,
    critChance: 0,
    critDamage: 0,
    ascensionId: null,
    passives: buildHeroPassiveSlots(heroClass, null),
    resists: zeroResists(),
    elementalDamagePercent: zeroElemPercent(),
    elementalDamageFlat: zeroElemFlat(),
    elementalPenetration: zeroPenetration(),
    physicalDamagePercent: 0,
    identity,
  };
}

export function defaultEnemyInput(
  enemyType = 'goblin_raider',
  level = 1,
  role: LabEnemyRole = 'trash',
): LabCombatantInput {
  const sheet = buildEnemyCombatSheet({ enemyType, level, role });
  const entry = ENEMY_ROSTER.find((e) => e.id === enemyType);
  return {
    kind: 'enemy',
    label: entry?.name ?? enemyType,
    level: sheet.level,
    str: sheet.attributes.str,
    dex: sheet.attributes.dex,
    int: sheet.attributes.int,
    baseAttack: sheet.baseAttack,
    baseDefense: sheet.baseDefense,
    baseMaxHealth: sheet.baseMaxHealth,
    gearAttack: 0,
    gearDefense: 0,
    gearHealth: 0,
    attackPercent: 0,
    defensePercent: 0,
    healthPercent: 0,
    enemyType,
    enemyRole: role,
    physicalMeleeAspd: sheet.physicalMeleeAspd,
    aspdBaseline: 0,
    critChance: 0,
    critDamage: 0,
    ascensionId: null,
    passives: [],
    resists: defaultEnemyResists(enemyType, level),
    elementalDamagePercent: zeroElemPercent(),
    elementalDamageFlat: zeroElemFlat(),
    elementalPenetration: zeroPenetration(),
    physicalDamagePercent: 0,
    identity: catalogIdentityFor({ kind: 'enemy', enemyType }),
  };
}

export function applyPreset(input: LabCombatantInput): LabCombatantInput {
  if (input.kind === 'hero') {
    const next = defaultHeroInput(input.heroClass ?? 'knight', input.level);
    return {
      ...next,
      label: input.label || next.label,
      gearAttack: input.gearAttack,
      gearDefense: input.gearDefense,
      gearHealth: input.gearHealth,
      attackPercent: input.attackPercent,
      defensePercent: input.defensePercent,
      healthPercent: input.healthPercent,
      ascensionId: input.ascensionId ?? null,
      passives: buildHeroPassiveSlots(
        input.heroClass ?? 'knight',
        input.ascensionId ?? null,
        input.passives,
      ),
      resists: input.resists ?? zeroResists(),
      elementalDamagePercent: input.elementalDamagePercent ?? zeroElemPercent(),
      elementalDamageFlat: input.elementalDamageFlat ?? zeroElemFlat(),
      elementalPenetration: input.elementalPenetration ?? zeroPenetration(),
      physicalDamagePercent: input.physicalDamagePercent ?? 0,
    };
  }

  const next = defaultEnemyInput(
    input.enemyType ?? 'goblin_raider',
    input.level,
    input.enemyRole ?? 'trash',
  );
  return {
    ...next,
    label: input.label || next.label,
    resists: defaultEnemyResists(input.enemyType ?? 'goblin_raider', input.level),
    elementalDamagePercent: input.elementalDamagePercent ?? zeroElemPercent(),
    elementalDamageFlat: input.elementalDamageFlat ?? zeroElemFlat(),
    elementalPenetration: input.elementalPenetration ?? zeroPenetration(),
    physicalDamagePercent: input.physicalDamagePercent ?? 0,
  };
}

function deriveAttack(
  input: LabCombatantInput,
  level: number,
  attributes: { str: number; dex: number; int: number },
  attackPercent: number,
  f: LabFormulaConstants,
  identity: LabCombatantIdentity,
): number {
  const gearBonus = input.kind === 'hero' ? input.gearAttack : 0;
  const levelBonus = (level - 1) * identity.attackPerLevel;
  const attrBonus = Math.floor(attributes.str * f.attrAtkStr + attributes.dex * f.attrAtkDex);
  const raw = input.baseAttack + gearBonus + levelBonus + attrBonus;
  return Math.max(0, Math.floor(raw * (1 + attackPercent / 100)));
}

function deriveDefense(
  input: LabCombatantInput,
  level: number,
  attributes: { str: number; dex: number; int: number },
  defensePercent: number,
  f: LabFormulaConstants,
  identity: LabCombatantIdentity,
): number {
  const gearBonus = input.kind === 'hero' ? input.gearDefense : 0;
  const levelBonus = (level - 1) * identity.defensePerLevel;
  const attrBonus = Math.floor(attributes.dex * f.attrDefDex + attributes.str * f.attrDefStr);
  const raw = input.baseDefense + gearBonus + levelBonus + attrBonus;
  return Math.max(0, Math.floor(raw * (1 + defensePercent / 100)));
}

function deriveMaxHealth(
  input: LabCombatantInput,
  level: number,
  attributes: { str: number; dex: number; int: number },
  healthPercent: number,
  f: LabFormulaConstants,
  identity: LabCombatantIdentity,
): number {
  const gearBonus = input.kind === 'hero' ? input.gearHealth : 0;
  const levelBonus = (level - 1) * identity.healthPerLevel;
  const attrBonus = attributes.str * f.attrHpStr;
  const raw = input.baseMaxHealth + gearBonus + levelBonus + attrBonus;
  return Math.max(1, Math.floor(raw * (1 + healthPercent / 100)));
}

export function computeCombatant(
  input: LabCombatantInput,
  formulas: LabFormulaConstants = defaultFormulaConstants(),
  skillRank: number = LAB_DEFAULT_SKILL_RANK,
): LabCombatantResult {
  const f = mergeFormulaConstants(formulas);
  const identity = resolveLabIdentity(input);
  const level = Math.max(1, Math.floor(input.level));
  const attributes = {
    str: Math.max(0, Math.floor(input.str)),
    dex: Math.max(0, Math.floor(input.dex)),
    int: Math.max(0, Math.floor(input.int)),
  };

  const passives =
    input.kind === 'hero'
      ? sumPassiveBonuses(input.passives, {
          level,
          str: attributes.str,
          dex: attributes.dex,
          int: attributes.int,
        })
      : {
          attackPercent: 0,
          defensePercent: 0,
          healthPercentFromFlatAndLevel: 0,
          healthPercentPerDefense: 0,
          treeDamagePercent: 0,
          allySupportPercent: 0,
          lines: [] as string[],
        };

  const attackPercent = input.attackPercent + passives.attackPercent;
  const defensePercent = input.defensePercent + passives.defensePercent;

  const defense = deriveDefense(input, level, attributes, defensePercent, f, identity);
  const healthPercent =
    input.healthPercent +
    passives.healthPercentFromFlatAndLevel +
    passives.healthPercentPerDefense * defense;
  const attack = deriveAttack(input, level, attributes, attackPercent, f, identity);
  const maxHealth = deriveMaxHealth(input, level, attributes, healthPercent, f, identity);

  let baselineAspd: number;
  let critChance: number;
  let critDamage: number;

  if (input.kind === 'hero') {
    const profile = getClassCombatBaseline(input.heroClass ?? 'knight');
    baselineAspd = input.aspdBaseline && input.aspdBaseline > 0 ? input.aspdBaseline : profile.attackSpeed;
    critChance = input.critChance && input.critChance > 0 ? input.critChance : profile.critChance;
    critDamage = input.critDamage && input.critDamage > 0 ? input.critDamage : profile.critDamage;
  } else {
    const sheet = buildEnemyCombatSheet({
      enemyType: input.enemyType ?? 'goblin_raider',
      level,
      role: input.enemyRole ?? 'trash',
    });
    baselineAspd =
      input.aspdBaseline && input.aspdBaseline > 0
        ? input.aspdBaseline
        : sheet.combatBaseline.attackSpeed;
    critChance =
      input.critChance && input.critChance > 0 ? input.critChance : sheet.combatBaseline.critChance;
    critDamage =
      input.critDamage && input.critDamage > 0 ? input.critDamage : sheet.combatBaseline.critDamage;
  }

  const physicalMelee =
    input.physicalMeleeAspd ??
    (input.kind === 'hero' ? PHYSICAL_MELEE.has(input.heroClass ?? 'knight') : true);

  const classAspd = baselineAspd * identity.attackSpeedFactor;
  const dexBonus = attributes.dex * f.dexAspdScale;
  const strBonus = physicalMelee ? attributes.str * f.strAspdScale : 0;
  const attackSpeed = Math.max(f.aspdFloor, classAspd + dexBonus + strBonus);
  const timeToAction = resolveActionIntervalSeconds(attackSpeed);
  const basicHit = Math.max(1, Math.floor(attack * identity.basicAttackDamageRatio));
  const critMultiplier = 1 + critChance * (critDamage - 1);
  const estimatedBasicDps = basicHit * attackSpeed * critMultiplier;

  const levelAtk = (level - 1) * identity.attackPerLevel;
  const levelDef = (level - 1) * identity.defensePerLevel;
  const levelHp = (level - 1) * identity.healthPerLevel;
  const attrAtk = Math.floor(attributes.str * f.attrAtkStr + attributes.dex * f.attrAtkDex);
  const attrDef = Math.floor(attributes.dex * f.attrDefDex + attributes.str * f.attrDefStr);
  const attrHp = attributes.str * f.attrHpStr;
  const elementalSample = sampleElementalHits(input, attack, defense, skillRank);
  const gearAtk = input.kind === 'hero' ? input.gearAttack : 0;
  const gearDef = input.kind === 'hero' ? input.gearDefense : 0;
  const gearHp = input.kind === 'hero' ? input.gearHealth : 0;
  const levelsAbove1 = level - 1;
  const n = (value: number, digits = 3): string => {
    if (!Number.isFinite(value)) return '?';
    if (Number.isInteger(value)) return String(value);
    const fixed = value.toFixed(digits).replace(/\.?0+$/, '');
    return fixed.replace('.', ',');
  };
  const levelTerm = (perLevel: number): string =>
    perLevel === 0 ? '' : ` + ${n(levelsAbove1)}×${n(perLevel)}`;
  const levelStep = (
    bonus: number,
    perLevel: number,
  ): Array<{ label: string; detail: string; note: string }> =>
    perLevel === 0
      ? []
      : [
          {
            label: 'Nível',
            detail: `+${bonus}`,
            note: `(nível − 1) × ${perLevel} (identidade)`,
          },
        ];

  return {
    label: input.label,
    kind: input.kind,
    level,
    attributes,
    attack,
    defense,
    maxHealth,
    attackSpeed,
    timeToAction,
    critChance,
    critDamage,
    basicHit,
    estimatedBasicDps,
    passiveAttackPercent: passives.attackPercent,
    passiveDefensePercent: passives.defensePercent,
    passiveHealthPercent: healthPercent - input.healthPercent,
    treeDamagePercent: passives.treeDamagePercent,
    allySupportPercent: passives.allySupportPercent,
    skillSamples: elementalSample.samples,
    breakdown: {
      attack: {
        finalLabel: 'ATK final',
        finalValue: String(attack),
        appliedEquation: `floor( (${n(input.baseAttack)} + ${n(gearAtk)}${levelTerm(identity.attackPerLevel)} + floor(${n(attributes.str)}×${n(f.attrAtkStr)} + ${n(attributes.dex)}×${n(f.attrAtkDex)}) ) × (1 + [${n(input.attackPercent)} + ${n(passives.attackPercent)}]/100) ) = ${n(attack)}`,
        steps: [
          {
            label: 'Base ATK',
            detail: String(input.baseAttack),
            note: 'Stat base (classe + level-ups, ou sheet do inimigo)',
          },
          ...levelStep(levelAtk, identity.attackPerLevel),
          {
            label: 'Atributos',
            detail: `+${attrAtk}`,
            note: `floor(STR×${f.attrAtkStr} + DEX×${f.attrAtkDex})`,
          },
          ...(input.kind === 'hero' && input.gearAttack
            ? [{ label: 'Gear flat', detail: `+${input.gearAttack}`, note: 'Bônus de equipamento' }]
            : []),
          ...(attackPercent
            ? [
                {
                  label: '% final',
                  detail: `+${attackPercent}%`,
                  note: 'Gear % + passivas de ATK',
                },
              ]
            : []),
        ],
      },
      defense: {
        finalLabel: 'DEF final',
        finalValue: String(defense),
        appliedEquation: `floor( (${n(input.baseDefense)} + ${n(gearDef)}${levelTerm(identity.defensePerLevel)} + floor(${n(attributes.dex)}×${n(f.attrDefDex)} + ${n(attributes.str)}×${n(f.attrDefStr)}) ) × (1 + [${n(input.defensePercent)} + ${n(passives.defensePercent)}]/100) ) = ${n(defense)}`,
        steps: [
          {
            label: 'Base DEF',
            detail: String(input.baseDefense),
            note: 'Armadura base (classe + level-ups, ou sheet do inimigo)',
          },
          ...levelStep(levelDef, identity.defensePerLevel),
          {
            label: 'Atributos',
            detail: `+${attrDef}`,
            note: `floor(DEX×${f.attrDefDex} + STR×${f.attrDefStr})`,
          },
          ...(input.kind === 'hero' && input.gearDefense
            ? [{ label: 'Gear flat', detail: `+${input.gearDefense}`, note: 'Bônus de equipamento' }]
            : []),
          ...(defensePercent
            ? [
                {
                  label: '% final',
                  detail: `+${defensePercent}%`,
                  note: 'Gear % + passivas de DEF',
                },
              ]
            : []),
        ],
      },
      health: {
        finalLabel: 'HP final',
        finalValue: String(maxHealth),
        appliedEquation: `floor( (${n(input.baseMaxHealth)} + ${n(gearHp)}${levelTerm(identity.healthPerLevel)} + ${n(attributes.str)}×${n(f.attrHpStr)} ) × (1 + [${n(input.healthPercent)} + ${n(healthPercent - input.healthPercent, 1)}]/100) ) = ${n(maxHealth)}`,
        steps: [
          {
            label: 'Base HP',
            detail: String(input.baseMaxHealth),
            note: 'Vida base (classe + level-ups, ou sheet do inimigo)',
          },
          ...levelStep(levelHp, identity.healthPerLevel),
          {
            label: 'Atributos',
            detail: `+${attrHp}`,
            note: `STR × ${f.attrHpStr}`,
          },
          ...(input.kind === 'hero' && input.gearHealth
            ? [{ label: 'Gear flat', detail: `+${input.gearHealth}`, note: 'Bônus de equipamento' }]
            : []),
          ...(healthPercent
            ? [
                {
                  label: '% final',
                  detail: `+${healthPercent.toFixed(1)}%`,
                  note: 'Gear % + passivas (HP%/DEF usa DEF já final)',
                },
              ]
            : []),
        ],
      },
      aspd: {
        finalLabel: 'ASPD',
        finalValue: `${attackSpeed.toFixed(3)}/s`,
        appliedEquation: physicalMelee
          ? `ASPD = max(${n(f.aspdFloor)}, ${n(baselineAspd)}×${n(identity.attackSpeedFactor)} + ${n(attributes.dex)}×${n(f.dexAspdScale)} + ${n(attributes.str)}×${n(f.strAspdScale)}) = ${n(attackSpeed)}/s · TTA = 1/${n(attackSpeed)} = ${n(timeToAction, 2)}s · Hit básico = floor(${n(attack)}×${n(identity.basicAttackDamageRatio)}) = ${n(basicHit)}`
          : `ASPD = max(${n(f.aspdFloor)}, ${n(baselineAspd)}×${n(identity.attackSpeedFactor)} + ${n(attributes.dex)}×${n(f.dexAspdScale)} + 0) = ${n(attackSpeed)}/s · TTA = 1/${n(attackSpeed)} = ${n(timeToAction, 2)}s · Hit básico = floor(${n(attack)}×${n(identity.basicAttackDamageRatio)}) = ${n(basicHit)}`,
        steps: [
          {
            label: 'Baseline × fator',
            detail: `${(baselineAspd * identity.attackSpeedFactor).toFixed(3)}/s`,
            note: `perfil ${baselineAspd.toFixed(3)} × ${identity.attackSpeedFactor} (identidade)`,
          },
          {
            label: 'DEX',
            detail: `+${dexBonus.toFixed(3)}`,
            note: `DEX × ${f.dexAspdScale}`,
          },
          ...(physicalMelee
            ? [
                {
                  label: 'STR (melee)',
                  detail: `+${strBonus.toFixed(3)}`,
                  note: `STR × ${f.strAspdScale}`,
                },
              ]
            : [{ label: 'STR', detail: '+0', note: 'Sem ASPD de STR (não-melee)' }]),
          {
            label: 'TTA',
            detail: `${timeToAction.toFixed(2)}s`,
            note: '1 / ASPD',
          },
          {
            label: 'Hit básico',
            detail: String(basicHit),
            note: `floor(ATK × ${identity.basicAttackDamageRatio}) (identidade)`,
          },
          {
            label: 'DPS est.',
            detail: estimatedBasicDps.toFixed(1),
            note: 'hit × ASPD × crítico médio',
          },
        ],
      },
      passives: {
        finalLabel: 'Skills / suporte',
        finalValue: `+${passives.treeDamagePercent.toFixed(1)}% / +${passives.allySupportPercent.toFixed(1)}%`,
        steps: passives.lines.length
          ? [
              ...passives.lines.map((line) => {
                const [name, ...rest] = line.split(': ');
                return {
                  label: name ?? 'Passiva',
                  detail: rest.join(': ') || 'ativa',
                  note: undefined as string | undefined,
                };
              }),
              {
                label: 'Σ ATK% passiva',
                detail: `+${passives.attackPercent}%`,
              },
              {
                label: 'Σ DEF% passiva',
                detail: `+${passives.defensePercent}%`,
              },
              {
                label: 'Σ HP% passiva',
                detail: `+${(healthPercent - input.healthPercent).toFixed(1)}%`,
                note: 'Inclui HP%/DEF se houver',
              },
            ]
          : [
              {
                label: 'Nenhuma',
                detail: '—',
                note: 'Inimigo ou passivas desligadas',
              },
            ],
      },
      resists: elementalSample.resistBreakdown,
      elemental: elementalSample.attackBreakdown,
    },
  };
}

export function createLabDocument(
  mode: 'single' | 'compare',
  left: LabCombatantInput,
  right: LabCombatantInput | null,
  formulas: LabFormulaConstants,
): LabDocument {
  return {
    version: 1,
    mode,
    left: hydrateCombatant(left),
    right: mode === 'compare' && right ? hydrateCombatant(right) : null,
    formulas: mergeFormulaConstants(formulas),
    exportedAt: new Date().toISOString(),
  };
}

export function parseLabDocument(raw: string): LabDocument {
  const data = JSON.parse(raw) as LabDocument;
  if (data.version !== 1 || !data.left || !data.left.kind) {
    throw new Error('JSON inválido: esperado LabDocument v1 com left.kind');
  }
  if (data.mode !== 'single' && data.mode !== 'compare') {
    throw new Error('JSON inválido: mode deve ser single|compare');
  }
  const legacyIdentity = identityFromLegacyFormulas(
    data.formulas as unknown as Record<string, unknown>,
  );
  const formulas = mergeFormulaConstants(data.formulas);
  const left = hydrateCombatant(data.left, legacyIdentity);
  const right = data.right ? hydrateCombatant(data.right, legacyIdentity) : null;
  return { ...data, formulas, left, right };
}

function hydrateCombatant(
  input: LabCombatantInput,
  legacyIdentity?: Partial<LabCombatantIdentity>,
): LabCombatantInput {
  const withElemental: LabCombatantInput = {
    ...input,
    resists: input.resists ?? zeroResists(),
    elementalDamagePercent: input.elementalDamagePercent ?? zeroElemPercent(),
    elementalDamageFlat: input.elementalDamageFlat ?? zeroElemFlat(),
    elementalPenetration: input.elementalPenetration ?? zeroPenetration(),
    physicalDamagePercent: input.physicalDamagePercent ?? 0,
    identity: {
      ...catalogIdentityFor(input),
      ...(legacyIdentity ?? {}),
      ...(input.identity ?? {}),
    },
  };
  if (withElemental.kind !== 'hero') {
    return { ...withElemental, passives: [] };
  }
  const heroClass = withElemental.heroClass ?? 'knight';
  const ascensionId = withElemental.ascensionId ?? null;
  return {
    ...withElemental,
    heroClass,
    ascensionId,
    passives: buildHeroPassiveSlots(heroClass, ascensionId, withElemental.passives),
  };
}

export function toTsSnippet(
  input: LabCombatantInput,
  result: LabCombatantResult,
  formulas: LabFormulaConstants,
): string {
  const f = mergeFormulaConstants(formulas);
  const identity = resolveLabIdentity(input);
  const formulaBlock = `// Pesos globais (lab) — crescimento/básico/ASPD/CD na identidade
const formulas = {
  attrAtkStr: ${f.attrAtkStr},
  attrAtkDex: ${f.attrAtkDex},
  attrDefDex: ${f.attrDefDex},
  attrDefStr: ${f.attrDefStr},
  attrHpStr: ${f.attrHpStr},
  dexAspdScale: ${f.dexAspdScale},
  strAspdScale: ${f.strAspdScale},
  aspdFloor: ${f.aspdFloor},
};

const identity = {
  basicAttackDamageRatio: ${identity.basicAttackDamageRatio},
  skillCooldownTurnSeconds: ${identity.skillCooldownTurnSeconds},
  attackSpeedFactor: ${identity.attackSpeedFactor},
  attackPerLevel: ${identity.attackPerLevel},
  defensePerLevel: ${identity.defensePerLevel},
  healthPerLevel: ${identity.healthPerLevel},
  levelUpAttackGain: ${identity.levelUpAttackGain},
  levelUpDefenseGain: ${identity.levelUpDefenseGain},
  levelUpHealthGain: ${identity.levelUpHealthGain},
};`;

  if (input.kind === 'enemy') {
    return `${formulaBlock}

// Inimigo lab → ${input.label} Lv.${result.level} (${input.enemyType}, ${input.enemyRole})
// Colar identity em EnemyCombatIdentityCatalog
// Derivado: ATK ${result.attack} · DEF ${result.defense} · HP ${result.maxHealth} · ASPD ${result.attackSpeed.toFixed(3)} · DPS básico ${result.estimatedBasicDps.toFixed(1)}
{
  level: ${result.level},
  role: '${input.enemyRole ?? 'trash'}',
  enemyType: '${input.enemyType ?? 'goblin_raider'}',
  attributes: { str: ${result.attributes.str}, dex: ${result.attributes.dex}, int: ${result.attributes.int} },
  baseAttack: ${input.baseAttack},
  baseDefense: ${input.baseDefense},
  baseMaxHealth: ${input.baseMaxHealth},
}`;
  }

  const passiveLines = (input.passives ?? [])
    .filter((p) => p.enabled)
    .map(
      (p) =>
        `  // ${p.id}: ${p.effects.map((e) => `${e.kind}=${e.value}`).join(', ')}`,
    )
    .join('\n');

  return `${formulaBlock}

// Herói lab → ${input.label} (${input.heroClass}) Lv.${result.level} asc=${input.ascensionId ?? 'null'}
// Colar identity em HeroCombatIdentityCatalog
// Derivado: ATK ${result.attack} · DEF ${result.defense} · HP ${result.maxHealth} · ASPD ${result.attackSpeed.toFixed(3)}
// Passivas: ATK% ${result.passiveAttackPercent} · DEF% ${result.passiveDefensePercent} · HP% ${result.passiveHealthPercent.toFixed(1)} · skills ${result.treeDamagePercent.toFixed(1)}%
{
  heroClass: '${input.heroClass ?? 'knight'}',
  level: ${result.level},
  attributes: { str: ${result.attributes.str}, dex: ${result.attributes.dex}, int: ${result.attributes.int} },
  baseAttack: ${input.baseAttack},
  baseDefense: ${input.baseDefense},
  baseMaxHealth: ${input.baseMaxHealth},
  gearAttack: ${input.gearAttack},
  gearDefense: ${input.gearDefense},
  gearHealth: ${input.gearHealth},
  ascensionId: ${input.ascensionId ? `'${input.ascensionId}'` : 'null'},
}
${passiveLines}`;
}
