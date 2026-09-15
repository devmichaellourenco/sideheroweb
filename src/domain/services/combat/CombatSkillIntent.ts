export interface CombatSkillIntent {
  nextSkillName: string;
  nextSkillId: string;
  status: 'ready' | 'cooldown';
  secondsRemaining: number;
  chargingSkills: Array<{ skillId: string; skillName: string; secondsRemaining: number }>;
}
