export type CombatSkillHighlight = 'none' | 'next' | 'queued';

export interface CombatSkillBarEntry {
  skillId: string;
  skillName: string;
  secondsRemaining: number;
  cooldownTotal: number;
  ready: boolean;
  highlight: CombatSkillHighlight;
}
