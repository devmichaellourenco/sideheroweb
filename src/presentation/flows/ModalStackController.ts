import { GameStateDto } from '../../application/dto/GameStateDto';
import { EquipPickerModalRenderer } from '../components/EquipPickerModalRenderer';
import { HeroDetailModalRenderer } from '../components/HeroDetailModalRenderer';
import { InventoryModalRenderer } from '../components/InventoryModalRenderer';
import { StashModalRenderer } from '../components/StashModalRenderer';
import { LootBatchModalRenderer } from '../components/LootBatchModalRenderer';
import { LootModalRenderer } from '../components/LootModalRenderer';
import { ModalController } from '../components/ModalController';
import { SettingsModalRenderer } from '../components/SettingsModalRenderer';
import { ShopModalRenderer } from '../components/ShopModalRenderer';
import { UpgradeTreeModalRenderer } from '../components/UpgradeTreeModalRenderer';
import { MetaLegacyModalRenderer } from '../components/MetaLegacyModalRenderer';
import { AchievementsModalRenderer } from '../components/AchievementsModalRenderer';
import { DivineForgeModalRenderer } from '../components/DivineForgeModalRenderer';
import {
  bindFormationPanelInteractions,
  renderFormationPanel,
} from '../components/FormationPanelPresentation';
import {
  bindHeroesPanelInteractions,
  renderHeroesPanel,
} from '../components/HeroesPanelPresentation';
import { evaluateForgeSelection, listForgeEligibleGear } from '../components/DivineForgePresentation';
import { calculateForgeSalvageGold } from '../../domain/forge/ForgeSalvageGoldCatalog';
import { GamePreferences } from '../components/GamePreferences';
import { LootFlowController } from '../controllers/LootFlowController';
import { ChestLootFlow } from './ChestLootFlow';
import { GearEquipFlow } from './GearEquipFlow';
import { GearStorageFlow } from './GearStorageFlow';
import { HeroDetailFlow } from './HeroDetailFlow';
import { ModalView } from './ModalTypes';
import { ShopFlow } from './ShopFlow';
import { MetaLegacyFlow } from './MetaLegacyFlow';
import { AchievementsFlow } from './AchievementsFlow';
import { DivineForgeFlow } from './DivineForgeFlow';
import { GearSlotKey } from '../components/GearPresentation';

export type ModalRenderOptions = {
  inlineActiveSlot?: { heroId: string; slot: GearSlotKey } | null;
  canEditGear?: boolean;
};

export class ModalStackController {
  constructor(
    private readonly modal: ModalController,
    private readonly inventoryModal: InventoryModalRenderer,
    private readonly stashModal: StashModalRenderer,
    private readonly heroDetailFlow: HeroDetailFlow,
    private readonly equipPickerModal: EquipPickerModalRenderer,
    private readonly lootModal: LootModalRenderer,
    private readonly lootBatchModal: LootBatchModalRenderer,
    private readonly settingsModal: SettingsModalRenderer,
    private readonly shopModal: ShopModalRenderer,
    private readonly upgradeTreeModal: UpgradeTreeModalRenderer,
    private readonly metaLegacyModal: MetaLegacyModalRenderer,
    private readonly achievementsModal: AchievementsModalRenderer,
    private readonly divineForgeModal: DivineForgeModalRenderer,
    private readonly shopFlow: ShopFlow,
    private readonly metaLegacyFlow: MetaLegacyFlow,
    private readonly achievementsFlow: AchievementsFlow,
    private readonly divineForgeFlow: DivineForgeFlow,
    private readonly gearEquipFlow: GearEquipFlow,
    private readonly gearStorageFlow: GearStorageFlow,
    private readonly chestLootFlow: ChestLootFlow,
    private readonly lootFlow: LootFlowController,
    private readonly getPreferences: () => GamePreferences,
    private readonly onPreferenceChange: <K extends keyof GamePreferences>(
      key: K,
      value: GamePreferences[K],
    ) => void,
    private readonly onOpenUpgrades: () => void,
    private readonly onEquipPickerFromSlot: (heroId: string, slot: string) => void,
    private readonly onEquipPickerFromGear: (gearId: string) => void,
    private readonly onEquipRecommendedLoot: (gearIds: string[]) => void,
    private readonly onOpenStash: () => void,
    private readonly onOpenInventory: () => void,
    private readonly onInventoryHeroChange: (heroId: string) => void = () => {},
    private readonly onExportSave: () => void = () => {},
    private readonly onImportSave: () => void = () => {},
  ) {}

  getModalTitle(view: ModalView, state: GameStateDto): string {
    switch (view.type) {
      case 'inventory':
        return `Inventário (${state.storageCapacity.inventoryUsed}/${state.storageCapacity.inventoryLimit})`;
      case 'stash':
        return state.storageCapacity.stashUnlocked
          ? `Baú (${state.storageCapacity.stashUsed}/${state.storageCapacity.stashLimit})`
          : 'Baú de itens';
      case 'hero-detail': {
        const hero = state.heroes.find((entry) => entry.id === view.heroId);
        return hero ? hero.name : 'Herói';
      }
      case 'settings':
        return 'Configurações';
      case 'shop':
        return 'Loja';
      case 'upgrades':
        return 'Runas';
      case 'meta-legacy':
        return 'Legado';
      case 'achievements':
        return 'Achievements';
      case 'divine-forge':
        return 'Forja Divina';
      case 'formation':
        return 'Formação';
      case 'heroes':
        return 'Heróis';
      case 'loot-batch':
        return `Loot dos baús (${view.gearIds.length})`;
      case 'loot-reveal': {
        const current = this.lootFlow.total - this.lootFlow.queue.length + 1;
        const queueLabel = this.lootFlow.total > 1 ? ` (${current} de ${this.lootFlow.total})` : '';
        return `Loot do baú${queueLabel}`;
      }
      case 'equip-picker':
        if (view.mode.type === 'gear') {
          const gear = state.inventory.find((entry) => entry.id === view.mode.gearId);
          return gear ? `Equipar ${gear.name}` : 'Equipar item';
        }
        {
          const hero = state.heroes.find((entry) => entry.id === view.mode.heroId);
          const slotLabels: Record<string, string> = {
            weapon: 'arma',
            armor: 'armadura',
            accessory: 'acessório',
          };
          const slotLabel = slotLabels[view.mode.slot] ?? view.mode.slot;
          return hero ? `Equipar ${slotLabel} — ${hero.name}` : 'Equipar item';
        }
    }
  }

  renderTop(stack: ModalView[], state: GameStateDto, options: ModalRenderOptions = {}): void {
    if (stack.length === 0) return;

    const view = stack[stack.length - 1];
    const title = this.getModalTitle(view, state);
    const container = this.modal.prepare(title, (reason) => {
      if (reason !== 'action') {
        stack.length = 0;
        this.chestLootFlow.lootFlow.reset();
      }
    });

    this.modal.setBackVisible(stack.length > 1);
    this.modal.setOnBack(() => {
      if (stack.length <= 1) {
        stack.length = 0;
        this.modal.close('button');
        return;
      }
      stack.pop();
      this.renderTop(stack, state, options);
    });

    switch (view.type) {
      case 'inventory':
        this.inventoryModal.render(
          container,
          state,
          {
            onEquipGear: (gearId, heroId) => {
              void this.gearEquipFlow.equip(heroId, gearId, { fromInventory: true });
            },
            onUnequipGear: (heroId, slot) => {
              void this.gearEquipFlow.unequip(heroId, slot, { fromInventory: true });
            },
      onSlotClick: (heroId, slot) => {
        this.openEquipPickerFromSlot(heroId, slot);
      },
      onSortChange: () => this.renderTop(stack, state, options),
            onHeroChange: (heroId) => {
              this.onInventoryHeroChange(heroId);
              this.renderTop(stack, state, options);
            },
            onUpgradesOnlyChange: () => this.renderTop(stack, state, options),
            onOptimizeLoadout: () => {
              void this.gearEquipFlow.optimizeLoadout(undefined, { fromInventory: true });
            },
            onOpenStash: () => this.onOpenStash(),
          },
          { showOptimize: false,
            inlineActiveSlot: options.inlineActiveSlot ?? null,
            canEditGear: options.canEditGear,
          },
        );
        break;
      case 'stash':
        this.stashModal.render(container, state, {
          onFilterChange: () => this.renderTop(stack, state, options),
          onSortChange: () => this.renderTop(stack, state, options),
          onOpenInventory: () => this.onOpenInventory(),
        });
        break;
      case 'hero-detail':
        this.heroDetailFlow.bindToModal(container, state, view.heroId, {
          onSlotClick: (heroId, slot) => this.onEquipPickerFromSlot(heroId, slot),
        });
        break;
      case 'equip-picker':
        this.equipPickerModal.render(container, state, view.mode, {
          onSelectGear: (heroId, gearId) => {
            void this.gearEquipFlow.equip(heroId, gearId);
          },
          onSelectHero: (heroId, gearId) => {
            void this.gearEquipFlow.equip(heroId, gearId);
          },
          onUnequip: (heroId, slot) => {
            void this.gearEquipFlow.unequip(heroId, slot);
          },
          onSortChange: () => this.renderTop(stack, state, options),
          onUpgradesOnlyChange: () => this.renderTop(stack, state, options),
        });
        break;
      case 'loot-reveal':
        this.lootModal.render(container, state, view.gearId, {
          onEquipBest: (heroId, gearId) => {
            void this.gearEquipFlow.equip(heroId, gearId);
          },
          onKeepInInventory: () => this.chestLootFlow.closeLootModal(),
        });
        break;
      case 'loot-batch':
        this.lootBatchModal.render(
          container,
          state,
          view.gearIds,
          {
            onEquipRecommended: () => this.onEquipRecommendedLoot(view.gearIds),
            onKeepAll: () => this.chestLootFlow.closeLootBatchModal(),
          },
          { canOptimize: false },
        );
        break;
      case 'settings':
        this.settingsModal.render(container, state, this.getPreferences(), {
          onPreferenceChange: (key, value) => this.onPreferenceChange(key, value),
          onOpenUpgrades: () => this.onOpenUpgrades(),
          onExportSave: () => this.onExportSave(),
          onImportSave: () => this.onImportSave(),
        });
        break;
      case 'upgrades':
        this.upgradeTreeModal.render(container, this.shopFlow.state.upgradeNodes, {
          onPurchase: (upgradeId) => {
            void this.shopFlow.purchaseUpgrade(upgradeId);
          },
        });
        break;
      case 'meta-legacy':
        this.metaLegacyModal.render(container, state, this.metaLegacyFlow.metaNodes, {
          onPurchase: (upgradeId) => {
            void this.metaLegacyFlow.purchaseUpgrade(upgradeId);
          },
        });
        break;
      case 'achievements':
        this.achievementsModal.render(container, this.achievementsFlow.entries, {
          completedCount: this.achievementsFlow.completedCount,
          totalCount: this.achievementsFlow.totalCount,
        });
        break;
      case 'shop':
        this.shopModal.render(
          container,
          state,
          {
            offers: this.shopFlow.state.offers,
            activeShop: this.shopFlow.state.activeShop,
            refreshCost: this.shopFlow.state.refreshCost,
            canAffordRefresh: this.shopFlow.state.canAffordRefresh,
            shopRefreshUnlocked: this.shopFlow.state.shopRefreshUnlocked,
            shopRefreshRemaining: this.shopFlow.state.shopRefreshRemaining,
          },
          {
            onBuyOffer: (offerId) => {
              void this.shopFlow.buyOffer(offerId);
            },
            onRefreshShop: () => {
              void this.shopFlow.refreshShop();
            },
          },
        );
        break;
      case 'divine-forge':
        this.divineForgeModal.render(container, state, {
          onTabChange: () => this.renderTop(stack, state, options),
          onFuse: (gearIds) => {
            const forgeGear = listForgeEligibleGear(state);
            const gears = forgeGear.filter((entry) => gearIds.includes(entry.id));
            const status = evaluateForgeSelection(new Set(gearIds), forgeGear);
            if (!status.canFuse || !status.nextRarityLabel) return;
            void this.divineForgeFlow.fuse(gearIds, gears, status.nextRarityLabel);
          },
          onSalvage: (gearId) => {
            const gear = listForgeEligibleGear(state).find((entry) => entry.id === gearId);
            if (!gear) return;
            const goldPreview = calculateForgeSalvageGold(gear.rarity, state.stage);
            void this.divineForgeFlow.salvage(gear, goldPreview);
          },
        });
        break;
      case 'formation':
        container.innerHTML = renderFormationPanel(state);
        bindFormationPanelInteractions(container);
        break;
      case 'heroes':
        container.innerHTML = renderHeroesPanel(state);
        bindHeroesPanelInteractions(container);
        break;
    }
  }
}
