import { Gold } from '../value-objects/Gold';
import { UpgradeLevels } from '../upgrades/FeatureKey';
import { CampaignProgress, CampaignProgressProps } from '../campaign/CampaignProgress';
import { isPhaseReleased, maxReleasedTier } from '../campaign/CampaignReleaseScope';
import { CombatIntermission, CombatIntermissionProps } from '../campaign/CombatIntermission';
import { PhaseRun, PhaseRunProps } from '../campaign/PhaseRun';
import { resolvePhase } from '../campaign/CampaignCatalog';
import {
  BattleSessionStatsProps,
  emptyBattleSessionStats,
  normalizeBattleSessionStats,
} from '../combat/BattleSessionStats';
import { Chest } from './Chest';
import { CombatState } from './CombatState';
import { Enemy } from './Enemy';
import { Gear } from './Gear';
import { Hero } from './Hero';
import { TurnOrderService } from '../services/combat/TurnOrderService';
import { normalizePartyFromProps } from '../party/PartyNormalizer';
import {
  cloneShopStock,
  normalizeShopStock,
  type ShopStock,
  type ShopStockProps,
} from '../shop/ShopStock';

export interface BattleLogEntry {
  message: string;
  timestamp: number;
}

export interface GameStateProps {
  /** Legado — preferir `roster`. Mantido para saves antigos. */
  heroes?: Hero[];
  roster?: Hero[];
  activePartyIds?: string[];
  combat: CombatState | null;
  /** Legado — migrado para `combat` no load. */
  currentEnemy?: Enemy | null;
  campaignProgress: CampaignProgressProps;
  phaseRun: PhaseRunProps | null;
  /** Tier de dificuldade máximo alcançado (gates de loja/upgrades). */
  stage: number;
  gold: number;
  chests: Chest[];
  inventory: Gear[];
  stash: Gear[];
  battleLog: BattleLogEntry[];
  totalBattlesWon: number;
  /** Contador persistente de baús abertos (não depende de stubs no array). */
  totalChestsOpened?: number;
  lastTickAt: number;
  shopRefreshSeed: number;
  /** Estoque persistido e histórico de compras limitadas, indexados por loja. */
  shopStocks?: Readonly<Record<string, ShopStockProps>>;
  upgradeLevels: UpgradeLevels;
  /** Espelho legado do contador da loja ativa (cota real vive no `ShopStock`). */
  shopRefreshUses: number;
  /** Janela de edição de loadout (pausa manual ou entre fases). */
  loadoutEditOpen?: boolean;
  /** Ao continuar, reinicia a fase atual em vez de avançar para a próxima. */
  phaseRestartOnResume?: boolean;
  /** Pausa entre waves/fases até o jogador ver o overlay de resultado. */
  combatIntermission?: CombatIntermissionProps | null;
  /** Pausa de batalha (mantém combate; sem edição de party/loadout). */
  battlePaused?: boolean;
  /** Totais da tentativa atual de fase (dano/cura/sofrido). */
  battleSessionStats?: BattleSessionStatsProps;
}

export class GameState {
  readonly roster: Hero[];
  readonly activePartyIds: readonly string[];
  readonly combat: CombatState | null;
  readonly campaignProgress: CampaignProgress;
  readonly phaseRun: PhaseRun | null;
  readonly stage: number;
  readonly gold: Gold;
  readonly chests: Chest[];
  readonly inventory: Gear[];
  readonly stash: Gear[];
  readonly battleLog: BattleLogEntry[];
  readonly totalBattlesWon: number;
  readonly totalChestsOpened: number;
  readonly lastTickAt: number;
  readonly shopRefreshSeed: number;
  readonly shopStocks: Readonly<Record<string, ShopStock>>;
  readonly upgradeLevels: UpgradeLevels;
  readonly shopRefreshUses: number;
  readonly loadoutEditOpen: boolean;
  readonly phaseRestartOnResume: boolean;
  readonly combatIntermission: CombatIntermission | null;
  readonly battlePaused: boolean;
  readonly battleSessionStats: BattleSessionStatsProps;

  private constructor(props: GameStateProps) {
    const legacyHeroes = props.heroes ?? [];
    const party = normalizePartyFromProps(legacyHeroes, props.roster, props.activePartyIds);
    this.roster = party.roster;
    this.activePartyIds = party.activePartyIds;
    this.combat = props.combat;
    this.campaignProgress = CampaignProgress.restore(props.campaignProgress);
    this.phaseRun = props.phaseRun ? PhaseRun.restore(props.phaseRun) : null;
    this.stage = props.stage;
    this.gold = Gold.of(props.gold);
    this.chests = props.chests;
    this.inventory = props.inventory;
    this.stash = props.stash ?? [];
    this.battleLog = props.battleLog.slice(-40);
    this.totalBattlesWon = props.totalBattlesWon;
    this.totalChestsOpened = Math.max(0, Math.floor(props.totalChestsOpened ?? 0));
    this.lastTickAt = props.lastTickAt;
    this.shopRefreshSeed = Math.max(0, props.shopRefreshSeed ?? 0);
    const legacyRefreshUses = Math.max(0, props.shopRefreshUses ?? 0);
    this.shopStocks = Object.fromEntries(
      Object.entries(props.shopStocks ?? {}).map(([shopId, stock]) => [
        shopId,
        normalizeShopStock(stock, legacyRefreshUses),
      ]),
    );
    this.upgradeLevels = props.upgradeLevels ?? {};
    this.shopRefreshUses = legacyRefreshUses;
    this.loadoutEditOpen = props.loadoutEditOpen === true;
    this.phaseRestartOnResume = props.phaseRestartOnResume === true;
    this.combatIntermission = props.combatIntermission
      ? CombatIntermission.restore(props.combatIntermission)
      : null;
    this.battlePaused = props.battlePaused === true;
    this.battleSessionStats = normalizeBattleSessionStats(props.battleSessionStats);
  }

  static initial(): GameState {
    const nix = Hero.createStarter('hero-2', 'sorcerer', 'Nix');
    const progress = CampaignProgress.initial();

    return new GameState({
      roster: [nix],
      activePartyIds: [nix.id],
      combat: null,
      campaignProgress: progress.toProps(),
      phaseRun: null,
      stage: progress.highestTierReached,
      gold: 0,
      chests: [],
      inventory: [],
      stash: [],
      battleLog: [{ message: 'A aventura começou no Side Hero!', timestamp: Date.now() }],
      totalBattlesWon: 0,
      totalChestsOpened: 0,
      lastTickAt: Date.now(),
      shopRefreshSeed: 0,
      shopStocks: {},
      upgradeLevels: {},
      shopRefreshUses: 0,
      loadoutEditOpen: true,
      phaseRestartOnResume: false,
      combatIntermission: null,
      battlePaused: false,
      battleSessionStats: emptyBattleSessionStats(),
    });
  }

  static restore(props: GameStateProps): GameState {
    const campaignProgress =
      props.campaignProgress ?? CampaignProgress.initial().toProps();

    let phaseRun = props.phaseRun ?? null;
    if (phaseRun && !isPhaseReleased(phaseRun.phaseId)) {
      phaseRun = null;
    }

    const stage =
      typeof props.stage === 'number'
        ? Math.min(props.stage, maxReleasedTier())
        : campaignProgress.highestTierReached;

    return new GameState({
      ...props,
      campaignProgress,
      phaseRun,
      stage,
    });
  }

  /** Alias legado de `roster`. */
  get heroes(): Hero[] {
    return this.roster;
  }

  activeHeroes(): Hero[] {
    return this.activePartyIds
      .map((id) => this.roster.find((hero) => hero.id === id))
      .filter((hero): hero is Hero => hero !== undefined);
  }

  benchHeroes(): Hero[] {
    const activeIds = new Set(this.activePartyIds);
    return this.roster.filter((hero) => !activeIds.has(hero.id));
  }

  get currentEnemy(): Enemy | null {
    return this.combat?.enemies[0] ?? null;
  }

  currentDifficultyTier(): number {
    const phaseId =
      this.combat?.encounterMeta?.phaseId ??
      this.phaseRun?.phaseId ??
      this.campaignProgress.selectedPhaseId;
    return resolvePhase(phaseId)?.difficultyTier ?? this.stage;
  }

  withCombat(combat: CombatState | null): GameState {
    return this.clone({ combat });
  }

  withEnemy(enemy: Enemy | null): GameState {
    if (!enemy) {
      return this.withCombat(null);
    }

    const turnOrder = new TurnOrderService();
    return this.withCombat(CombatState.fromLegacyEnemy(enemy, this.activeHeroes(), turnOrder));
  }

  withRoster(roster: Hero[]): GameState {
    return this.clone({ roster, heroes: roster });
  }

  withActivePartyIds(activePartyIds: string[]): GameState {
    return this.clone({ activePartyIds: [...activePartyIds] });
  }

  withRosterHeroes(updates: Hero[]): GameState {
    const byId = new Map(updates.map((hero) => [hero.id, hero]));
    const roster = this.roster.map((hero) => byId.get(hero.id) ?? hero);
    return this.withRoster(roster);
  }

  withHeroes(heroes: Hero[]): GameState {
    return this.withRosterHeroes(heroes);
  }

  withGold(gold: Gold): GameState {
    return this.clone({ gold: gold.value() });
  }

  withCampaignProgress(progress: CampaignProgress): GameState {
    return this.clone({ campaignProgress: progress.toProps() });
  }

  withPhaseRun(phaseRun: PhaseRun | null): GameState {
    return this.clone({ phaseRun: phaseRun?.toProps() ?? null });
  }

  withLoadoutEditOpen(loadoutEditOpen: boolean): GameState {
    return this.clone({ loadoutEditOpen });
  }

  withPhaseRestartOnResume(phaseRestartOnResume: boolean): GameState {
    return this.clone({ phaseRestartOnResume });
  }

  withCombatIntermission(combatIntermission: CombatIntermission | null): GameState {
    return this.clone({ combatIntermission: combatIntermission?.toProps() ?? null });
  }

  withBattlePaused(battlePaused: boolean): GameState {
    return this.clone({ battlePaused });
  }

  withBattleSessionStats(battleSessionStats: BattleSessionStatsProps): GameState {
    return this.clone({ battleSessionStats: normalizeBattleSessionStats(battleSessionStats) });
  }

  clearBattleSessionStats(): GameState {
    return this.clone({ battleSessionStats: emptyBattleSessionStats() });
  }

  /** A cota de renovação é por loja (`ShopStock.refreshUses`) e não zera com o stage. */
  withStage(stage: number): GameState {
    return this.clone({ stage, shopRefreshSeed: 0 });
  }

  withShopRefreshSeed(shopRefreshSeed: number): GameState {
    return this.clone({ shopRefreshSeed: Math.max(0, shopRefreshSeed) });
  }

  shopStock(shopId: string): ShopStock | null {
    return this.shopStocks[shopId] ?? null;
  }

  withShopStock(shopId: string, stock: ShopStock): GameState {
    const normalized = cloneShopStock(stock);
    return this.clone({
      shopStocks: {
        ...this.shopStocks,
        [shopId]: normalized,
      },
      shopRefreshSeed: normalized.seed,
      shopRefreshUses: normalized.refreshUses,
    });
  }

  withUpgradeLevels(upgradeLevels: UpgradeLevels): GameState {
    return this.clone({ upgradeLevels: { ...upgradeLevels } });
  }

  chestsOpenedCount(): number {
    return this.totalChestsOpened;
  }

  withChests(chests: Chest[]): GameState {
    return this.clone({ chests });
  }

  withTotalChestsOpened(totalChestsOpened: number): GameState {
    return this.clone({ totalChestsOpened: Math.max(0, Math.floor(totalChestsOpened)) });
  }

  /** Remove baús já abertos do save (loot já está no inventário/stash). */
  pruneOpenedChests(openedDelta = 0): GameState {
    const pending = this.chests.filter((chest) => !chest.opened);
    const nextTotal = this.totalChestsOpened + Math.max(0, Math.floor(openedDelta));
    if (pending.length === this.chests.length && openedDelta <= 0) {
      return this;
    }
    return this.withChests(pending).withTotalChestsOpened(nextTotal);
  }

  withInventory(inventory: Gear[]): GameState {
    return this.clone({ inventory });
  }

  withStash(stash: Gear[]): GameState {
    return this.clone({ stash });
  }

  addLog(message: string): GameState {
    const entry = { message, timestamp: Date.now() };
    return this.clone({ battleLog: [...this.battleLog, entry] });
  }

  incrementBattlesWon(): GameState {
    return this.clone({ totalBattlesWon: this.totalBattlesWon + 1 });
  }

  touchTick(): GameState {
    return this.clone({ lastTickAt: Date.now() });
  }

  pendingChests(): Chest[] {
    return this.chests.filter((c) => !c.opened);
  }

  toProps(): GameStateProps {
    return {
      heroes: this.roster,
      roster: this.roster,
      activePartyIds: [...this.activePartyIds],
      combat: this.combat,
      campaignProgress: this.campaignProgress.toProps(),
      phaseRun: this.phaseRun?.toProps() ?? null,
      stage: this.stage,
      gold: this.gold.value(),
      chests: this.chests,
      inventory: this.inventory,
      stash: this.stash,
      battleLog: this.battleLog,
      totalBattlesWon: this.totalBattlesWon,
      totalChestsOpened: this.totalChestsOpened,
      lastTickAt: this.lastTickAt,
      shopRefreshSeed: this.shopRefreshSeed,
      shopStocks: Object.fromEntries(
        Object.entries(this.shopStocks).map(([shopId, stock]) => [
          shopId,
          cloneShopStock(stock),
        ]),
      ),
      upgradeLevels: this.upgradeLevels,
      shopRefreshUses: this.shopRefreshUses,
      loadoutEditOpen: this.loadoutEditOpen,
      phaseRestartOnResume: this.phaseRestartOnResume,
      combatIntermission: this.combatIntermission?.toProps() ?? null,
      battlePaused: this.battlePaused,
      battleSessionStats: { ...this.battleSessionStats },
    };
  }

  private clone(partial: Partial<GameStateProps>): GameState {
    return new GameState({ ...this.toProps(), ...partial });
  }
}
