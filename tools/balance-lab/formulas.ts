import {
  DEX_ATTACK_SPEED_SCALE,
  STR_ATTACK_SPEED_SCALE,
} from '../../src/domain/combat/CombatSpeedScaling';
import { LabFormulaConstants } from './types';

export function defaultFormulaConstants(): LabFormulaConstants {
  return {
    attrAtkStr: 0.5,
    attrAtkDex: 0.3,
    attrDefDex: 0.5,
    attrDefStr: 0.2,
    attrHpStr: 2,
    dexAspdScale: DEX_ATTACK_SPEED_SCALE,
    strAspdScale: STR_ATTACK_SPEED_SCALE,
    aspdFloor: 0.175,
  };
}

export interface FormulaFieldMeta {
  key: keyof LabFormulaConstants;
  label: string;
  formulaHint: string;
}

export interface FormulaGroup {
  id: string;
  title: string;
  equation: string;
  meaning: string;
  fields: readonly FormulaFieldMeta[];
}

/** Grupos do painel direito — uma fórmula por bloco, constantes globais abaixo. */
export const FORMULA_GROUPS: readonly FormulaGroup[] = [
  {
    id: 'atk',
    title: 'ATK — ataque',
    equation:
      'floor( (Base ATK + Gear ATK + floor(STR×[STR → ATK] + DEX×[DEX → ATK]) ) × (1 + [ATK % gear + ATK % passivas]/100) )',
    meaning: 'Base + gear flat + bônus de atributos (STR/DEX), depois multiplicador % de gear e passivas.',
    fields: [
      {
        key: 'attrAtkStr',
        label: 'STR → ATK',
        formulaHint: 'peso da STR no bônus',
      },
      {
        key: 'attrAtkDex',
        label: 'DEX → ATK',
        formulaHint: 'peso da DEX no bônus',
      },
    ],
  },
  {
    id: 'def',
    title: 'DEF — defesa',
    equation:
      'floor( (Base DEF + Gear DEF + floor(DEX×[DEX → DEF] + STR×[STR → DEF]) ) × (1 + [DEF % gear + DEF % passivas]/100) )',
    meaning: 'Base + gear flat + bônus de atributos (DEX/STR), depois multiplicador % de gear e passivas.',
    fields: [
      {
        key: 'attrDefDex',
        label: 'DEX → DEF',
        formulaHint: 'peso da DEX no bônus',
      },
      {
        key: 'attrDefStr',
        label: 'STR → DEF',
        formulaHint: 'peso da STR no bônus',
      },
    ],
  },
  {
    id: 'hp',
    title: 'HP — vida máxima',
    equation:
      'floor( (Base HP + Gear HP + STR×[STR → HP] ) × (1 + [HP % gear + HP % passivas]/100) )',
    meaning: 'Base + gear flat + STR×peso, depois multiplicador % de gear e passivas.',
    fields: [
      {
        key: 'attrHpStr',
        label: 'STR → HP',
        formulaHint: 'STR × isto (flat)',
      },
    ],
  },
  {
    id: 'aspd',
    title: 'ASPD / TTA — velocidade',
    equation:
      'ASPD = max([Piso ASPD], [ASPD baseline]×[Fator ASPD da identidade] + DEX×[DEX → ASPD] + STR×[STR → ASPD]?) · TTA = 1/ASPD · Hit básico = floor(ATK × [Ratio básico da identidade])',
    meaning:
      'Fator ASPD e ratio do ataque básico vêm da identidade do combatente. CD de skill = turns × s/turno da identidade − per-rank da skill.',
    fields: [
      {
        key: 'dexAspdScale',
        label: 'DEX → ASPD',
        formulaHint: 'DEX × isto',
      },
      {
        key: 'strAspdScale',
        label: 'STR → ASPD',
        formulaHint: 'só se ASPD melee (STR)',
      },
      {
        key: 'aspdFloor',
        label: 'Piso ASPD',
        formulaHint: 'mínimo no lab',
      },
    ],
  },
  {
    id: 'resists',
    title: 'Resistências',
    equation:
      'dano elemental = floor( ATK × (1 − Resist efetiva/100) ) · Resist efetiva = (Resist [elemento] + Resist All elemental) × (1 − [Pen % elemento + Pen % All elemental]/100)',
    meaning:
      'Físico usa armadura (Base DEF / Gear DEF), não resistência. Campos no Combatente: Resist Fogo/Gelo/Raio/Ar/All e Pen %.',
    fields: [],
  },
  {
    id: 'elemental',
    title: 'Skills de dano (classe / inimigo)',
    equation:
      'raw = max( Base×(powerPerRank×Rank)×(Attr×Fator) , piso ATK×Ratio identidade ) · CD = turns×s/turno identidade − per-rank skill · recovery e CDR na skill',
    meaning:
      'Ratio básico, s/turno de CD e crescimento vêm da identidade. Recovery, redução por rank e teto/piso de CDR vêm da skill selecionada.',
    fields: [],
  },
];

/** Lista plana (leitura do DOM / reset). */
export const FORMULA_FIELDS: readonly FormulaFieldMeta[] = FORMULA_GROUPS.flatMap(
  (group) => group.fields,
);

export function mergeFormulaConstants(
  partial?: Partial<LabFormulaConstants> | null,
): LabFormulaConstants {
  const defaults = defaultFormulaConstants();
  return {
    attrAtkStr: partial?.attrAtkStr ?? defaults.attrAtkStr,
    attrAtkDex: partial?.attrAtkDex ?? defaults.attrAtkDex,
    attrDefDex: partial?.attrDefDex ?? defaults.attrDefDex,
    attrDefStr: partial?.attrDefStr ?? defaults.attrDefStr,
    attrHpStr: partial?.attrHpStr ?? defaults.attrHpStr,
    dexAspdScale: partial?.dexAspdScale ?? defaults.dexAspdScale,
    strAspdScale: partial?.strAspdScale ?? defaults.strAspdScale,
    aspdFloor: partial?.aspdFloor ?? defaults.aspdFloor,
  };
}
