import { CombatFloatingEventDto } from '../../application/dto/CombatFloatingEventDto';
import { CombatSkillVfxDto } from '../../application/dto/CombatSkillVfxDto';
import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { getDefaultGameClient } from '../../infrastructure/messaging/defaultGameClient';
import { AutoBattleController } from '../controllers/AutoBattleController';
import { BattleLogPanelController } from '../controllers/BattleLogPanelController';
import { BattleStatsPanelController } from '../controllers/BattleStatsPanelController';
import { GearMutationQueue } from '../controllers/GearMutationQueue';
import { GameHudController } from '../controllers/GameHudController';
import { GamePreferencesController } from '../controllers/GamePreferencesController';
import { LootFlowController } from '../controllers/LootFlowController';
import { GameMusicController } from '../audio/GameMusicController';
import { GameSfxController } from '../audio/GameSfxController';
import { resolveGameMusicTrack } from '../audio/resolveGameMusicTrack';
import { BattleVictoryFlow, BATTLE_RESULT_REVEAL_DELAY_MS } from '../flows/BattleVictoryFlow';
import { BattleStartFlow } from '../flows/BattleStartFlow';
import { CampaignFlow } from '../flows/CampaignFlow';
import { ActSceneFlow } from '../flows/ActSceneFlow';
import { SplashScreenController } from './SplashScreenController';
import { ChestLootFlow } from '../flows/ChestLootFlow';
import { GearEquipFlow } from '../flows/GearEquipFlow';
import { GearStorageFlow, bindGearStorageActions } from '../flows/GearStorageFlow';
import { HeroDetailFlow } from '../flows/HeroDetailFlow';
import { PartyFlow } from '../flows/PartyFlow';
import { ModalStackController } from '../flows/ModalStackController';
import { ModalView } from '../flows/ModalTypes';
import { ShopFlow } from '../flows/ShopFlow';
import { MetaLegacyFlow } from '../flows/MetaLegacyFlow';
import { AchievementsFlow } from '../flows/AchievementsFlow';
import { getFeatureFlags } from '../helpers/FeatureFlagsHelper';
import { getHeroNavigation, listNavigableHeroIds } from '../helpers/HeroNavigationHelper';
import { WowCelebrationController } from '../wow/WowCelebrationController';
import { buildPersistentWowBanners } from '../wow/WowBannerBuilder';
import { DonationPromptController } from '../support/DonationPromptController';
import { filterBattleLogMessages } from './BattleLogFilter';
import { BattleLogRenderer } from './BattleLogRenderer';
import { BattleFloatingTextController } from './BattleFloatingTextController';
import { BattleImpactFeedbackController } from './BattleImpactFeedbackController';
import { BattleSkillVfxController } from './BattleSkillVfxController';
import { bindCampaignTooltip, hideCampaignTooltip } from './CampaignTooltipBinder';
import { bindMenuTooltips, hideMenuTooltip } from './MenuTooltipBinder';
import { mountNavArrowIcons } from '../assets/NavArrowPresentation';
import { hydratePanelIcons } from '../assets/PanelIconHydrator';
import { buildBattleIntermissionPayload } from './BattleVictoryDetector';
import { updateBattleAttemptBaseline } from './BattleAttemptRewardBaseline';
import { BattleVictoryOverlayRenderer } from './BattleVictoryOverlayRenderer';
import { BattleStripRenderer } from './BattleStripRenderer';
import { renderBattleStatsBody } from './BattleStatsPresentation';
import { StageProgressBarRenderer } from './StageProgressBarRenderer';
import { EquipPickerModalRenderer } from './EquipPickerModalRenderer';
import { GearSlotKey } from './GearPresentation';
import { HeroDetailModalRenderer, HeroDetailTab } from './HeroDetailModalRenderer';
import { shouldRenderHeroPanel } from './HeroPanelRenderPolicy';
import { InventoryModalHandlers, InventoryModalRenderer } from './InventoryModalRenderer';
import { resolveDefaultInventoryHeroId } from './InventoryGridPresentation';
import { StashModalRenderer } from './StashModalRenderer';
import { LootBatchModalRenderer } from './LootBatchModalRenderer';
import { LootModalRenderer } from './LootModalRenderer';
import { ModalController } from './ModalController';
import { SideDrawerController } from './SideDrawerController';
// OFFLINE PROGRESS DESATIVADO (2026-07):
// import {
//   buildIdleSummary,
//   loadPanelSnapshot,
//   seedPanelSnapshotIfMissing,
//   touchPanelSnapshot,
// } from './PanelStateSnapshot';
import { GamePreferences } from './GamePreferences';
import { SettingsModalRenderer } from './SettingsModalRenderer';
import { ShopModalRenderer } from './ShopModalRenderer';
import { UpgradeTreeModalRenderer } from './UpgradeTreeModalRenderer';
import { MetaLegacyModalRenderer } from './MetaLegacyModalRenderer';
import { AchievementsModalRenderer } from './AchievementsModalRenderer';
import { ToastController } from './ToastController';
import { RewardPresentationController } from '../delight/RewardPresentationController';
import { DestroyGearConfirmDialog } from './DestroyGearConfirmDialog';
import { AscendClassConfirmDialog } from './AscendClassConfirmDialog';
import { ImprovementResetConfirmDialog } from './ImprovementResetConfirmDialog';
import { DivineForgeConfirmDialog } from './DivineForgeConfirmDialog';
import { ImportSaveConfirmDialog } from './ImportSaveConfirmDialog';
import { DivineForgeModalRenderer } from './DivineForgeModalRenderer';
import { SkillCooldownDisplayAnimator, shouldAnimateBattleStripTimers } from './SkillCooldownDisplayAnimator';
import { DivineForgeFlow } from '../flows/DivineForgeFlow';
import {
  isSystemsMenuAvailable,
  listAvailableSystemsMenus,
  resolveCurrentSystemsMenu,
  systemsMenuFromModalViewType,
  type SystemsMenuAvailability,
  type SystemsMenuId,
} from '../flows/SystemsMenuNavigation';
import { renderSystemsMenuIconStrip } from './SystemsMenuIconPresentation';
import { InlineEquipController, InlineEquipHandlers } from '../gear/InlineEquipController';
import { bindGearDragDrop } from '../gear/GearDragDropBinder';
import { OnboardingController } from '../onboarding/OnboardingController';
import {
  isOnboardingComplete,
  MAP_TUTORIAL_STEP_IDS,
  OnboardingStepId,
  OnboardingUiContext,
  resolveOnboardingStep,
} from '../onboarding/OnboardingPolicy';
import { UiOverlayOrchestrator } from '../overlays/UiOverlayOrchestrator';
import { bindBattleChromeLayout } from '../layout/BattleChromeLayout';
import { detectPendingActSceneDto, detectSeasonFinaleEpilogueDto, detectPendingMissionSceneDto, actSceneDtoFromId } from '../../application/mappers/ActScenePresentationMapper';
import { ActSceneDto } from '../../application/dto/CampaignDto';

export class GameViewController {
  private state: GameStateDto | null = null;
  private readonly modalStack: ModalView[] = [];
  private readonly lootFlow = new LootFlowController();
  private readonly prefsController = new GamePreferencesController();
  private readonly autoBattleController = new AutoBattleController();
  private readonly gearMutations = new GearMutationQueue();
  private trackedSystemsMenuId: SystemsMenuId | null = null;
  private campaignModalOpen = false;
  private campaignEmbeddedActive = false;
  private embeddedCampaignLoadPromise: Promise<void> | null = null;
  private systemsIconsSignature = '';
  private readonly client: IGameClient;
  private refreshTimer: number | null = null;
  private contextInvalidated = false;
  // OFFLINE PROGRESS DESATIVADO (2026-07)
  // private idleSummaryShown = false;
  /** Bloqueia ticks em voo enquanto a pausa está sendo aplicada no servidor. */
  private pausingLoadout = false;
  /** Evita enfileirar TICK enquanto o anterior ainda não voltou (save lento). */
  private tickInFlight = false;
  private heroDrawerHeroId: string | null = null;

  private readonly campaignContextBtn: HTMLButtonElement;
  private readonly goldLabel: HTMLElement;
  private readonly chestLabel: HTMLElement;
  private readonly chestProgressLabel: HTMLElement;
  private readonly battleLog: HTMLElement;
  private readonly pauseLoadoutBtn: HTMLButtonElement;
  private readonly continueLoadoutBtn: HTMLButtonElement;
  private readonly pauseBattleBtn: HTMLButtonElement;
  private readonly resumeBattleBtn: HTMLButtonElement;
  private readonly openChestBtn: HTMLButtonElement;
  private readonly openAllChestsBtn: HTMLButtonElement;
    private readonly openInventoryBtn: HTMLButtonElement;
    private readonly openStashBtn: HTMLButtonElement;
    private readonly openForgeBtn: HTMLButtonElement;
    private readonly optimizeLoadoutBtn: HTMLButtonElement;
  private readonly openSettingsBtn: HTMLButtonElement;
  private readonly openCampaignBtn: HTMLButtonElement;
  private readonly openShopBtn: HTMLButtonElement;
  private readonly openUpgradesBtn: HTMLButtonElement;
  private readonly openAchievementsBtn: HTMLButtonElement;
  private readonly battlePauseOverlay: HTMLElement;
  private readonly appRoot: HTMLElement;
  private readonly battleStageEl: HTMLElement;
  private readonly battleFieldEl: HTMLElement;
  private readonly campCampaignMapRoot: HTMLElement;
  private readonly campCampaignMapBody: HTMLElement;
  private readonly wowCelebrationRoot: HTMLElement;
  private readonly wowCelebrationStage: HTMLElement;
  private readonly wowInboxRoot: HTMLElement;
  private readonly wowInboxPanel: HTMLElement;
  private readonly openWowInboxBtn: HTMLButtonElement;
  private readonly battleLogOverlayEl: HTMLElement;
  private readonly openBattleLogBtn: HTMLButtonElement;
  private readonly openBattleStatsBtn: HTMLButtonElement;
  private readonly openHeroesBtn: HTMLButtonElement;
  private readonly openFormationBtn: HTMLButtonElement;
  private readonly heroesContainerEl: HTMLElement;

  private readonly battleStripEl: HTMLElement;
  private readonly battleStrip: BattleStripRenderer;
  private readonly stageProgressBar: StageProgressBarRenderer;
  private readonly battleFloats: BattleFloatingTextController;
  private readonly battleImpacts: BattleImpactFeedbackController;
  private readonly battleSkillVfx: BattleSkillVfxController;
  private readonly victoryFlow: BattleVictoryFlow;
  private readonly battleStartFlow: BattleStartFlow;
  private readonly modal: ModalController;
  private readonly heroDrawer: SideDrawerController;
  private readonly inventoryModal: InventoryModalRenderer;
  private readonly stashModal: StashModalRenderer;
  private readonly heroDetailModal: HeroDetailModalRenderer;
  private readonly equipPickerModal: EquipPickerModalRenderer;
  private readonly lootModal: LootModalRenderer;
  private readonly lootBatchModal: LootBatchModalRenderer;
  private readonly settingsModal: SettingsModalRenderer;
  private readonly shopModal: ShopModalRenderer;
  private readonly upgradeTreeModal: UpgradeTreeModalRenderer;
  private readonly metaLegacyModal: MetaLegacyModalRenderer;
  private readonly achievementsModal: AchievementsModalRenderer;
  private readonly divineForgeModal: DivineForgeModalRenderer;
  private readonly toasts: ToastController;
  private readonly rewards: RewardPresentationController;
  private readonly destroyGearConfirmDialog: DestroyGearConfirmDialog;
  private readonly ascendClassConfirmDialog: AscendClassConfirmDialog;
  private readonly improvementResetConfirmDialog: ImprovementResetConfirmDialog;
  private readonly forgeConfirmDialog: DivineForgeConfirmDialog;
  private readonly importSaveConfirmDialog: ImportSaveConfirmDialog;
  private readonly donationPrompt: DonationPromptController;
  private readonly hud: GameHudController;
  private readonly wowCelebration: WowCelebrationController;
  private readonly battleLogPanel: BattleLogPanelController;
  private readonly battleStatsPanel: BattleStatsPanelController;
  private readonly battleLogRenderer = new BattleLogRenderer();
  private readonly skillCooldownAnimator = new SkillCooldownDisplayAnimator();
  private readonly musicController = new GameMusicController();
  private readonly sfxController = new GameSfxController();

  private readonly heroDetailFlow: HeroDetailFlow;
  private readonly shopFlow: ShopFlow;
  private readonly metaLegacyFlow: MetaLegacyFlow;
  private readonly achievementsFlow: AchievementsFlow;
  private readonly gearEquipFlow: GearEquipFlow;
  private readonly gearStorageFlow: GearStorageFlow;
  private readonly divineForgeFlow: DivineForgeFlow;
  private readonly chestLootFlow: ChestLootFlow;
  private readonly campaignFlow: CampaignFlow;
  private readonly actSceneFlow: ActSceneFlow;
  private readonly splashScreen: SplashScreenController;
  /** Só true após a splash. */
  private bootReady = false;
  private readonly partyFlow: PartyFlow;
  private readonly modalStackController: ModalStackController;
  private readonly inlineEquip = new InlineEquipController();
  private readonly onboarding = new OnboardingController();
  private readonly overlayOrchestrator = new UiOverlayOrchestrator();
  private onboardingSyncTimer = 0;

  private shownIntermissionKey: string | null = null;
  private intermissionResuming = false;
  /** Timer do delay antes de abrir CLEAR/DEFEAT (floats do golpe final). */
  private battleResultRevealTimer: number | null = null;
  private deferredRewardBaseline: GameStateDto | null = null;
  /** Hub no início da tentativa — overlay CLEAR/DEFEAT soma kills de todas as waves. */
  private battleAttemptBaseline: GameStateDto | null = null;
  private deferredSeasonFinaleEpilogueBaseline: GameStateDto | null = null;

  constructor(root: HTMLElement, client: IGameClient = getDefaultGameClient()) {
    this.client = client;

    const splashRoot =
      (root.querySelector('#splash-screen-root') as HTMLElement | null) ??
      (document.querySelector('#splash-screen-root') as HTMLElement | null);
    const splashImage =
      (root.querySelector('#splash-screen-image') as HTMLImageElement | null) ??
      (document.querySelector('#splash-screen-image') as HTMLImageElement | null);
    this.splashScreen = new SplashScreenController(
      splashRoot ?? document.createElement('div'),
      splashImage ?? document.createElement('img'),
    );

    this.campaignContextBtn = root.querySelector('#campaign-context-btn') as HTMLButtonElement;
    this.goldLabel = root.querySelector('#gold-label')!;
    this.chestLabel = root.querySelector('#chest-label')!;
    this.chestProgressLabel = root.querySelector('#chest-progress-label')!;
    this.battleLog = document.querySelector('#battle-log')!;
    this.openBattleLogBtn = root.querySelector('#open-battle-log-btn') as HTMLButtonElement;
    this.openBattleStatsBtn = root.querySelector('#open-battle-stats-btn') as HTMLButtonElement;
    this.openHeroesBtn = root.querySelector('#open-heroes-btn') as HTMLButtonElement;
    this.openFormationBtn = root.querySelector('#open-formation-btn') as HTMLButtonElement;
    this.pauseLoadoutBtn = root.querySelector('#pause-loadout-btn') as HTMLButtonElement;
    this.continueLoadoutBtn = root.querySelector('#continue-loadout-btn') as HTMLButtonElement;
    this.pauseBattleBtn = root.querySelector('#pause-battle-btn') as HTMLButtonElement;
    this.resumeBattleBtn = root.querySelector('#resume-battle-btn') as HTMLButtonElement;
    this.openChestBtn = root.querySelector('#open-chest-btn') as HTMLButtonElement;
    this.openAllChestsBtn = root.querySelector('#open-all-chests-btn') as HTMLButtonElement;
    this.openInventoryBtn = root.querySelector('#open-inventory-btn') as HTMLButtonElement;
    this.openStashBtn = root.querySelector('#open-stash-btn') as HTMLButtonElement;
    this.openForgeBtn = root.querySelector('#open-forge-btn') as HTMLButtonElement;
    this.optimizeLoadoutBtn = root.querySelector('#optimize-loadout-btn') as HTMLButtonElement;
    this.openSettingsBtn = root.querySelector('#open-settings-btn') as HTMLButtonElement;
    this.openCampaignBtn = root.querySelector('#open-campaign-btn') as HTMLButtonElement;
    this.openShopBtn = root.querySelector('#open-shop-btn') as HTMLButtonElement;
    this.openUpgradesBtn = root.querySelector('#open-upgrades-btn') as HTMLButtonElement;
    this.openAchievementsBtn = root.querySelector('#open-achievements-btn') as HTMLButtonElement;
    this.battlePauseOverlay = root.querySelector('#battle-pause-overlay') as HTMLElement;
    this.appRoot = (root.closest('#app') as HTMLElement | null) ?? root;
    this.battleStageEl = root.querySelector('.battle-stage') as HTMLElement;
    this.battleFieldEl = root.querySelector('.battle-field') as HTMLElement;
    this.campCampaignMapRoot = root.querySelector('#camp-campaign-map-root') as HTMLElement;
    this.campCampaignMapBody = root.querySelector('#camp-campaign-map-body') as HTMLElement;
    this.wowCelebrationRoot = root.querySelector('#wow-celebration-root') as HTMLElement;
    this.wowCelebrationStage = root.querySelector('#wow-celebration-stage') as HTMLElement;
    this.wowInboxRoot = root.querySelector('#wow-inbox-root') as HTMLElement;
    this.wowInboxPanel = root.querySelector('#wow-inbox-panel') as HTMLElement;
    this.openWowInboxBtn = root.querySelector('#open-wow-inbox-btn') as HTMLButtonElement;
    this.battleLogOverlayEl = document.querySelector('#battle-log-overlay') as HTMLElement;
    this.heroesContainerEl = root.querySelector('#heroes-container') as HTMLElement;

    this.battleStripEl = root.querySelector('.battle-strip') as HTMLElement;
    const battleFieldEl = root.querySelector('.battle-field') as HTMLElement;

    this.battleStrip = new BattleStripRenderer(
      this.heroesContainerEl,
      root.querySelector('#enemy-container')!,
      battleFieldEl,
      this.battleStripEl,
      root.querySelector('[data-strip-bg]')!,
      this.battleStripEl.querySelector('.strip-floor')!,
    );
    this.stageProgressBar = new StageProgressBarRenderer(
      root.querySelector('#stage-progress-root')!,
    );
    this.battleFloats = new BattleFloatingTextController(
      root.querySelector('#battle-float-layer')!,
      battleFieldEl,
    );
    this.battleImpacts = new BattleImpactFeedbackController(
      root.querySelector('#battle-float-layer')!,
      battleFieldEl,
    );
    this.battleSkillVfx = new BattleSkillVfxController(
      root.querySelector('#battle-float-layer')!,
      battleFieldEl,
    );
    this.victoryFlow = new BattleVictoryFlow(
      root.querySelector('#battle-victory-overlay')!,
      this.battleStripEl,
      new BattleVictoryOverlayRenderer(),
    );
    this.battleStartFlow = new BattleStartFlow(
      root.querySelector('#battle-victory-overlay')!,
      this.battleStripEl,
      new BattleVictoryOverlayRenderer(),
    );

    this.modal = new ModalController(
      root.querySelector('#modal-root')!,
      root.querySelector('#modal-title-main') ?? root.querySelector('#modal-title')!,
      root.querySelector('#modal-body')!,
    );

    this.heroDrawer = new SideDrawerController(
      root.querySelector('#hero-drawer-root')!,
      root.querySelector('#hero-drawer-title')!,
      root.querySelector('#hero-drawer-body')!,
    );

    this.inventoryModal = new InventoryModalRenderer();
    this.stashModal = new StashModalRenderer();
    this.heroDetailModal = new HeroDetailModalRenderer();
    this.equipPickerModal = new EquipPickerModalRenderer();
    this.lootModal = new LootModalRenderer();
    this.lootBatchModal = new LootBatchModalRenderer();
    this.settingsModal = new SettingsModalRenderer();
    this.shopModal = new ShopModalRenderer();
    this.upgradeTreeModal = new UpgradeTreeModalRenderer();
    this.metaLegacyModal = new MetaLegacyModalRenderer();
    this.achievementsModal = new AchievementsModalRenderer();
    this.divineForgeModal = new DivineForgeModalRenderer();
    this.toasts = new ToastController(root.querySelector('#toast-root')!);
    this.wowCelebration = new WowCelebrationController(
      this.wowCelebrationRoot,
      this.wowCelebrationStage,
      this.wowInboxRoot,
      this.wowInboxPanel,
      this.openWowInboxBtn,
    );
    this.actSceneFlow = new ActSceneFlow(
      root.querySelector('#act-scene-root') as HTMLElement,
      root.querySelector('#act-scene-stage') as HTMLElement,
      root.querySelector('#act-scene-backdrop') as HTMLElement,
    );
    this.rewards = new RewardPresentationController(this.wowCelebration);
    this.wowCelebration.setOverlayOrchestrator(this.overlayOrchestrator);
    this.wowCelebration.onIdle(() => {
      this.tryShowSeasonFinaleEpilogue();
    });
    this.overlayOrchestrator.onIdle(() => {
      this.tryShowSeasonFinaleEpilogue();
      if (this.state) {
        // Não chamar tryShowAutoActScene aqui: com previous=null qualquer cena
        // não vista vira "nova" e reentra no orquestrador (stack overflow).
        // O render() já faz o catch-up com previous correto.
        this.syncAutoBattleTimer();
      }
    });
    this.destroyGearConfirmDialog = new DestroyGearConfirmDialog(
      root.querySelector('#destroy-gear-confirm-root')!,
      root.querySelector('#destroy-confirm-body')!,
      root.querySelector('[data-destroy-confirm-accept]') as HTMLButtonElement,
    );
    this.forgeConfirmDialog = new DivineForgeConfirmDialog(
      root.querySelector('#forge-confirm-root')!,
      root.querySelector('#forge-confirm-title')!,
      root.querySelector('#forge-confirm-body')!,
      root.querySelector('[data-forge-confirm-accept]') as HTMLButtonElement,
    );
    this.ascendClassConfirmDialog = new AscendClassConfirmDialog(
      root.querySelector('#ascend-confirm-root')!,
      root.querySelector('#ascend-confirm-title')!,
      root.querySelector('#ascend-confirm-body')!,
      root.querySelector('[data-ascend-confirm-accept]') as HTMLButtonElement,
    );
    this.improvementResetConfirmDialog = new ImprovementResetConfirmDialog(
      root.querySelector('#improvement-reset-confirm-root')!,
      root.querySelector('#improvement-reset-confirm-title')!,
      root.querySelector('#improvement-reset-confirm-body')!,
      root.querySelector('[data-improvement-reset-confirm-accept]') as HTMLButtonElement,
    );
    this.importSaveConfirmDialog = new ImportSaveConfirmDialog(
      root.querySelector('#import-save-confirm-root')!,
      root.querySelector('#import-save-confirm-title')!,
      root.querySelector('#import-save-confirm-body')!,
      root.querySelector('[data-import-save-confirm-accept]') as HTMLButtonElement,
    );
    this.donationPrompt = new DonationPromptController(
      root.querySelector('#donation-prompt-root')!,
      root.querySelector('#donation-card-body')!,
      root.querySelector('#support-btn') as HTMLButtonElement,
    );
    mountNavArrowIcons(root);

    hydratePanelIcons(root);
    bindCampaignTooltip(this.campaignContextBtn);
    bindMenuTooltips();
    bindBattleChromeLayout(
      root.querySelector('.battle-combat-bar') as HTMLElement,
      root.querySelector('#app') as HTMLElement | null,
    );

    this.hud = new GameHudController(
      this.campaignContextBtn,
      this.goldLabel,
      this.chestLabel,
      this.chestProgressLabel,
      this.openHeroesBtn,
      this.openFormationBtn,
      this.openShopBtn,
      this.openInventoryBtn,
      this.openStashBtn,
      this.openForgeBtn,
      this.optimizeLoadoutBtn,
      this.openAllChestsBtn,
      this.openUpgradesBtn,
      this.openChestBtn,
      this.pauseBattleBtn,
      this.resumeBattleBtn,
      this.pauseLoadoutBtn,
      this.continueLoadoutBtn,
      this.openBattleStatsBtn,
    );

    this.battleLogPanel = new BattleLogPanelController(
      this.battleLogOverlayEl,
      this.openBattleLogBtn,
      document.querySelector('#battle-log-close') as HTMLButtonElement,
      { bindToggleButton: false },
    );
    this.battleStatsPanel = new BattleStatsPanelController(
      root.querySelector('#battle-stats-overlay') as HTMLElement,
      this.openBattleStatsBtn,
      root.querySelector('#battle-stats-close') as HTMLButtonElement,
      root.querySelector('#battle-stats-body') as HTMLElement,
    );
    this.heroDetailFlow = new HeroDetailFlow(
      this.client,
      this.heroDetailModal,
      this.toasts,
      this.rewards,
      this.ascendClassConfirmDialog,
      this.improvementResetConfirmDialog,
      (state) => this.afterHeroProgressionMutation(state),
      () => this.refreshHeroDetailViews(),
    );
    this.heroDetailFlow.setTabWillChangeListener((tab) => {
      if (tab !== 'sheet') {
        this.inlineEquip.close();
      }
    });

    this.shopFlow = new ShopFlow(
      this.client,
      this.toasts,
      this.rewards,
      (state) => this.render(state),
      () => this.refreshModalIfOpen(),
      () => this.enforceUpgradeGates(),
    );

    this.metaLegacyFlow = new MetaLegacyFlow(
      this.client,
      this.toasts,
      (state) => this.render(state),
      () => this.refreshModalIfOpen(),
    );

    this.achievementsFlow = new AchievementsFlow(
      this.client,
      this.toasts,
      (state) => this.render(state),
    );

    this.gearEquipFlow = new GearEquipFlow(
      this.client,
      this.gearMutations,
      this.toasts,
      () => this.state,
      (state) => this.afterGearMutation(state),
      (error) => this.onGearMutationFailed(error),
    );

    this.gearStorageFlow = new GearStorageFlow(
      this.client,
      this.gearMutations,
      this.toasts,
      this.destroyGearConfirmDialog,
      (state) => this.afterStorageMutation(state),
      (error) => this.onGearMutationFailed(error),
    );

    this.divineForgeFlow = new DivineForgeFlow(
      this.client,
      this.gearMutations,
      this.forgeConfirmDialog,
      this.toasts,
      this.rewards,
      (state) => this.afterForgeMutation(state),
      (error) => this.onGearMutationFailed(error),
    );

    this.campaignFlow = new CampaignFlow(this.client, this.modal);
    this.campaignFlow.setActSceneReader((scene) => {
      this.presentActScene(scene, { markViewedOnDismiss: false });
    });
    this.campaignFlow.setMapViewListener(() => this.handleCampaignMapViewChange());
    this.campaignFlow.setMissionStartedHandler((state) => {
      this.dismissMapTutorial();
      this.render(state);
      this.beginMissionBattleWithStart({ skipStartCue: true });
      void this.showBattleStatsSheet();
    });
    this.partyFlow = new PartyFlow(this.client);

    this.chestLootFlow = new ChestLootFlow(
      this.client,
      this.lootFlow,
      () => this.state,
      () => this.modal.isOpen(),
      (error) => this.handleFailedResponse(error),
      (state, options) => this.render(state, options),
      (gears) => this.handleLootReceived(gears),
      (view) => this.pushModal(view),
      () => this.modal.close('action'),
      () => this.modalStack,
      () => this.modalStack.pop(),
      () => this.refreshModalIfOpen(),
      () => this.prefsController.autoOpenChests,
    );

    this.modalStackController = new ModalStackController(
      this.modal,
      this.inventoryModal,
      this.stashModal,
      this.heroDetailFlow,
      this.equipPickerModal,
      this.lootModal,
      this.lootBatchModal,
      this.settingsModal,
      this.shopModal,
      this.upgradeTreeModal,
      this.metaLegacyModal,
      this.achievementsModal,
      this.divineForgeModal,
      this.shopFlow,
      this.metaLegacyFlow,
      this.achievementsFlow,
      this.divineForgeFlow,
      this.gearEquipFlow,
      this.gearStorageFlow,
      this.chestLootFlow,
      this.lootFlow,
      () => this.prefsController.preferences,
      (key, value) => this.handlePreferenceChange(key, value),
      () => {
        void this.openUpgradesModal();
      },
      (heroId, slot) => this.openEquipPickerFromSlot(heroId, slot),
      (gearId) => this.openEquipPickerFromGear(gearId),
      (gearIds) => {
        void this.equipRecommendedLoot(gearIds);
      },
      () => this.openStashModal('push'),
      () => this.openInventoryModal(),
      (heroId) => {
        const active = this.inlineEquip.getActiveSlot();
        if (active && active.heroId !== heroId) {
          this.inlineEquip.close();
        }
      },
      () => {
        void this.exportSaveBackup();
      },
      () => {
        void this.importSaveBackup();
      },
    );

    bindGearStorageActions(document, this.gearStorageFlow, () => this.state);

    bindGearDragDrop(root, {
      canEditGear: () => this.canEditGear(),
      canEditParty: () => this.canEditParty(),
      onEquip: (heroId, gearId) => {
        void this.gearEquipFlow.equip(heroId, gearId, { fromInventory: true });
      },
      onUnequip: (heroId, slot) => {
        void this.gearEquipFlow.unequip(heroId, slot, { fromInventory: true });
      },
      onMoveToStash: (gearId) => {
        void this.gearStorageFlow.moveToStash(gearId);
      },
      onMoveFromStash: (gearId) => {
        void this.gearStorageFlow.moveFromStash(gearId);
      },
      onMoveFromStashThenEquip: (gearId, heroId) => {
        void (async () => {
          await this.gearStorageFlow.moveFromStash(gearId);
          await this.gearEquipFlow.equip(heroId, gearId, { fromInventory: true });
        })();
      },
      onEquippedToStash: (heroId, slot, gearId) => {
        void (async () => {
          await this.gearEquipFlow.unequip(heroId, slot, { fromInventory: true });
          await this.gearStorageFlow.moveToStash(gearId);
        })();
      },
      onMoveEquippedGear: (source, target) => {
        void (async () => {
          await this.gearEquipFlow.unequip(source.heroId, source.slot, { fromInventory: true });
          await this.gearEquipFlow.equip(target.heroId, source.gearId, { fromInventory: true });
        })();
      },
      onDestroyGear: (source) => {
        if (source.kind !== 'inventory' && source.kind !== 'stash') return;
        if (!this.state) return;
        const gear =
          source.kind === 'stash'
            ? this.state.stash.find((entry) => entry.id === source.gearId)
            : this.state.inventory.find((entry) => entry.id === source.gearId);
        void this.gearStorageFlow.destroy(source.gearId, source.kind, gear);
      },
      onBuyAndEquipShopOffer: (offerId, heroId) => {
        void this.shopFlow.buyAndEquipOffer(offerId, heroId);
      },
      onPartySlotDrop: (heroId, targetIndex) => {
        void this.handlePartySlotDrop(heroId, targetIndex);
      },
      onPartyActiveToBench: (heroId) => {
        void this.handlePartyActiveToBench(heroId);
      },
      onPartyReorder: (fromIndex, toIndex) => {
        void this.handlePartyReorder(fromIndex, toIndex);
      },
    });

    this.prefsController.apply(this.state);
    this.syncMusicPreferences();
    this.syncSfxPreferences();
    this.bindHeroPanelDelegation();
    this.bindBattleStripDelegation();
    this.bindHeroDrawerNavigation();
    this.bindGearActionDelegation(this.modal.getBody(), () => this.modal.isOpen());
    this.bindGearActionDelegation(this.heroDrawer.getBody(), () => this.heroDrawer.isOpen());
    document.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest('[data-inventory-equip]') as HTMLElement | null;
      if (!target) return;
      const gearId = target.getAttribute('data-inventory-equip');
      const heroId = target.getAttribute('data-inventory-equip-hero');
      if (!gearId || !heroId) return;
      this.markGearActionPending(target);
      void this.gearEquipFlow.equip(heroId, gearId, { fromInventory: true });
    });

    this.pauseLoadoutBtn.addEventListener('click', () => {
      this.dismissOnboardingStep('pause-loadout');
      this.stopAutoBattle();
      void this.pauseForLoadout();
    });
    this.continueLoadoutBtn.addEventListener('click', () => {
      this.beginMissionBattleWithStart();
    });
    this.pauseBattleBtn.addEventListener('click', () => {
      void this.pauseBattle();
    });
    this.resumeBattleBtn.addEventListener('click', () => {
      void this.resumeBattle();
    });
    this.openChestBtn.addEventListener('click', () => {
      this.dismissOnboardingStep('first-chest');
      void this.chestLootFlow.openNextChest();
    });
    this.openAllChestsBtn.addEventListener('click', () => {
      void this.chestLootFlow.openAllChests();
    });
    this.openInventoryBtn.addEventListener('click', () => {
      void this.openSystemsSurface('inventory');
    });
    this.openStashBtn.addEventListener('click', () => {
      void this.openSystemsSurface('stash');
    });
    this.openForgeBtn.addEventListener('click', () => {
      void this.openSystemsSurface('forge');
    });
    this.optimizeLoadoutBtn.addEventListener('click', () => {
      if (!this.canEditParty()) {
        this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
        return;
      }
      void this.gearEquipFlow.optimizeLoadout();
    });
    this.openSettingsBtn.addEventListener('click', () => {
      void this.openSystemsSurface('settings');
    });
    this.openHeroesBtn.addEventListener('click', () => {
      this.dismissOnboardingStep('hero-points');
      void this.openSystemsSurface('heroes');
    });
    this.openFormationBtn.addEventListener('click', () => {
      void this.openSystemsSurface('formation');
    });
    this.openCampaignBtn.addEventListener('click', () => {
      void this.openSystemsSurface('campaign');
    });
    this.campaignContextBtn.addEventListener('click', () => {
      hideCampaignTooltip();
      hideMenuTooltip();
      void this.openSystemsSurface('campaign');
    });
    this.openShopBtn.addEventListener('click', () => {
      void this.openSystemsSurface('shop');
    });
    this.openUpgradesBtn.addEventListener('click', () => {
      this.dismissOnboardingStep('first-upgrade');
      void this.openSystemsSurface('upgrades');
    });
    this.openAchievementsBtn.addEventListener('click', () => {
      void this.openSystemsSurface('achievements');
    });
    this.openBattleLogBtn.addEventListener('click', () => {
      void this.openSystemsSurface('log');
    });
    this.openBattleStatsBtn.addEventListener('click', () => {
      void this.openSystemsSurface('stats');
    });

    // Pausa auto-batalha com aba oculta (evita backlog de TICK).
    document.addEventListener('visibilitychange', () => {
      if (this.contextInvalidated) return;
      if (document.hidden) {
        this.stopAutoBattle();
        this.musicController.onVisibilityHidden();
        return;
      }
      this.musicController.onVisibilityVisible();
      this.syncAutoBattleTimer();
      if (this.state) {
        this.syncGameMusic(this.state);
      }
    });

    this.musicController.bindUnlock();
    this.sfxController.bindUnlock();
    this.sfxController.bindUiClicks(document, {
      active: () => this.bootReady && !this.contextInvalidated,
    });
  }

  async init(): Promise<void> {
    const splashDone = this.splashScreen.play();

    try {
      await this.refresh();
    } catch {
      this.handleContextInvalidated();
      await splashDone.catch(() => undefined);
      this.splashScreen.dismissImmediate();
      return;
    }

    if (this.contextInvalidated) {
      await splashDone.catch(() => undefined);
      this.splashScreen.dismissImmediate();
      return;
    }

    // Splash cobre o painel enquanto o estado carrega; só então inicia o jogo.
    await splashDone;
    this.beginPostSplashBoot();

    if (this.isCampHubOpen(this.state) || this.state?.battlePaused) {
      this.syncLoadoutPauseBanner(this.state!);
    }

    this.syncAutoBattleTimer();

    this.refreshTimer = window.setInterval(() => {
      void this.refresh();
    }, 5000);
  }

  /** Libera tutorial/Wow/cenas e o loop só depois da splash. */
  private beginPostSplashBoot(): void {
    if (this.bootReady) return;
    this.bootReady = true;

    if (!this.state) return;

    this.syncPersistentWowInbox(this.state);
    this.syncOnboarding(this.state);
    // previous=null para detectar cena pendente da abertura (ex. Ato I).
    this.tryShowAutoActScene(null, this.state);
  }

  private enforceUpgradeGates(): void {
    const wasAutoBattle = this.prefsController.autoBattleEnabled;
    this.prefsController.enforceGates(this.state);
    if (wasAutoBattle !== this.prefsController.autoBattleEnabled) {
      this.syncAutoBattleTimer();
    }
  }

  private handlePreferenceChange<K extends keyof GamePreferences>(
    key: K,
    value: GamePreferences[K],
  ): void {
    const result = this.prefsController.update(key, value, this.state);
    if (!result.applied) {
      this.toasts.show('Desbloqueie esta automação em Runas', 'info');
      if (this.modal.isOpen() && this.modalStack[this.modalStack.length - 1]?.type === 'settings') {
        this.renderModalTop();
      }
      return;
    }

    if (key === 'uiTheme') {
      if (this.modal.isOpen() && this.modalStack[this.modalStack.length - 1]?.type === 'settings') {
        this.renderModalTop();
      }
      return;
    }

    if (key === 'musicEnabled' || key === 'musicVolume') {
      this.syncMusicPreferences();
      if (this.state) {
        this.syncGameMusic(this.state);
      }
      if (this.modal.isOpen() && this.modalStack[this.modalStack.length - 1]?.type === 'settings') {
        this.renderModalTop();
      }
      return;
    }

    if (key === 'sfxEnabled' || key === 'sfxVolume') {
      this.syncSfxPreferences();
      if (this.modal.isOpen() && this.modalStack[this.modalStack.length - 1]?.type === 'settings') {
        this.renderModalTop();
      }
      return;
    }

    if (key === 'autoOpenChests' && value === true) {
      this.chestLootFlow.scheduleAutoOpenChests();
    }

    if (key === 'logFilterImportant') {
      this.battleLogRenderer.reset();
    }

    if (result.autoBattleChanged) {
      this.syncAutoBattleTimer();
    }

    if (this.state) {
      this.render(this.state);
    }

    if (this.modal.isOpen() && this.modalStack[this.modalStack.length - 1]?.type === 'settings') {
      this.renderModalTop();
    }
  }

  /** Hub do acampamento (`loadoutEditOpen`) — overlay ACAMPAMENTO, sem combate ativo. */
  private isCampHubOpen(state: GameStateDto | null = this.state): boolean {
    return Boolean(state?.loadoutEditOpen);
  }

  private syncMusicPreferences(): void {
    this.musicController.setPreferences({
      enabled: this.prefsController.musicEnabled,
      volume: this.prefsController.musicVolume,
    });
  }

  private syncSfxPreferences(): void {
    this.sfxController.setPreferences({
      enabled: this.prefsController.sfxEnabled,
      volume: this.prefsController.sfxVolume,
    });
  }

  private syncGameMusic(state: GameStateDto): void {
    const active = this.bootReady && !this.splashScreen.isActive() && !document.hidden;
    const track = resolveGameMusicTrack(state);
    this.musicController.sync(track, { active });
  }

  /** Missão pronta para iniciar (mapa → START → restart). */
  private isManualLoadoutPause(state: GameStateDto | null = this.state): boolean {
    return Boolean(state?.loadoutEditOpen && state?.phaseRestartOnResume);
  }

  private isAdvanceBlocked(state: GameStateDto | null = this.state): boolean {
    if (this.splashScreen.isActive()) return true;
    if (this.overlayOrchestrator.isBusy()) return true;
    if (this.onboarding.isActive()) return true;
    if (this.victoryFlow.isBlockingAdvance()) return true;
    if (this.battleStartFlow.isBlockingAdvance()) return true;
    if (this.wowCelebration.isBlockingAdvance()) return true;
    if (this.actSceneFlow.isBlocking()) return true;
    if (this.pausingLoadout) return true;
    if (state?.battlePaused) return true;
    return this.isCampHubOpen(state);
  }

  private openSettingsModal(): void {
    if (this.contextInvalidated) return;
    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    this.trackedSystemsMenuId = 'settings';
    this.campaignModalOpen = false;
    this.modalStack.length = 0;
    this.pushModal({ type: 'settings' });
    this.syncSystemsNavChrome();
  }

  private downloadSaveBackupFile(contents: string, fileName: string): void {
    const blob = new Blob([contents], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private async exportSaveBackup(): Promise<void> {
    if (this.contextInvalidated) return;
    const response = await this.client.send({ type: 'EXPORT_SAVE_BACKUP' });
    if (!response.ok) {
      this.toasts.show(response.error, 'info');
      return;
    }
    if (!response.backupFile || !response.backupFileName) {
      this.toasts.show('Falha ao gerar backup', 'info');
      return;
    }
    this.downloadSaveBackupFile(response.backupFile, response.backupFileName);
    this.toasts.show('Save exportado', 'info');
  }

  private async importSaveBackup(): Promise<void> {
    if (this.contextInvalidated) return;

    const confirmed = await this.importSaveConfirmDialog.open();
    if (!confirmed) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sidehero,text/plain';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        void (async () => {
          const backupFile = typeof reader.result === 'string' ? reader.result : '';
          if (!backupFile.trim()) {
            this.toasts.show('Arquivo de backup vazio', 'info');
            return;
          }

          const response = await this.client.send({
            type: 'IMPORT_SAVE_BACKUP',
            backupFile,
          });
          if (!response.ok) {
            this.toasts.show(response.error, 'info');
            return;
          }

          this.render(response.state, { previousState: this.state });
          this.toasts.show('Save importado', 'info');
          if (this.modal.isOpen() && this.modalStack[this.modalStack.length - 1]?.type === 'settings') {
            this.renderModalTop();
          }
        })();
      };
      reader.onerror = () => {
        this.toasts.show('Não foi possível ler o arquivo', 'info');
      };
      reader.readAsText(file);
    });

    input.click();
  }

  private async openCampaignModal(): Promise<void> {
    if (this.contextInvalidated) return;

    this.dismissOnboardingStep('open-campaign');
    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    this.hideEmbeddedCampaignMap();
    this.modalStack.length = 0;
    this.trackedSystemsMenuId = 'campaign';
    this.campaignModalOpen = true;
    const modalBody = this.modal.open('Mapa', () => {
      this.campaignModalOpen = false;
      if (this.trackedSystemsMenuId === 'campaign') {
        this.trackedSystemsMenuId = null;
      }
      this.syncSystemsNavChrome();
      if (this.state) {
        this.syncEmbeddedCampaignMap(this.state);
        this.syncOnboarding(this.state);
      }
    });
    this.modal.setBackVisible(false);
    this.syncSystemsNavChrome();
    await this.campaignFlow.open(
      { mode: 'modal', body: modalBody, header: null },
      (state) => this.render(state),
    );
  }

  private async openShopModal(): Promise<void> {
    if (this.contextInvalidated) return;
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para usar a loja', 'info');
      return;
    }

    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    const response = await this.client.send({ type: 'GET_SHOP_OFFERS' });
    if (!response.ok) {
      this.handleFailedResponse(response.error);
      return;
    }
    this.shopFlow.state.offers = response.shopOffers ?? [];
    this.shopFlow.state.activeShop = response.activeShop ?? null;
    if (typeof response.shopRefreshCost === 'number') {
      this.shopFlow.state.refreshCost = response.shopRefreshCost;
    }
    if (typeof response.canAffordShopRefresh === 'boolean') {
      this.shopFlow.state.canAffordRefresh = response.canAffordShopRefresh;
    }
    if (typeof response.shopRefreshUnlocked === 'boolean') {
      this.shopFlow.state.shopRefreshUnlocked = response.shopRefreshUnlocked;
    }
    if (typeof response.shopRefreshRemaining === 'number') {
      this.shopFlow.state.shopRefreshRemaining = response.shopRefreshRemaining;
    }
    const state = response.state;

    this.state = state;
    this.trackedSystemsMenuId = 'shop';
    this.campaignModalOpen = false;
    this.modalStack.length = 0;
    this.pushModal({ type: 'shop' });
    this.syncSystemsNavChrome();
  }

  private async openUpgradesModal(): Promise<void> {
    if (this.contextInvalidated) return;

    this.dismissOnboardingStep('first-upgrade');
    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    const response = await this.client.send({ type: 'GET_UPGRADE_TREE' });
    if (!response.ok) {
      this.handleFailedResponse(response.error);
      return;
    }
    this.shopFlow.state.upgradeNodes = response.upgradeNodes ?? [];
    const state = response.state;

    this.state = state;
    this.upgradeTreeModal.beginSession();
    this.trackedSystemsMenuId = 'upgrades';
    this.campaignModalOpen = false;
    this.modalStack.length = 0;
    this.pushModal({ type: 'upgrades' });
    this.syncSystemsNavChrome();
  }

  private async openAchievementsModal(): Promise<void> {
    if (this.contextInvalidated) return;

    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    const state = await this.achievementsFlow.loadList();
    if (!state) return;

    this.state = state;
    this.trackedSystemsMenuId = 'achievements';
    this.campaignModalOpen = false;
    this.modalStack.length = 0;
    this.pushModal({ type: 'achievements' });
    this.syncSystemsNavChrome();
  }

  private syncAutoBattleTimer(): void {
    // Sem missão ativa (hub), não dispara ticks — combate só via mapa → START.
    if (!this.state?.phaseRun || this.state.canEditParty) {
      this.stopAutoBattle();
      return;
    }
    if (this.prefsController.autoBattleEnabled && !this.isAdvanceBlocked()) {
      this.stopAutoBattle();
      this.startAutoBattle();
      return;
    }
    this.stopAutoBattle();
  }

  private startAutoBattle(): void {
    if (this.contextInvalidated || this.isAdvanceBlocked()) return;
    if (document.hidden) return;
    this.autoBattleController.restart(
      this.prefsController.getAutoBattleIntervalMs(this.state),
      () => {
        void this.tick();
      },
    );
  }

  private stopAutoBattle(): void {
    this.autoBattleController.stop();
  }

  private async refresh(_options: { /* checkIdleSummary?: boolean */ } = {}): Promise<void> {
    if (this.contextInvalidated) return;
    if (this.pausingLoadout) return;
    if (
      this.state &&
      !this.state.canEditParty &&
      !this.isCampHubOpen(this.state)
    ) {
      return;
    }
    if (this.modal.isOpen() && this.isCampHubOpen(this.state)) {
      return;
    }

    const response = await this.client.send({ type: 'GET_STATE' });
    if (!response.ok) {
      this.handleFailedResponse(response.error);
      return;
    }

    this.render(response.state);
    // OFFLINE PROGRESS DESATIVADO (2026-07)
    // this.render(response.state, { checkIdleSummary: options.checkIdleSummary });
  }

  private handleFailedResponse(error?: string): void {
    if (error) {
      this.toasts.show(error, 'info');
    }
  }

  private handleContextInvalidated(): void {
    if (this.contextInvalidated) return;
    this.contextInvalidated = true;
    this.modalStack.length = 0;
    this.lootFlow.reset();

    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.stopAutoBattle();

    try {
      this.closeHeroDrawer();
      this.modal.close('action');
    } catch {
      // painel já desconectado
    }

    const app = document.getElementById('app');
    if (!app || app.querySelector('.context-invalid-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'context-invalid-banner';
    banner.innerHTML = `
      <strong>Falha ao carregar</strong>
      <p>Recarregue a página para tentar de novo.</p>
      <button type="button" class="context-reload-btn">Recarregar página</button>
    `;
    banner.querySelector('.context-reload-btn')?.addEventListener('click', () => {
      window.top?.location.reload();
    });
    app.prepend(banner);
  }

  private async pauseForLoadout(): Promise<void> {
    if (this.contextInvalidated) return;
    if (this.isAdvanceBlocked() && !this.state?.battlePaused) return;

    this.stopAutoBattle();
    this.pausingLoadout = true;

    try {
      const response = await this.client.send({ type: 'PAUSE_FOR_LOADOUT' });
      if (!response.ok) {
        this.handleFailedResponse(response.error);
        return;
      }

      this.render(response.state);
      this.toasts.show('No acampamento — ajuste sua equipe', 'info');
    } finally {
      this.pausingLoadout = false;
    }
  }

  private async pauseBattle(): Promise<void> {
    if (this.contextInvalidated || this.state?.battlePaused) return;
    if (this.isCampHubOpen(this.state)) return;

    this.stopAutoBattle();
    this.skillCooldownAnimator.setCombatActive(false);
    this.battleStrip.freezeTimersVisual();
    if (this.state) {
      this.syncLoadoutPauseBanner({ ...this.state, battlePaused: true });
    }

    const response = await this.client.send({ type: 'PAUSE_BATTLE' });
    if (!response.ok) {
      this.handleFailedResponse(response.error);
      return;
    }

    this.render(response.state);
    this.toasts.show('Batalha pausada', 'info');
  }

  private async resumeBattle(): Promise<void> {
    if (!this.state?.battlePaused) return;

    const response = await this.client.send({ type: 'RESUME_BATTLE' });
    if (!response.ok) {
      this.handleFailedResponse(response.error);
      return;
    }

    this.render(response.state);
    this.syncAutoBattleTimer();
    this.toasts.show('Batalha retomada', 'info');
  }

  private beginMissionBattleWithStart(options?: { skipStartCue?: boolean }): void {
    if (!this.isManualLoadoutPause(this.state)) return;
    if (this.battleStartFlow.isActive() || this.victoryFlow.isActive()) return;

    this.stopAutoBattle();
    this.hideBattlePauseOverlay();

    if (options?.skipStartCue) {
      void this.continueFromLoadoutPause();
      return;
    }

    this.battleStartFlow.show(() => {
      void this.continueFromLoadoutPause();
    });
  }

  private async continueFromLoadoutPause(): Promise<void> {
    if (!this.isManualLoadoutPause(this.state)) return;

    const response = await this.client.send({ type: 'TICK', restartCurrentPhase: true });
    if (!response.ok) {
      this.handleFailedResponse(response.error);
      return;
    }

    this.render(response.state);
    this.showCombatFloats(response.combatFloats, response.combatSkillVfx);
    this.syncAutoBattleTimer();
  }

  private async resumeCombatIntermission(): Promise<void> {
    if (this.intermissionResuming) return;
    this.intermissionResuming = true;

    try {
      const response = await this.client.send({ type: 'RESUME_COMBAT_INTERMISSION' });
      if (!response.ok) {
        this.handleFailedResponse(response.error);
        return;
      }

      this.clearBattleResultRevealTimer();
      this.shownIntermissionKey = null;
      this.render(response.state);
      this.showCombatFloats(response.combatFloats, response.combatSkillVfx);
      this.flushDeferredVictoryRewards();
      this.tryShowSeasonFinaleEpilogueAfterCelebration();
      this.tryShowPendingMissionScene();
      this.syncAutoBattleTimer();
    } finally {
      this.intermissionResuming = false;
    }
  }

  private flushDeferredVictoryRewards(): void {
    const baseline = this.deferredRewardBaseline;
    this.deferredRewardBaseline = null;
    if (!baseline || !this.state) return;

    this.rewards.celebratePhaseMilestoneRewards(baseline, this.state);
  }

  private tryShowSeasonFinaleEpilogueAfterCelebration(): void {
    if (this.overlayOrchestrator.isBusy() || this.wowCelebration.isBlockingAdvance()) return;
    this.tryShowSeasonFinaleEpilogue();
  }

  private tryShowPendingMissionScene(): void {
    if (!this.state) return;
    if (this.overlayOrchestrator.isBusy() || this.actSceneFlow.isBlocking()) return;
    if (this.wowCelebration.isBlockingAdvance()) return;

    const scene = detectPendingMissionSceneDto(this.state.campaignProgress);
    if (!scene) return;

    this.presentActScene(scene, {
      markViewedOnDismiss: true,
      onDismiss: () => {
        void this.markActSceneViewed(scene.id);
      },
    });
  }

  private tryShowSeasonFinaleEpilogue(): void {
    const previous = this.deferredSeasonFinaleEpilogueBaseline;
    if (!previous || !this.state) return;

    if (this.overlayOrchestrator.isBusy() || this.actSceneFlow.isBlocking()) {
      return;
    }

    const scene = detectSeasonFinaleEpilogueDto(
      previous.campaignProgress,
      this.state.campaignProgress,
    );
    if (!scene) {
      this.deferredSeasonFinaleEpilogueBaseline = null;
      return;
    }

    this.deferredSeasonFinaleEpilogueBaseline = null;
    this.presentActScene(scene, {
      markViewedOnDismiss: true,
      onDismiss: () => {
        void this.markActSceneViewed(scene.id);
      },
    });
  }

  private presentActScene(
    scene: ActSceneDto,
    options: { markViewedOnDismiss?: boolean; onDismiss?: () => void } = {},
  ): void {
    this.overlayOrchestrator.request('act_scene', scene.id, () => {
      this.stopAutoBattle();
      this.actSceneFlow.show(scene, {
        markViewedOnDismiss: options.markViewedOnDismiss,
        onDismiss: () => {
          this.overlayOrchestrator.release('act_scene', scene.id);
          options.onDismiss?.();
          this.syncAutoBattleTimer();
        },
      });
    });
  }

  private buildIntermissionKey(state: GameStateDto): string | null {
    if (!state.combatIntermission) return null;
    const wave = state.phaseRun?.waveIndex ?? 'none';
    return `${state.combatIntermission.variant}:${state.combatIntermission.clearedPhaseId}:${wave}`;
  }

  private showCombatIntermissionOverlay(
    previous: GameStateDto | null,
    state: GameStateDto,
  ): void {
    if (!state.combatIntermission || this.victoryFlow.isActive() || this.intermissionResuming) {
      return;
    }

    const key = this.buildIntermissionKey(state);
    if (!key || key === this.shownIntermissionKey) {
      return;
    }

    const payload = buildBattleIntermissionPayload(
      state.combatIntermission,
      state,
      previous,
      this.battleAttemptBaseline,
    );
    if (
      payload.variant === 'phase-clear' &&
      previous &&
      (payload.milestoneVictory?.isMilestone || payload.seasonCompleted)
    ) {
      this.deferredRewardBaseline = previous;
    }
    if (payload.seasonCompleted && previous) {
      this.deferredSeasonFinaleEpilogueBaseline = previous;
    }

    this.overlayOrchestrator.request('battle_result', key, () => {
      if (this.victoryFlow.isActive() || this.shownIntermissionKey === key) {
        this.overlayOrchestrator.release('battle_result', key, { notifyIdle: false });
        return;
      }
      this.shownIntermissionKey = key;
      this.stopAutoBattle();

      const presentResult = () => {
        this.battleResultRevealTimer = null;
        if (this.victoryFlow.isActive()) return;
        this.victoryFlow.show(payload, () => {
          this.overlayOrchestrator.release('battle_result', key);
          void this.resumeCombatIntermission();
        });
      };

      const delayReveal =
        payload.variant === 'phase-clear' || payload.variant === 'defeat';
      if (!delayReveal) {
        presentResult();
        return;
      }

      this.clearBattleResultRevealTimer();
      this.battleResultRevealTimer = globalThis.setTimeout(
        presentResult,
        BATTLE_RESULT_REVEAL_DELAY_MS,
      );
    });
  }

  private clearBattleResultRevealTimer(): void {
    if (this.battleResultRevealTimer === null) return;
    globalThis.clearTimeout(this.battleResultRevealTimer);
    this.battleResultRevealTimer = null;
  }

  private async tick(
    options: { restartCurrentPhase?: boolean } = {},
  ): Promise<void> {
    if (this.chestLootFlow.openingChests) return;
    if (!options.restartCurrentPhase && this.isAdvanceBlocked()) return;
    if (this.tickInFlight) return;

    this.tickInFlight = true;
    try {
      const response = await this.client.send({
        type: 'TICK',
        ticks: 1,
        restartCurrentPhase: options.restartCurrentPhase,
      });
      if (!response.ok) {
        this.handleFailedResponse(response.error);
        return;
      }

      if (!options.restartCurrentPhase && this.isAdvanceBlocked(response.state)) {
        return;
      }

      if (
        !options.restartCurrentPhase &&
        this.isManualLoadoutPause(this.state) &&
        !this.isManualLoadoutPause(response.state)
      ) {
        return;
      }

      this.render(response.state, { previousState: this.state });
      this.showCombatFloats(response.combatFloats, response.combatSkillVfx);

      if (response.achievementUpdates?.length) {
        this.rewards.celebrateAchievementUpdates(response.achievementUpdates);
      }
    } finally {
      this.tickInFlight = false;
    }
  }

  private showCombatFloats(
    combatFloats?: CombatFloatingEventDto[],
    combatSkillVfx?: CombatSkillVfxDto[],
  ): void {
    if (!combatFloats?.length && !combatSkillVfx?.length) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (combatSkillVfx?.length) {
          this.battleSkillVfx.show(combatSkillVfx);
        }
        if (combatFloats?.length) {
          this.battleFloats.show(combatFloats);
          this.battleImpacts.show(combatFloats);
        }
      });
    });
  }

  private async handleLootReceived(gears: GearDto[]): Promise<void> {
    if (gears.length === 1) {
      await this.rewards.celebrateLoot(gears[0]);
    } else if (gears.length > 1) {
      this.rewards.celebrateBatchLoot(gears);
    }

    if (!this.state?.canEditParty) {
      return;
    }

    const flags = getFeatureFlags(this.state);
    if (this.prefsController.autoEquipLoot && flags.autoEquipLoot) {
      await this.gearEquipFlow.optimizeLoadout(
        gears.map((gear) => gear.id),
        {
          fromLoot: true,
          silent: flags.autoEquipSilent,
        },
      );
    }
  }

  private async equipRecommendedLoot(gearIds: string[]): Promise<void> {
    await this.gearEquipFlow.optimizeLoadout(gearIds);
    this.chestLootFlow.closeLootBatchModal();
  }

  private afterStorageMutation(state: GameStateDto): void {
    this.render(state);
    this.refreshHeroDrawerIfOpen();
    this.refreshModalIfOpen();
  }

  private afterForgeMutation(state: GameStateDto): void {
    this.divineForgeModal.clearAfterFuse();
    this.divineForgeModal.clearAfterSalvage();
    this.afterStorageMutation(state);
  }

  private canEditGear(): boolean {
    return this.canEditParty();
  }

  private canEditParty(): boolean {
    return Boolean(this.state?.canEditParty || this.isCampHubOpen(this.state));
  }

  private syncInlineEquipHosts(): void {
    if (!this.state) return;

    const handlers: InlineEquipHandlers = {
      onSelectGear: (heroId, gearId) => {
        void this.gearEquipFlow.equip(heroId, gearId, { fromInventory: true });
      },
      onSelectHero: (heroId, gearId) => {
        void this.gearEquipFlow.equip(heroId, gearId, { fromInventory: true });
      },
      onUnequip: (heroId, slot) => {
        void this.gearEquipFlow.unequip(heroId, slot, { fromInventory: true });
      },
      onSortChange: () => this.refreshInlineEquipViews(),
      onUpgradesOnlyChange: () => this.refreshInlineEquipViews(),
      onClose: () => {
        this.inlineEquip.close();
        this.refreshInlineEquipViews();
      },
    };

    document.querySelectorAll('[data-inline-equip-host]').forEach((host) => {
      if (
        this.heroDrawer.isOpen() &&
        this.heroDrawer.getBody().contains(host) &&
        this.heroDetailModal.getActiveTab() !== 'sheet'
      ) {
        return;
      }

      this.inlineEquip.render(host as HTMLElement, this.state!, handlers);
    });
  }

  private buildInventoryHandlers(onRefresh: () => void): InventoryModalHandlers {
    return {
      onEquipGear: (gearId, heroId) => {
        void this.gearEquipFlow.equip(heroId, gearId, { fromInventory: true });
      },
      onUnequipGear: (heroId, slot) => {
        void this.gearEquipFlow.unequip(heroId, slot, { fromInventory: true });
      },
      onSlotClick: (heroId, slot) => {
        this.openEquipPickerFromSlot(heroId, slot);
      },
      onSortChange: onRefresh,
      onHeroChange: () => {},
      onUpgradesOnlyChange: onRefresh,
      onOptimizeLoadout: () => {
        void this.gearEquipFlow.optimizeLoadout(undefined, { fromInventory: true });
      },
      onOpenStash: () => this.openStashModal('push'),
    };
  }

  private mountHeroEmbeddedInventory(host: HTMLElement, heroId: string): void {
    if (!this.state || this.heroDetailModal.getActiveTab() !== 'sheet') return;

    this.inventoryModal.renderEmbedded(
      host,
      this.state,
      heroId,
      this.buildInventoryHandlers(() => this.refreshHeroDrawerIfOpen()),
      {
        showOptimize: false,
        inlineActiveSlot: this.inlineEquip.getActiveSlot(),
        canEditGear: this.canEditGear(),
      },
    );
  }

  private bindHeroDetailDrawer(container: HTMLElement, heroId: string): void {
    const activeSlot = this.inlineEquip.getActiveSlot();
    this.heroDetailModal.setInlineActiveSlot(
      activeSlot?.heroId === heroId ? activeSlot : null,
    );
    this.heroDetailFlow.bindToModal(container, this.state!, heroId, {
      onSlotClick: (id, slot) => this.openEquipPickerFromSlot(id, slot),
      mountInventory: (host) => this.mountHeroEmbeddedInventory(host, heroId),
    });
  }

  private refreshInlineEquipViews(): void {
    this.refreshHeroDrawerIfOpen();
    this.refreshModalIfOpen();
  }

  private afterGearMutation(state: GameStateDto): void {
    const topView = this.modalStack[this.modalStack.length - 1];
    if (
      topView?.type === 'loot-reveal' ||
      topView?.type === 'loot-batch'
    ) {
      this.modalStack.pop();
    }

    const lootRevealPending =
      topView?.type === 'loot-reveal' && this.lootFlow.hasQueued();
    const shouldCloseModal = this.modalStack.length === 0;
    const previousState = this.state;

    this.inlineEquip.close();
    this.render(state, { previousState });
    this.refreshHeroDrawerIfOpen();
    this.refreshModalIfOpen();

    if (lootRevealPending) {
      this.chestLootFlow.advanceLootQueue();
      return;
    }

    if (shouldCloseModal) {
      this.modal.close('action');
    }
  }

  private onGearMutationFailed(error?: string): void {
    this.handleFailedResponse(error);
    this.refreshHeroDrawerIfOpen();
    this.refreshModalIfOpen();
  }

  private afterHeroProgressionMutation(state: GameStateDto): void {
    this.render(state);
    this.refreshHeroDetailViews();
  }

  private bindBattleStripDelegation(): void {
    this.heroesContainerEl.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest('[data-hero-battle-open]') as HTMLElement | null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      const heroId = target.getAttribute('data-hero-battle-open');
      if (heroId) {
        this.openHeroDrawer(heroId);
      }
    });
  }

  private bindHeroDrawerNavigation(): void {
    const root = this.heroDrawer.getBody().closest('#hero-drawer-root');
    if (!root) return;

    root.querySelector('[data-hero-drawer-prev]')?.addEventListener('click', (event) => {
      event.preventDefault();
      this.navigateHeroDrawer(-1);
    });

    root.querySelector('[data-hero-drawer-next]')?.addEventListener('click', (event) => {
      event.preventDefault();
      this.navigateHeroDrawer(1);
    });
  }

  private navigateHeroDrawer(direction: -1 | 1): void {
    if (!this.state || !this.heroDrawerHeroId) return;
    const navigation = getHeroNavigation(this.state, this.heroDrawerHeroId);
    const nextId = direction < 0 ? navigation.prevId : navigation.nextId;
    if (!nextId) return;
    this.openHeroDrawer(nextId, this.heroDetailModal.getActiveTab());
  }

  private openHeroDrawer(heroId: string, tab: HeroDetailTab = 'sheet'): void {
    if (this.modal.isOpen()) {
      this.modalStack.length = 0;
      this.modal.close('action');
    }

    if (this.heroDrawerHeroId !== heroId) {
      this.inlineEquip.close();
    }

    const hero = this.state?.heroes.find((entry) => entry.id === heroId);
    if (hero?.hasUnspentPoints) {
      this.dismissOnboardingStep('hero-points');
    }

    this.heroDrawerHeroId = heroId;

    void this.heroDetailFlow.prepareOpen(heroId, tab).then(() => {
      if (!this.state) return;
      const hero = this.state.heroes.find((entry) => entry.id === heroId);
      const navigation = getHeroNavigation(this.state, heroId);
      const container = this.heroDrawer.prepare(hero?.name ?? 'Herói', (reason) => {
        if (reason !== 'action') {
          this.heroDrawerHeroId = null;
        }
      });

      this.heroDrawer.setNavVisible({
        prev: navigation.prevId !== null,
        next: navigation.nextId !== null,
      });

      this.bindHeroDetailDrawer(container, heroId);
      this.syncInlineEquipHosts();
      this.syncSystemsNavChrome();
    });
  }

  private closeHeroDrawer(): void {
    this.heroDrawerHeroId = null;
    this.heroDrawer.close('action');
    if (this.trackedSystemsMenuId === 'heroes' || this.trackedSystemsMenuId === 'inventory') {
      this.trackedSystemsMenuId = null;
    }
    this.syncSystemsNavChrome();
  }

  private isCampOnlyModal(type: ModalView['type']): boolean {
    return (
      type === 'shop' ||
      type === 'inventory' ||
      type === 'stash' ||
      type === 'formation' ||
      type === 'heroes' ||
      type === 'hero-detail' ||
      type === 'equip-picker'
    );
  }

  private closeCampOnlyUi(): void {
    this.closeHeroDrawer();
    if (!this.modal.isOpen() || this.modalStack.length === 0) return;

    if (this.modalStack.some((view) => this.isCampOnlyModal(view.type))) {
      this.modalStack.length = 0;
      this.modal.close('action');
    }
  }

  private refreshHeroDrawerIfOpen(): void {
    if (!this.heroDrawer.isOpen() || !this.heroDrawerHeroId || !this.state) return;

    const heroId = this.heroDrawerHeroId;
    const hero = this.state.heroes.find((entry) => entry.id === heroId);
    if (!hero) {
      this.closeHeroDrawer();
      return;
    }

    const navigation = getHeroNavigation(this.state, heroId);
    this.heroDrawer.prepare(hero.name);
    this.heroDrawer.setNavVisible({
      prev: navigation.prevId !== null,
      next: navigation.nextId !== null,
    });

    this.bindHeroDetailDrawer(this.heroDrawer.getBody(), heroId);
    this.syncInlineEquipHosts();
  }

  private async handlePartySlotDrop(heroId: string, targetIndex: number): Promise<void> {
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }

    try {
      const next = await this.partyFlow.setPartySlot(targetIndex, heroId);
      if (next) this.render(next);
    } catch (error) {
      this.handleFailedResponse(error instanceof Error ? error.message : 'Erro ao editar party');
    }
  }

  private async handlePartyActiveToBench(heroId: string): Promise<void> {
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }

    try {
      const next = await this.partyFlow.removeFromParty(heroId);
      if (next) this.render(next);
    } catch (error) {
      this.handleFailedResponse(error instanceof Error ? error.message : 'Erro ao editar party');
    }
  }

  private async handlePartyReorder(fromIndex: number, toIndex: number): Promise<void> {
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }

    try {
      const next = await this.partyFlow.movePartyMember(fromIndex, toIndex);
      if (next) this.render(next);
    } catch (error) {
      this.handleFailedResponse(error instanceof Error ? error.message : 'Erro ao editar party');
    }
  }

  private bindHeroPanelDelegation(): void {
    this.modal.getBody().addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const topView = this.modalStack[this.modalStack.length - 1];

      const partyTarget = target.closest(
        '[data-party-add], [data-party-remove], [data-party-swap]',
      ) as HTMLElement | null;

      if (partyTarget && topView?.type === 'formation') {
        event.preventDefault();
        event.stopPropagation();
        if (partyTarget instanceof HTMLButtonElement && partyTarget.disabled) return;
        void this.handlePartyPanelAction(partyTarget);
        return;
      }

      if (topView?.type !== 'heroes') return;

      const heroPanelTarget = target.closest(
        '.equipment-slot-clickable, [data-hero-skills-open], [data-open-upgrades], [data-hero-open]',
      ) as HTMLElement | null;

      if (!heroPanelTarget) return;

      if (heroPanelTarget.hasAttribute('data-open-upgrades')) {
        event.preventDefault();
        event.stopPropagation();
        void this.openUpgradesModal();
        return;
      }

      const skillsHeroId = heroPanelTarget.getAttribute('data-hero-skills-open');
      if (skillsHeroId) {
        event.preventDefault();
        event.stopPropagation();
        this.openHeroDetailModal(skillsHeroId, 'skills');
        return;
      }

      if (heroPanelTarget.classList.contains('equipment-slot-clickable')) {
        event.preventDefault();
        event.stopPropagation();
        const heroId = heroPanelTarget.getAttribute('data-hero');
        const slot = heroPanelTarget.getAttribute('data-slot');
        if (heroId && slot) {
          this.openEquipPickerFromSlot(heroId, slot);
        }
        return;
      }

      const heroId = heroPanelTarget.getAttribute('data-hero-open');
      if (heroId) {
        this.openHeroDetailModal(heroId);
      }
    });
  }

  private openHeroesModal(): void {
    if (!this.state) return;
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }

    const heroIds = listNavigableHeroIds(this.state);
    const firstId = heroIds[0] ?? this.state.heroes[0]?.id;
    if (!firstId) {
      this.toasts.show('Nenhum herói disponível', 'info');
      return;
    }

    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    this.trackedSystemsMenuId = 'heroes';
    this.campaignModalOpen = false;
    this.openHeroDrawer(firstId, 'sheet');
  }

  private openFormationModal(): void {
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }

    if (
      this.modal.isOpen() &&
      this.modalStack[this.modalStack.length - 1]?.type === 'formation'
    ) {
      return;
    }

    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    this.trackedSystemsMenuId = 'formation';
    this.campaignModalOpen = false;
    this.modalStack.length = 0;
    this.pushModal({ type: 'formation' });
    this.syncSystemsNavChrome();
  }

  private async handlePartyPanelAction(target: HTMLElement): Promise<void> {
    if (!this.state?.canEditParty && !this.isCampHubOpen(this.state)) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }

    try {
      const addId = target.getAttribute('data-party-add');
      if (addId) {
        const next = await this.partyFlow.addToParty(addId);
        if (next) this.render(next);
        return;
      }

      const removeId = target.getAttribute('data-party-remove');
      if (removeId) {
        const next = await this.partyFlow.removeFromParty(removeId);
        if (next) this.render(next);
        return;
      }

      const swapIndexRaw = target.getAttribute('data-party-swap');
      if (swapIndexRaw !== null && this.state) {
        const fromIndex = Number.parseInt(swapIndexRaw, 10);
        if (
          fromIndex >= 0 &&
          fromIndex < this.state.activePartyIds.length - 1
        ) {
          const next = await this.partyFlow.movePartyMember(fromIndex, fromIndex + 1);
          if (next) this.render(next);
        }
      }
    } catch (error) {
      this.handleFailedResponse(error instanceof Error ? error.message : 'Erro ao editar party');
    }
  }

  private bindGearActionDelegation(
    container: HTMLElement,
    isContainerActive: () => boolean,
  ): void {
    container.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest(
        [
          '.equipment-slot-clickable',
          '[data-equip-gear]',
          '[data-pick-gear]',
          '[data-pick-hero]',
          '[data-unequip-hero]',
          '[data-loot-equip-hero]',
          '[data-optimize-loadout]',
          '[data-loot-keep]',
          '[data-loot-batch-equip]',
          '[data-loot-batch-keep]',
        ].join(', '),
      ) as HTMLElement | null;

      if (!target || !isContainerActive()) return;
      if (target instanceof HTMLButtonElement && target.disabled) return;

      this.handleGearActionClick(target);
    });
  }

  private handleGearActionClick(target: HTMLElement): void {
    const equipSlot = target.classList.contains('equipment-slot-clickable') ? target : null;
    if (equipSlot) {
      const heroId = equipSlot.getAttribute('data-hero');
      const slot = equipSlot.getAttribute('data-slot');
      if (heroId && slot) {
        this.openEquipPickerFromSlot(heroId, slot);
      }
      return;
    }

    if (target.hasAttribute('data-optimize-loadout')) {
      this.markGearActionPending(target);
      void this.gearEquipFlow.optimizeLoadout();
      return;
    }

    if (target.hasAttribute('data-loot-keep')) {
      this.chestLootFlow.closeLootModal();
      return;
    }

    if (target.hasAttribute('data-loot-batch-keep')) {
      this.chestLootFlow.closeLootBatchModal();
      return;
    }

    if (target.hasAttribute('data-loot-batch-equip')) {
      const topView = this.modalStack[this.modalStack.length - 1];
      if (topView?.type === 'loot-batch') {
        this.markGearActionPending(target);
        void this.equipRecommendedLoot(topView.gearIds);
      }
      return;
    }

    const equipFromInventory = target.getAttribute('data-equip-gear');
    if (equipFromInventory) {
      this.openEquipPickerFromGear(equipFromInventory);
      return;
    }

    const unequipHeroId = target.getAttribute('data-unequip-hero');
    const unequipSlot = target.getAttribute('data-unequip-slot') as GearSlotKey | null;
    if (unequipHeroId && unequipSlot) {
      this.markGearActionPending(target);
      void this.gearEquipFlow.unequip(unequipHeroId, unequipSlot);
      return;
    }

    const lootHeroId = target.getAttribute('data-loot-equip-hero');
    const lootGearId = target.getAttribute('data-loot-equip-gear');
    if (lootHeroId && lootGearId) {
      this.markGearActionPending(target);
      void this.gearEquipFlow.equip(lootHeroId, lootGearId);
      return;
    }

    const heroId = target.getAttribute('data-pick-hero');
    const gearId = target.getAttribute('data-pick-gear');
    if (heroId && gearId) {
      this.markGearActionPending(target);
      void this.gearEquipFlow.equip(heroId, gearId);
    }
  }

  private markGearActionPending(target: HTMLElement): void {
    const button = target.closest('button') as HTMLButtonElement | null;
    if (!button || button.disabled) return;
    button.disabled = true;
    button.classList.add('gear-action-pending');
  }

  private refreshHeroDetailViews(): void {
    this.refreshHeroDrawerIfOpen();
    this.refreshModalIfOpen();
  }

  private refreshModalIfOpen(): void {
    if (this.modal.isOpen() && this.modalStack.length > 0) {
      this.renderModalTop();
    }
  }

  private openInventoryModal(): void {
    if (this.contextInvalidated || !this.state) return;
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }
    const heroId = resolveDefaultInventoryHeroId(this.state);
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    this.trackedSystemsMenuId = 'inventory';
    this.campaignModalOpen = false;
    this.openHeroDrawer(heroId, 'sheet');
  }

  private openStashModal(mode: 'replace' | 'push' = 'replace'): void {
    if (this.contextInvalidated) return;
    if (!this.canEditParty()) {
      this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
      return;
    }
    if (!this.state?.storageCapacity.stashUnlocked) {
      this.toasts.show('Desbloqueie Baú de itens em Runas', 'info');
      return;
    }
    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    this.trackedSystemsMenuId = 'stash';
    this.campaignModalOpen = false;
    if (mode === 'push' && this.modal.isOpen() && this.modalStack.length > 0) {
      this.pushModal({ type: 'stash' });
      this.syncSystemsNavChrome();
      return;
    }
    this.modalStack.length = 0;
    this.pushModal({ type: 'stash' });
    this.syncSystemsNavChrome();
  }

  private openForgeModal(mode: 'replace' | 'push' = 'replace'): void {
    if (this.contextInvalidated) return;
    if (!this.state?.featureFlags.divineForge) {
      this.toasts.show('Desbloqueie Forja Divina em Runas', 'info');
      return;
    }
    this.closeHeroDrawer();
    this.battleLogPanel.hide();
    this.battleStatsPanel.hide();
    this.divineForgeModal.resetSelection();
    this.trackedSystemsMenuId = 'forge';
    this.campaignModalOpen = false;
    if (mode === 'push' && this.modal.isOpen() && this.modalStack.length > 0) {
      this.pushModal({ type: 'divine-forge' });
      this.syncSystemsNavChrome();
      return;
    }
    this.modalStack.length = 0;
    this.pushModal({ type: 'divine-forge' });
    this.syncSystemsNavChrome();
  }

  private openHeroDetailModal(heroId: string, tab: HeroDetailTab = 'sheet'): void {
    this.openHeroDrawer(heroId, tab);
  }

  private openEquipPickerFromSlot(heroId: string, slot: string): void {
    const slotKey = slot as GearSlotKey;

    if (this.heroDrawer.isOpen() && !this.modal.isOpen()) {
      this.inlineEquip.toggleSlot(heroId, slotKey);
      this.refreshHeroDrawerIfOpen();
      return;
    }

    const topView = this.modalStack[this.modalStack.length - 1];
    if (topView?.type === 'hero-detail') {
      this.inlineEquip.toggleSlot(heroId, slotKey);
      this.renderModalTop();
      return;
    }

    if (topView?.type === 'inventory') {
      this.inlineEquip.toggleSlot(heroId, slotKey);
      this.renderModalTop();
      return;
    }

    const view: ModalView = {
      type: 'equip-picker',
      mode: { type: 'slot', heroId, slot: slotKey },
    };

    if (this.modal.isOpen() && this.modalStack.length > 0) {
      this.pushModal(view);
      return;
    }

    if (this.heroDrawer.isOpen()) {
      this.inlineEquip.toggleSlot(heroId, slotKey);
      this.refreshHeroDrawerIfOpen();
      return;
    }

    this.modalStack.length = 0;
    this.pushModal(view);
  }

  private openEquipPickerFromGear(gearId: string): void {
    if (this.heroDrawer.isOpen() && !this.modal.isOpen()) {
      this.inlineEquip.openGear(gearId);
      this.refreshHeroDrawerIfOpen();
      return;
    }

    const topView = this.modalStack[this.modalStack.length - 1];
    if (topView?.type === 'inventory') {
      this.inlineEquip.openGear(gearId);
      this.renderModalTop();
      return;
    }

    this.pushModal({
      type: 'equip-picker',
      mode: { type: 'gear', gearId },
    });
  }

  private pushModal(view: ModalView): void {
    this.modalStack.push(view);
    this.renderModalTop();
  }

  private renderModalTop(): void {
    if (!this.state || this.modalStack.length === 0) return;
    this.modalStackController.renderTop(this.modalStack, this.state, {
      inlineActiveSlot: this.inlineEquip.getActiveSlot(),
      canEditGear: this.canEditGear(),
    });
    this.syncInlineEquipHosts();
    this.syncSystemsNavChrome();
  }

  private getSystemsAvailability(): SystemsMenuAvailability {
    return {
      canEditParty: this.canEditParty(),
      stashUnlocked: Boolean(this.state?.storageCapacity.stashUnlocked),
      battleStats: Boolean(this.state?.featureFlags.battleStats),
      divineForge: Boolean(this.state?.featureFlags.divineForge),
    };
  }

  private resolveSystemsMenuCurrent(): SystemsMenuId | null {
    const rootType =
      this.modalStack.find((view) => systemsMenuFromModalViewType(view.type) !== null)?.type ??
      this.modalStack[0]?.type ??
      null;

    return resolveCurrentSystemsMenu({
      logVisible: this.battleLogPanel.isVisible(),
      statsVisible: this.battleStatsPanel.isVisible(),
      drawerOpen: this.heroDrawer.isOpen(),
      modalOpen: this.modal.isOpen(),
      modalStackRootType: rootType,
      campaignOpen: this.campaignModalOpen || this.campaignEmbeddedActive,
      trackedId: this.trackedSystemsMenuId,
    });
  }

  private syncSystemsNavChrome(): void {
    const sheetOpen =
      this.modal.isOpen() ||
      this.heroDrawer.isOpen() ||
      this.battleLogPanel.isVisible() ||
      this.battleStatsPanel.isVisible();

    if (!sheetOpen) {
      this.systemsIconsSignature = '';
      document.querySelectorAll('[data-systems-menu-icons]').forEach((host) => {
        (host as HTMLElement).replaceChildren();
      });
      return;
    }

    const current = this.resolveSystemsMenuCurrent();
    const available = listAvailableSystemsMenus(this.getSystemsAvailability());
    const signature = [
      available.join(','),
      current ?? '',
      this.modal.isOpen() ? '1' : '0',
      this.heroDrawer.isOpen() ? '1' : '0',
      this.battleLogPanel.isVisible() ? '1' : '0',
      this.battleStatsPanel.isVisible() ? '1' : '0',
    ].join('|');

    if (signature === this.systemsIconsSignature) return;
    this.systemsIconsSignature = signature;

    document.querySelectorAll<HTMLElement>('[data-systems-menu-icons]').forEach((host) => {
      const inModal = Boolean(host.closest('#modal-root'));
      const inDrawer = Boolean(host.closest('#hero-drawer-root'));
      const inLog = Boolean(host.closest('#battle-log-overlay'));
      const inStats = Boolean(host.closest('#battle-stats-overlay'));
      const active =
        (inModal && this.modal.isOpen()) ||
        (inDrawer && this.heroDrawer.isOpen()) ||
        (inLog && this.battleLogPanel.isVisible()) ||
        (inStats && this.battleStatsPanel.isVisible());

      if (!active) {
        host.replaceChildren();
        return;
      }

      renderSystemsMenuIconStrip(host, {
        available,
        current,
        onSelect: (id) => {
          void this.openSystemsSurface(id);
        },
      });
    });
  }

  private async openSystemsSurface(id: SystemsMenuId): Promise<void> {
    if (!isSystemsMenuAvailable(id, this.getSystemsAvailability())) {
      this.notifySystemsMenuUnavailable(id);
      return;
    }

    if (this.isSystemsSurfaceOpen(id)) {
      this.closeSystemsSurfaceLocal(id);
      this.syncSystemsNavChrome();
      return;
    }

    await this.openSystemsMenu(id);
  }

  private notifySystemsMenuUnavailable(id: SystemsMenuId): void {
    switch (id) {
      case 'stats':
        return;
      case 'forge':
        this.toasts.show('Desbloqueie Forja Divina em Runas', 'info');
        return;
      case 'stash':
        this.toasts.show('Desbloqueie Baú de itens em Runas', 'info');
        return;
      case 'heroes':
      case 'formation':
      case 'shop':
      case 'inventory':
        this.toasts.show('Volte ao acampamento para ajustar party e loadout', 'info');
        return;
      default:
        return;
    }
  }

  private isSystemsSurfaceOpen(id: SystemsMenuId): boolean {
    switch (id) {
      case 'log':
        return this.battleLogPanel.isVisible();
      case 'stats':
        return this.battleStatsPanel.isVisible();
      case 'heroes':
      case 'inventory':
        return this.heroDrawer.isOpen() && this.trackedSystemsMenuId === id;
      default:
        return this.resolveSystemsMenuCurrent() === id;
    }
  }

  private closeSystemsSurfaceLocal(id: SystemsMenuId): void {
    switch (id) {
      case 'log':
        this.battleLogPanel.hide();
        break;
      case 'stats':
        this.battleStatsPanel.hide();
        break;
      case 'heroes':
      case 'inventory':
        if (this.trackedSystemsMenuId === id) {
          this.closeHeroDrawer();
        }
        break;
      default:
        if (this.resolveSystemsMenuCurrent() === id && this.modal.isOpen()) {
          this.modalStack.length = 0;
          this.campaignModalOpen = false;
          this.modal.close('action');
        }
        break;
    }
    if (this.trackedSystemsMenuId === id) {
      this.trackedSystemsMenuId = null;
    }
  }

  private async openSystemsMenu(id: SystemsMenuId): Promise<void> {
    switch (id) {
      case 'heroes':
        this.openHeroesModal();
        return;
      case 'formation':
        this.openFormationModal();
        return;
      case 'log':
        this.closeHeroDrawer();
        if (this.modal.isOpen()) {
          this.modalStack.length = 0;
          this.campaignModalOpen = false;
          this.modal.close('action');
        }
        this.battleStatsPanel.hide();
        this.trackedSystemsMenuId = 'log';
        this.battleLogPanel.show();
        this.syncSystemsNavChrome();
        return;
      case 'stats':
        this.closeHeroDrawer();
        if (this.modal.isOpen()) {
          this.modalStack.length = 0;
          this.campaignModalOpen = false;
          this.modal.close('action');
        }
        this.battleLogPanel.hide();
        await this.showBattleStatsSheet();
        return;
      case 'campaign':
        await this.openCampaignModal();
        return;
      case 'shop':
        await this.openShopModal();
        return;
      case 'inventory':
        this.openInventoryModal();
        return;
      case 'stash':
        this.openStashModal('replace');
        return;
      case 'forge':
        this.openForgeModal('replace');
        return;
      case 'upgrades':
        await this.openUpgradesModal();
        return;
      case 'achievements':
        await this.openAchievementsModal();
        return;
      case 'settings':
        this.closeHeroDrawer();
        this.openSettingsModal();
        return;
    }
  }

  private async showBattleStatsSheet(): Promise<void> {
    if (!this.state) return;

    this.trackedSystemsMenuId = 'stats';
    this.battleStatsPanel.setContent(
      renderBattleStatsBody(this.state!, this.battleStatsPanel.getActiveTab()),
    );
    this.battleStatsPanel.show();
    this.syncSystemsNavChrome();
  }

  // OFFLINE PROGRESS DESATIVADO (2026-07)
  // private maybeShowIdleSummary(state: GameStateDto): void {
  //   if (this.idleSummaryShown) return;
  //
  //   const snapshot = loadPanelSnapshot();
  //   if (!snapshot) return;
  //
  //   const summary = buildIdleSummary(snapshot, state);
  //   if (!summary) return;
  //
  //   this.rewards.showIdleReport(snapshot, state);
  //   this.idleSummaryShown = true;
  //   touchPanelSnapshot(state);
  // }

  private syncLoadoutPauseBanner(state: GameStateDto): void {
    const label = this.battlePauseOverlay.querySelector('.battle-pause-label');

    if (this.battleStartFlow.isActive() || this.victoryFlow.isActive()) {
      this.hideBattlePauseOverlay();
      return;
    }

    if (this.isCampHubOpen(state)) {
      this.hideBattlePauseOverlay();
      this.stopAutoBattle();
      return;
    }

    if (state.battlePaused) {
      this.battlePauseOverlay.classList.add('battle-pause-overlay--battle');
      this.battlePauseOverlay.classList.remove('hidden');
      if (label) label.textContent = 'Pausa';
      this.stopAutoBattle();
      return;
    }

    this.hideBattlePauseOverlay();
  }

  private hideBattlePauseOverlay(): void {
    this.battlePauseOverlay.classList.add('hidden');
    this.battlePauseOverlay.classList.remove('battle-pause-overlay--battle');
  }

  private shouldShowEmbeddedCampaignMap(state: GameStateDto): boolean {
    return (
      this.isCampHubOpen(state) &&
      !this.battleStartFlow.isActive() &&
      !this.victoryFlow.isActive() &&
      !this.campaignModalOpen
    );
  }

  private syncEmbeddedCampaignMap(state: GameStateDto): void {
    if (!this.shouldShowEmbeddedCampaignMap(state)) {
      this.hideEmbeddedCampaignMap();
      return;
    }

    this.appRoot.classList.add('app--camp-map');
    this.battleStageEl.classList.add('battle-stage--camp-map');
    this.battleFieldEl.classList.add('battle-field--camp-map');
    this.campCampaignMapRoot.classList.remove('hidden');
    if (!this.campaignEmbeddedActive && !this.embeddedCampaignLoadPromise) {
      this.trackedSystemsMenuId = 'campaign';
    }
    void this.ensureEmbeddedCampaignMap();
    this.syncSystemsNavChrome();
  }

  private hideEmbeddedCampaignMap(): void {
    this.campaignEmbeddedActive = false;
    this.embeddedCampaignLoadPromise = null;
    this.campaignFlow.detachEmbedded();
    this.campCampaignMapRoot.classList.add('hidden');
    this.campCampaignMapBody.innerHTML = '';
    this.appRoot.classList.remove('app--camp-map');
    this.battleStageEl.classList.remove('battle-stage--camp-map');
    this.battleFieldEl.classList.remove('battle-field--camp-map');
    if (this.trackedSystemsMenuId === 'campaign' && !this.campaignModalOpen) {
      this.trackedSystemsMenuId = null;
      this.syncSystemsNavChrome();
    }
  }

  private ensureEmbeddedCampaignMap(): void {
    if (this.campaignEmbeddedActive || this.embeddedCampaignLoadPromise) return;

    this.embeddedCampaignLoadPromise = this.campaignFlow
      .open(
        {
          mode: 'embedded',
          body: this.campCampaignMapBody,
          header: null,
        },
        (nextState) => this.render(nextState),
      )
      .then(() => {
        this.campaignEmbeddedActive = true;
        if (this.state) {
          this.syncOnboarding(this.state);
        }
        this.syncSystemsNavChrome();
      })
      .finally(() => {
        this.embeddedCampaignLoadPromise = null;
      });
  }

  private render(
    state: GameStateDto,
    options: {
      skipChestToast?: boolean;
      // OFFLINE PROGRESS DESATIVADO (2026-07)
      // checkIdleSummary?: boolean;
      previousState?: GameStateDto | null;
    } = {},
  ): void {
    if (this.contextInvalidated || !this.client.isContextValid()) {
      this.handleContextInvalidated();
      return;
    }

    // OFFLINE PROGRESS DESATIVADO (2026-07)
    // if (options.checkIdleSummary) {
    //   seedPanelSnapshotIfMissing(state);
    //   this.maybeShowIdleSummary(state);
    // }

    const previous =
      options.previousState !== undefined ? options.previousState : this.state;

    const mergedState =
      !state.meta && previous?.meta ? { ...state, meta: previous.meta } : state;

    this.battleAttemptBaseline = updateBattleAttemptBaseline(
      this.battleAttemptBaseline,
      previous,
      mergedState,
    );

    this.showCombatIntermissionOverlay(previous, mergedState);

    if (!mergedState.combatIntermission) {
      this.clearBattleResultRevealTimer();
      this.shownIntermissionKey = null;
    }

    if (previous && !options.skipChestToast && this.bootReady) {
      this.rewards.detectStateChange(
        previous,
        mergedState,
        {
          onChestAvailable: () => {
            if (this.isAdvanceBlocked()) return;
            void this.chestLootFlow.openNextChest();
          },
        },
        { skipVictoryRewards: Boolean(mergedState.combatIntermission) },
      );
    }

    this.state = mergedState;

    if (previous?.canEditParty && !mergedState.canEditParty) {
      this.closeCampOnlyUi();
    }

    this.syncLoadoutPauseBanner(mergedState);
    this.syncEmbeddedCampaignMap(mergedState);

    const animateStripTimers = shouldAnimateBattleStripTimers(mergedState);

    this.hud.render(mergedState, {
      openingChests: this.chestLootFlow.openingChests,
      loadoutPauseActive: this.isCampHubOpen(mergedState),
      battlePauseActive: Boolean(mergedState.battlePaused),
    });

    this.battleStrip.render(mergedState);
    this.skillCooldownAnimator.setCombatActive(animateStripTimers);
    this.stageProgressBar.render(mergedState);
    if (this.bootReady) {
      this.syncPersistentWowInbox(mergedState);
      this.syncGameMusic(mergedState);
    }

    this.shopFlow.state.shopRefreshUnlocked = mergedState.featureFlags.shopRefresh;
    this.shopFlow.state.shopRefreshRemaining = Math.max(
      0,
      mergedState.shopRefreshLimit - mergedState.shopRefreshUses,
    );

    const logMessages = filterBattleLogMessages(
      mergedState.battleLog.map((entry) => entry.message),
      this.prefsController.logFilterImportant,
    );

    this.battleLogRenderer.render(this.battleLog, logMessages);

    if (this.battleStatsPanel.isVisible()) {
      this.battleStatsPanel.setContent(
        renderBattleStatsBody(mergedState, this.battleStatsPanel.getActiveTab()),
      );
    }

    this.enforceUpgradeGates();
    if (this.bootReady && !this.onboarding.isActive()) {
      this.chestLootFlow.scheduleAutoOpenChests();
    }
    if (
      this.modal.isOpen() &&
      this.modalStack[this.modalStack.length - 1]?.type === 'shop'
    ) {
      void this.shopFlow.ensureFreshOffers(mergedState);
    }
    if (
      this.modal.isOpen() &&
      this.modalStack[this.modalStack.length - 1]?.type === 'formation'
    ) {
      this.renderModalTop();
    }
    if (
      this.modal.isOpen() &&
      (this.modalStack[this.modalStack.length - 1]?.type === 'heroes' ||
        this.modalStack[this.modalStack.length - 1]?.type === 'hero-detail') &&
      shouldRenderHeroPanel(previous, mergedState)
    ) {
      this.renderModalTop();
    }
    if (this.bootReady) {
      this.syncOnboarding(mergedState);
      this.tryShowAutoActScene(previous, mergedState);
    }
    this.syncSystemsNavChrome();
  }

  private syncPersistentWowInbox(state: GameStateDto): void {
    this.wowCelebration.syncPersistentBanners(
      buildPersistentWowBanners(state, {
        onChestOpen: () => {
          if (this.isAdvanceBlocked()) return;
          void this.chestLootFlow.openNextChest();
        },
        onInventoryOpen: () => this.openInventoryModal(),
        onUpgradesOpen: () => {
          void this.openUpgradesModal();
        },
        onHeroPointsOpen: () => {
          const hero = state.heroes.find((entry) => entry.hasUnspentPoints);
          if (hero) {
            this.openHeroDrawer(hero.id, 'sheet');
            return;
          }
          this.openHeroesModal();
        },
        onAchievementsOpen: () => {
          void this.openAchievementsModal();
        },
        onCampaignOpen: () => {
          void this.openCampaignModal();
        },
        onStashOpen: () => this.openStashModal(),
        onForgeOpen: () => this.openForgeModal(),
      }),
    );
  }

  private tryShowAutoActScene(
    previous: GameStateDto | null | undefined,
    state: GameStateDto,
  ): void {
    if (this.actSceneFlow.isBlocking() || state.combatIntermission) {
      return;
    }

    const scene = detectPendingActSceneDto(previous?.campaignProgress, state.campaignProgress);
    if (!scene) return;

    this.presentActScene(scene, {
      markViewedOnDismiss: true,
      onDismiss: () => {
        void this.markActSceneViewed(scene.id);
      },
    });
  }

  private async markActSceneViewed(sceneId: string): Promise<void> {
    if (this.contextInvalidated) return;

    const response = await this.client.send({ type: 'MARK_ACT_SCENE_VIEWED', sceneId });
    if (!response.ok) {
      this.handleFailedResponse(response.error);
      return;
    }

    this.render(response.state, { previousState: this.state });
  }

  private dismissOnboardingStep(stepId: OnboardingStepId): void {
    this.onboarding.dismissStep(stepId);
    // CTA externo (abrir heróis, baú, etc.) esconde o tip sem passar pelo release
    // do card — libera ghost lock sem disparar onIdle síncrono.
    if (this.overlayOrchestrator.getActiveId() === stepId) {
      this.overlayOrchestrator.release('onboarding', stepId, { notifyIdle: false });
    }
  }

  private onboardingUiContext(): OnboardingUiContext {
    const embeddedVisible = this.state ? this.shouldShowEmbeddedCampaignMap(this.state) : false;
    return {
      campaignMapOpen: this.campaignModalOpen || this.campaignEmbeddedActive || embeddedVisible,
      missionPreviewOpen: this.campaignFlow.isMissionPreviewOpen(),
    };
  }

  /** Reagenda o tutorial após o intervalo entre dicas (senão o cooldown engole o passo). */
  private scheduleOnboardingSync(): void {
    if (isOnboardingComplete(this.onboarding.getDismissedSteps())) return;

    window.clearTimeout(this.onboardingSyncTimer);
    this.onboardingSyncTimer = window.setTimeout(() => {
      this.onboardingSyncTimer = 0;
      if (this.state) this.syncOnboarding(this.state);
    }, OnboardingController.STEP_GAP_MS + 100);
  }

  private dismissMapTutorial(): void {
    for (const stepId of MAP_TUTORIAL_STEP_IDS) {
      this.dismissOnboardingStep(stepId);
    }
  }

  /** Seleção de local no mapa avança o tutorial para o passo do preview. */
  private handleCampaignMapViewChange(): void {
    if (!this.state) return;
    if (this.campaignFlow.isMissionPreviewOpen()) {
      this.dismissOnboardingStep('map-locations');
    }
    this.syncOnboarding(this.state);
    this.scheduleOnboardingSync();
  }

  /** Boas-vindas terminam com o mapa embutido no acampamento — tutorial continua ali. */
  private async openCampaignMapForOnboarding(): Promise<void> {
    if (this.state) {
      this.syncEmbeddedCampaignMap(this.state);
    }
    this.scheduleOnboardingSync();
  }

  private syncOnboarding(state: GameStateDto): void {
    const step = resolveOnboardingStep(
      state,
      this.onboarding.getDismissedSteps(),
      this.onboardingUiContext(),
    );
    if (!step) {
      this.onboarding.hide();
      this.overlayOrchestrator.cancelKind('onboarding');
      this.syncAutoBattleTimer();
      return;
    }

    this.overlayOrchestrator.request('onboarding', step.id, () => {
      this.onboarding.show(step, {
        onDismissStep: (stepId) => {
          this.dismissOnboardingStep(stepId);
          this.overlayOrchestrator.release('onboarding', step.id);
          if (stepId === 'welcome') {
            void this.openCampaignMapForOnboarding();
          }
          if (this.state) {
            this.syncOnboarding(this.state);
            // previous=state evita falso positivo de "cena recém-desbloqueada".
            this.tryShowAutoActScene(this.state, this.state);
          }
          this.scheduleOnboardingSync();
          this.syncAutoBattleTimer();
        },
        onSkipAll: () => {
          window.clearTimeout(this.onboardingSyncTimer);
          this.onboarding.skipAll();
          this.onboarding.hide();
          this.overlayOrchestrator.cancelKind('onboarding');
          if (this.state) {
            this.tryShowAutoActScene(this.state, this.state);
          }
          this.syncAutoBattleTimer();
        },
      });

      if (!this.onboarding.isActive()) {
        // Cooldown / falha de show: libera sem idle para não reentrar.
        this.overlayOrchestrator.release('onboarding', step.id, { notifyIdle: false });
        return;
      }

      this.stopAutoBattle();
    });
  }
}
