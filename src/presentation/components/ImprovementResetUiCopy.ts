import { MassRefundPreviewDto } from '../../application/dto/MassRefundPreviewDto';

const ATTR_LABEL: Record<'str' | 'dex' | 'int', string> = {
  str: 'STR',
  dex: 'DEX',
  int: 'INT',
};

/** Cópias de UI do reset (toasts de sucesso / fallbacks). Erros de domínio vêm em `response.error`. */
export const ImprovementResetUiCopy = {
  unitaryAttributeSuccess(key: 'str' | 'dex' | 'int'): string {
    return `−1 ${ATTR_LABEL[key]}`;
  },

  massSuccess(points: number): string {
    return `${points} ponto(s) de aprimoramento devolvidos`;
  },

  massEmpty: 'Nenhum ponto para devolver',

  massPreviewFailed: 'Não foi possível calcular o reset em massa.',

  massFailed: 'Falha no reset em massa',

  refundAttributeFailed: 'Não foi possível devolver o ponto',

  refundSkillFailed: 'Não foi possível devolver o ponto da skill',

  attributeLabel(key: 'str' | 'dex' | 'int'): string {
    return ATTR_LABEL[key];
  },
} as const;

export type { MassRefundPreviewDto };
