import { GameApplication } from '../../application/GameApplication';
import { GameApplicationDependencies } from '../../application/GameApplicationDependencies';
import { ClassAscensionService } from '../../domain/progression/ClassAscensionService';
import { SkillService } from '../../domain/progression/SkillService';
import { CombatService } from '../../domain/services/CombatService';
import { ChestService } from '../../domain/services/ChestService';
import { DivineForgeService } from '../../domain/services/DivineForgeService';
import { LoadoutOptimizer } from '../../domain/services/LoadoutOptimizer';
import { LootService } from '../../domain/services/LootService';
import { ShopService } from '../../domain/services/ShopService';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { PartyService } from '../../domain/party/PartyService';
import { GameStatePresenter } from '../../application/presenters/GameStatePresenter';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { IAchievementProgressRepository } from '../../domain/repositories/IAchievementProgressRepository';
import { ISaveBackupStore } from '../../application/ports/ISaveBackupStore';
import { GameStateRepository } from '../storage/GameStateRepository';
import { MetaProgressStore } from '../storage/MetaProgressStore';
import { AchievementProgressStore } from '../storage/AchievementProgressStore';
import { SaveBackupStore } from '../storage/SaveBackupStore';
import { createLocalStorageKeyValueStore } from '../storage/LocalStorageKeyValueStore';
import { IKeyValueStore } from '../storage/IKeyValueStore';
import { MetaService } from '../../domain/meta/MetaService';
import { AchievementService } from '../../domain/achievements/AchievementService';

let appInstance: GameApplication | null = null;

export type GameStoragePorts = {
  repository: IGameStateRepository;
  metaRepository: IMetaProgressRepository;
  achievementRepository: IAchievementProgressRepository;
  backupStore: ISaveBackupStore;
};

function createDependencies(): GameApplicationDependencies {
  const lootService = new LootService();
  const upgradeService = new UpgradeService();

  const metaService = new MetaService();
  const achievementService = new AchievementService();

  return {
    combatService: new CombatService(),
    lootService,
    chestService: new ChestService(lootService),
    shopService: new ShopService(lootService),
    upgradeService,
    skillService: new SkillService(),
    ascensionService: new ClassAscensionService(),
    loadoutOptimizer: new LoadoutOptimizer(),
    partyService: new PartyService(),
    divineForgeService: new DivineForgeService(lootService),
    presenter: new GameStatePresenter(upgradeService),
    metaService,
    achievementService,
  };
}

export function createStoragePorts(
  store: IKeyValueStore = createLocalStorageKeyValueStore(),
): GameStoragePorts {
  return {
    repository: new GameStateRepository(store),
    metaRepository: new MetaProgressStore(store),
    achievementRepository: new AchievementProgressStore(store),
    backupStore: new SaveBackupStore(store),
  };
}

export function createGameApplication(ports?: GameStoragePorts): GameApplication {
  if (!appInstance) {
    const storage = ports ?? createStoragePorts();
    appInstance = new GameApplication(
      storage.repository,
      storage.metaRepository,
      storage.achievementRepository,
      storage.backupStore,
      createDependencies(),
    );
  }
  return appInstance;
}

export function resetGameApplicationForTests(): void {
  appInstance = null;
}
