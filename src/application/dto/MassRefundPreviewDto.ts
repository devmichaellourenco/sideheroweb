export interface MassRefundAttributeChangeDto {
  key: 'str' | 'dex' | 'int';
  from: number;
  to: number;
}

export interface MassRefundPreviewDto {
  /** Pontos de skills de classe (improvement) devolvidos. */
  skillPoints: number;
  /** Pontos de skills de evolução devolvidos (mesmo pool de aprimoramento). */
  ascensionSkillPoints: number;
  attributePoints: number;
  /** Total que volta ao pool de aprimoramento (todas as skills + attrs). */
  pointsRefunded: number;
  skillsCleared: number;
  ascensionSkillsCleared: number;
  attributeChanges: MassRefundAttributeChangeDto[];
  warnings: string[];
}
