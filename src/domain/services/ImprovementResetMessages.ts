import { AttributeKey } from '../progression/Attributes';

const ATTR_LABEL: Record<AttributeKey, string> = {
  str: 'STR',
  dex: 'DEX',
  int: 'INT',
};

export function attributeLabel(key: AttributeKey): string {
  return ATTR_LABEL[key];
}

/** Mensagens de domínio do reset de aprimoramento (erros e avisos). */
export const ImprovementResetMessages = {
  featureUnitaryBlocked:
    'Reset de pontos ainda bloqueado. Compre o nó na árvore de Runas.',

  featureMassBlocked:
    'Reset em massa ainda bloqueado. Compre o nó II na árvore de Runas.',

  noAllocatedAttribute: 'Nenhum ponto alocado neste atributo',

  notImprovementSkill: 'Só é possível devolver ranks de skills de aprimoramento',

  skillWithoutRank: 'Skill sem rank para devolver',

  heroNotFound: 'Herói não encontrado',

  skillEquippedAtZero(skillName: string): string {
    return `Desequipe ${skillName} dos slots de batalha antes de remover o último ponto.`;
  },

  skillBlockedByAscension(ascensionName: string, skillName: string, minRank: number): string {
    return `A ascensão ${ascensionName} exige ${skillName} no rank ${minRank} e não pode ser desfeita.`;
  },

  massPartialSkillAscension(ascensionName: string, skillName: string, minRank: number): string {
    return `Reset parcial: a ascensão ${ascensionName} exige ${skillName} no rank ${minRank}. Pontos acima desse mínimo foram devolvidos.`;
  },

  attributeBlockedBySkill(skillName: string, key: AttributeKey, min: number): string {
    return `${skillName} exige ${ATTR_LABEL[key]} ≥ ${min}. Remova pontos dessa skill ou desequipe-a antes de reduzir.`;
  },

  attributeBlockedByGear(itemName: string, key: AttributeKey, min: number): string {
    return `${itemName} exige ${ATTR_LABEL[key]} ≥ ${min}. Desequipe o item antes de reduzir.`;
  },

  attributeBlockedByAscension(ascensionName: string, key: AttributeKey, min: number): string {
    return `A ascensão ${ascensionName} exige ${ATTR_LABEL[key]} ≥ ${min} e não pode ser desfeita.`;
  },

  skillRankPrerequisite(dependentName: string, requiredName: string, minRank: number): string {
    return `${dependentName} exige ${requiredName} no rank ${minRank}. Remova pontos dela antes de reduzir.`;
  },

  massPartialAscension(ascensionName: string, key: AttributeKey, min: number): string {
    return `Reset parcial: a ascensão ${ascensionName} exige ${ATTR_LABEL[key]} ≥ ${min} e não pode ser desfeita. Pontos acima desse mínimo foram devolvidos.`;
  },

  massPartialGear(itemName: string, key: AttributeKey, min: number): string {
    return `Reset parcial: ${itemName} exige ${ATTR_LABEL[key]} ≥ ${min}. Desequipe o item se quiser recuperar o restante dos pontos.`;
  },
} as const;
