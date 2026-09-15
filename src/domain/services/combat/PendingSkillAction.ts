export interface PendingSkillAction {
  side: 'hero' | 'enemy';
  combatantId: string;
  skillId: string;
  executeAt: number;
}
