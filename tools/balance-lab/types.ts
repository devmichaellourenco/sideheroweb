/** Schema de import/export do Balance Lab (v1). */

export type LabSide = 'hero' | 'enemy';

export type LabHeroClass =
  | 'knight'
  | 'sorcerer'
  | 'priest'
  | 'berserker'
  | 'archer'
  | 'paladin';

export type LabEnemyRole = 'trash' | 'elite' | 'boss';

/** Identidade de combate do combatente (catálogo herói/monstro; editável no lab). */
export interface LabCombatantIdentity {
  basicAttackDamageRatio: number;
  skillCooldownTurnSeconds: number;
  attackSpeedFactor: number;
  attackPerLevel: number;
  defensePerLevel: number;
  healthPerLevel: number;
  levelUpAttackGain: number;
  levelUpDefenseGain: number;
  levelUpHealthGain: number;
}

/** Constantes globais das fórmulas — só pesos de atributo / piso ASPD do lab. */
export interface LabFormulaConstants {
  attrAtkStr: number;
  attrAtkDex: number;
  attrDefDex: number;
  attrDefStr: number;
  attrHpStr: number;
  dexAspdScale: number;
  strAspdScale: number;
  aspdFloor: number;
}

/** Um efeito de passiva com o coeficiente numérico editável. */
export interface LabPassiveEffectEdit {
  kind: string;
  value: number;
}

export interface LabPassiveSlot {
  id: string;
  name: string;
  sourceLabel: string;
  enabled: boolean;
  effects: LabPassiveEffectEdit[];
}

export interface LabCombatantInput {
  kind: LabSide;
  label: string;
  level: number;
  str: number;
  dex: number;
  int: number;
  baseAttack: number;
  baseDefense: number;
  baseMaxHealth: number;
  gearAttack: number;
  gearDefense: number;
  gearHealth: number;
  /** % de gear (sem passivas — passivas somam no compute). */
  attackPercent: number;
  defensePercent: number;
  healthPercent: number;
  heroClass?: LabHeroClass;
  enemyType?: string;
  enemyRole?: LabEnemyRole;
  physicalMeleeAspd?: boolean;
  aspdBaseline?: number;
  critChance?: number;
  critDamage?: number;
  /** Ascensão final (cadeia cumulativa). */
  ascensionId?: string | null;
  /** Passivas ativas com coeficientes editáveis (só herói). */
  passives?: LabPassiveSlot[];
  /** Resistências (herói = gear; inimigo = inatas editáveis). */
  resists?: {
    fire: number;
    cold: number;
    lightning: number;
    air: number;
    allElemental: number;
  };
  /** Bônus % de dano elemental (gear). */
  elementalDamagePercent?: {
    fire: number;
    cold: number;
    lightning: number;
    air: number;
    allElemental: number;
  };
  /** Flat de dano elemental (gear). */
  elementalDamageFlat?: {
    fire: number;
    cold: number;
    lightning: number;
    air: number;
  };
  /** Penetração elemental %. */
  elementalPenetration?: {
    fire: number;
    cold: number;
    lightning: number;
    air: number;
    allElemental: number;
  };
  /** % dano físico (gear). */
  physicalDamagePercent?: number;
  /** Identidade do combatente (catálogo; override no lab). */
  identity?: LabCombatantIdentity;
}

export interface LabDocument {
  version: 1;
  mode: 'single' | 'compare';
  left: LabCombatantInput;
  right: LabCombatantInput | null;
  formulas: LabFormulaConstants;
  exportedAt: string;
}

export interface LabBreakdownStep {
  label: string;
  detail: string;
  note?: string;
}

export interface LabBreakdownSection {
  finalLabel: string;
  finalValue: string;
  /** Equação simbólica já preenchida com os valores atuais. */
  appliedEquation?: string;
  steps: LabBreakdownStep[];
}

export interface LabCombatantResult {
  label: string;
  kind: LabSide;
  level: number;
  attributes: { str: number; dex: number; int: number };
  attack: number;
  defense: number;
  maxHealth: number;
  attackSpeed: number;
  timeToAction: number;
  critChance: number;
  critDamage: number;
  basicHit: number;
  estimatedBasicDps: number;
  passiveAttackPercent: number;
  passiveDefensePercent: number;
  passiveHealthPercent: number;
  treeDamagePercent: number;
  allySupportPercent: number;
  /** Skills de dano amostradas (dropdown no lab). */
  skillSamples: Array<{
    skillId: string;
    name: string;
    element: string;
    elementLabel: string;
    rank: number;
    maxRank: number;
    basePower: number;
    powerPerRank: number;
    attributeFactor: number;
    scalingAttr: string;
    attrValue: number;
    weight: number;
    elemPercent: number;
    elemFlat: number;
    catalogRaw: number;
    attackFloor: number;
    attackFloorRatio: number;
    cappedByAttackFloor: boolean;
    rawPower: number;
    outgoing: number;
    mitigatedVsSelf: number;
    appliedEquation: string;
    usesAttackStat: boolean;
    actionRecoverySeconds: number;
    cooldownTurns: number;
    skillCooldownTurnSeconds: number;
    cooldownSecondsPerRank: number;
    baseCooldownSeconds: number;
    effectiveCooldownSeconds: number;
    maxCooldownReduction: number;
    minCooldownReduction: number;
  }>;
  breakdown: {
    attack: LabBreakdownSection;
    defense: LabBreakdownSection;
    health: LabBreakdownSection;
    aspd: LabBreakdownSection;
    passives: LabBreakdownSection;
    resists: LabBreakdownSection;
    elemental: LabBreakdownSection;
  };
}
