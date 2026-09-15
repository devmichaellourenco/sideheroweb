export interface HeroCombatStatLineDto {
  id: string;
  label: string;
  value: string;
  tooltipLines: string[];
}

export interface HeroCombatStatSectionDto {
  id: string;
  title: string;
  lines: HeroCombatStatLineDto[];
}
