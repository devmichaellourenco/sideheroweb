import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { getUnlockedBattleSkillSlotCount, toSkillSlotLayout } from '../../domain/progression/SkillBattleSlots';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { ISkillService } from '../../domain/progression/ISkillService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';

export class AssignSkillSlotUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly presenter: GameStatePresenter,
    private readonly skillService: ISkillService,
  ) {}

  async execute(heroId: string, skillId: string, slotIndex: number): Promise<GameStateDto> {
    if (slotIndex < 0) {
      return this.executeFirstAvailable(heroId, skillId);
    }

    const state = await this.repository.load();
    assertLoadoutEditable(state);
    const hero = state.heroes.find((entry) => entry.id === heroId);

    if (!hero) {
      throw new Error('Herói não encontrado');
    }

    const unlockedSlots = getUnlockedBattleSkillSlotCount(state.upgradeLevels);
    const updatedHero = this.skillService.assignSkillToSlot(hero, skillId, slotIndex, unlockedSlots);
    const heroes = state.heroes.map((entry) => (entry.id === heroId ? updatedHero : entry));
    const nextState = state.withHeroes(heroes).addLog('Skill alocada no slot');

    await this.repository.save(nextState);
    return this.presenter.present(nextState);
  }

  async executeFirstAvailable(heroId: string, skillId: string): Promise<GameStateDto> {
    const state = await this.repository.load();
    const hero = state.heroes.find((entry) => entry.id === heroId);
    if (!hero) {
      throw new Error('Herói não encontrado');
    }

    const unlockedSlots = getUnlockedBattleSkillSlotCount(state.upgradeLevels);
    const targetSlot = toSkillSlotLayout(hero.toProps().equippedSkillIds, unlockedSlots).findIndex(
      (entry, index) => index > 0 && entry === null,
    );

    if (targetSlot < 1) {
      throw new Error('Nenhum slot de skill disponível');
    }

    return this.execute(heroId, skillId, targetSlot);
  }
}
