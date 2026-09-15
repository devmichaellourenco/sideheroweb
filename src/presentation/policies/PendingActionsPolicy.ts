import { GameStateDto } from '../../application/dto/GameStateDto';
import { countUpgradeItems } from '../components/GearComparison';

export type PendingActionKind =
  | 'chest'
  | 'inventory-upgrade'
  | 'upgrade-tree'
  | 'hero-points'
  | 'campaign'
  | 'stash'
  | 'forge'
  | 'inventory-full';

export interface PendingActionItem {
  kind: PendingActionKind;
  label: string;
}

export function buildPendingActions(state: GameStateDto): PendingActionItem[] {
  const actions: PendingActionItem[] = [];

  if (state.pendingChestCount > 0) {
    const label =
      state.pendingChestCount === 1
        ? '1 baú para abrir'
        : `${state.pendingChestCount} baús para abrir`;
    actions.push({ kind: 'chest', label });
  }

  const upgradeCount = countUpgradeItems(state);
  if (upgradeCount > 0) {
    actions.push({
      kind: 'inventory-upgrade',
      label: upgradeCount === 1 ? '1 upgrade no inventário' : `${upgradeCount} upgrades no inventário`,
    });
  }

  const inventoryFullAction = buildInventoryFullAction(state);
  if (inventoryFullAction) {
    actions.push(inventoryFullAction);
  }

  if (state.purchasableUpgradeCount > 0) {
    actions.push({
      kind: 'upgrade-tree',
      label:
        state.purchasableUpgradeCount === 1
          ? '1 runa disponível'
          : `${state.purchasableUpgradeCount} runas disponíveis`,
    });
  }

  const heroesWithPoints = state.heroes.filter((hero) => hero.hasUnspentPoints);
  if (heroesWithPoints.length > 0) {
    const names = heroesWithPoints.map((hero) => hero.name).join(', ');
    actions.push({ kind: 'hero-points', label: `Aprimoramento: ${names}` });
  }

  if (shouldSuggestCampaignAdvance(state)) {
    actions.push({
      kind: 'campaign',
      label: 'Próxima fase liberada — abrir campanha',
    });
  }

  return actions;
}

function buildInventoryFullAction(state: GameStateDto): PendingActionItem | null {
  const capacity = state.storageCapacity;
  if (!capacity || capacity.inventoryUsed < capacity.inventoryLimit) {
    return null;
  }

  // Já há upgrade de item — inventário-cheio seria redundante.
  if (countUpgradeItems(state) > 0) {
    return null;
  }

  const stashHasRoom =
    capacity.stashUnlocked && capacity.stashUsed < capacity.stashLimit;
  if (stashHasRoom) {
    return { kind: 'stash', label: 'Inventário cheio — guardar no baú' };
  }

  if (state.featureFlags?.divineForge) {
    return { kind: 'forge', label: 'Inventário cheio — usar Forja' };
  }

  return { kind: 'inventory-full', label: 'Inventário cheio — gerenciar itens' };
}

/** Pendência early: há fase unlockada diferente da selecionada, ou clear recente sem combate. */
function shouldSuggestCampaignAdvance(state: GameStateDto): boolean {
  if (state.seasonCompleted) return false;
  const progress = state.campaignProgress;
  if (!progress) return false;

  const unlocked = progress.unlockedPhaseIds ?? [];
  const selected = progress.selectedPhaseId;
  const hasOtherUnlocked = unlocked.some((phaseId) => phaseId !== selected);
  if (!hasOtherUnlocked) return false;

  return state.canEditParty === true && !state.phaseRun;
}
