import { GameMessage, GameResponse } from '../../application/ports/GameClientTypes';
import { MapId } from '../../domain/campaign/CampaignIds';
import { META_LEGACY_ENABLED } from '../../application/ProductGates';
import { GameApplication } from '../../application/GameApplication';

export async function handleGameMessage(
  app: GameApplication,
  message: GameMessage,
): Promise<GameResponse> {
  switch (message.type) {
    case 'GET_STATE': {
      const state = await app.getState.execute();
      return { ok: true, state };
    }
    case 'GET_CAMPAIGN_OVERVIEW': {
      const result = await app.getCampaignOverview.execute();
      return { ok: true, state: result.state, campaign: result.campaign };
    }
    case 'GET_MISSION_BOARD': {
      const result = await app.getMissionBoard.execute(message.mapId as MapId);
      return { ok: true, state: result.state, missionBoard: result.board };
    }
    case 'SELECT_PHASE': {
      const state = await app.selectPhase.execute(message.phaseId);
      return { ok: true, state };
    }
    case 'START_MISSION': {
      const state = await app.startMission.execute(message.missionId);
      return { ok: true, state };
    }
    case 'RESOLVE_MISSION_OUTCOME': {
      const state = await app.resolveMissionOutcome.execute(message.mode, message.phaseId);
      return { ok: true, state };
    }
    case 'MARK_ACT_SCENE_VIEWED': {
      const state = await app.markActSceneViewed.execute(message.sceneId);
      return { ok: true, state };
    }
    case 'NEW_GAME': {
      if (!META_LEGACY_ENABLED) {
        return { ok: false, error: 'Novo jogo está desabilitado nesta versão' };
      }
      const state = await app.newGame.execute();
      return { ok: true, state };
    }
    case 'PAUSE_FOR_LOADOUT': {
      const state = await app.pauseForLoadout.execute();
      return { ok: true, state };
    }
    case 'PAUSE_BATTLE': {
      const state = await app.pauseBattle.execute();
      return { ok: true, state };
    }
    case 'RESUME_BATTLE': {
      const state = await app.resumeBattle.execute();
      return { ok: true, state };
    }
    case 'TICK': {
      const result = await app.tick.execute(message.ticks ?? 1, {
        restartCurrentPhase: message.restartCurrentPhase,
      });
      return {
        ok: true,
        state: result.state,
        combatFloats: result.combatFloats,
        combatSkillVfx: result.combatSkillVfx,
        sigilsAwarded: result.sigilsAwarded,
        achievementUpdates: result.achievementUpdates,
      };
    }
    case 'RESUME_COMBAT_INTERMISSION': {
      const result = await app.resumeCombatIntermission.execute();
      return {
        ok: true,
        state: result.state,
        combatFloats: result.combatFloats,
        combatSkillVfx: result.combatSkillVfx,
      };
    }
    case 'OPEN_CHEST': {
      const result = await app.openChest.execute(message.chestId);
      return { ok: true, state: result.state, openedGear: result.openedGear };
    }
    case 'OPEN_ALL_CHESTS': {
      const result = await app.openAllChests.execute();
      return { ok: true, state: result.state, openedGears: result.openedGears };
    }
    case 'EQUIP_GEAR': {
      const state = await app.equipGear.execute(message.heroId, message.gearId);
      return { ok: true, state };
    }
    case 'EQUIP_BEST_LOADOUT': {
      const result = await app.equipBestLoadout.execute(message.gearIds);
      return { ok: true, state: result.state, equippedCount: result.equippedCount };
    }
    case 'UNEQUIP_GEAR': {
      const state = await app.unequipGear.execute(
        message.heroId,
        message.slot as 'weapon' | 'armor' | 'accessory',
      );
      return { ok: true, state };
    }
    case 'MOVE_GEAR_TO_STASH': {
      const state = await app.moveGearToStash.execute(message.gearId);
      return { ok: true, state };
    }
    case 'MOVE_GEAR_FROM_STASH': {
      const state = await app.moveGearFromStash.execute(message.gearId);
      return { ok: true, state };
    }
    case 'DESTROY_GEAR': {
      const state = await app.destroyGear.execute(message.gearId, message.location);
      return { ok: true, state };
    }
    case 'FORGE_FUSE_GEAR': {
      const result = await app.fuseGearInForge.execute(message.gearIds);
      return { ok: true, state: result.state, forgedGear: result.forgedGear };
    }
    case 'FORGE_SALVAGE_GEAR': {
      const result = await app.salvageGearInForge.execute(message.gearId);
      return { ok: true, state: result.state, salvageGold: result.salvageGold };
    }
    case 'GET_SHOP_OFFERS': {
      const result = await app.getShopOffers.execute();
      return {
        ok: true,
        state: result.state,
        shopOffers: result.offers,
        activeShop: result.shop,
        shopRefreshCost: result.refreshCost,
        canAffordShopRefresh: result.canAffordRefresh,
        shopRefreshUnlocked: result.shopRefreshUnlocked,
        shopRefreshRemaining: result.shopRefreshRemaining,
      };
    }
    case 'BUY_SHOP_OFFER': {
      const result = await app.buyShopOffer.execute(message.offerId, message.shopId);
      return { ok: true, state: result.state, purchasedGear: result.purchasedGear };
    }
    case 'BUY_AND_EQUIP_SHOP_OFFER': {
      const result = await app.buyAndEquipShopOffer.execute(
        message.offerId,
        message.heroId,
        message.shopId,
      );
      return { ok: true, state: result.state, purchasedGear: result.purchasedGear };
    }
    case 'REFRESH_SHOP': {
      const result = await app.refreshShop.execute(message.shopId);
      return {
        ok: true,
        state: result.state,
        shopOffers: result.offers,
        activeShop: result.shop,
        shopRefreshCost: result.refreshCost,
        canAffordShopRefresh: result.canAffordRefresh,
        shopRefreshRemaining: result.shopRefreshRemaining,
        shopRefreshUnlocked: true,
      };
    }
    case 'GET_UPGRADE_TREE': {
      const result = await app.getUpgradeTree.execute();
      return {
        ok: true,
        state: result.state,
        upgradeNodes: result.nodes,
        purchasableUpgradeCount: result.purchasableCount,
      };
    }
    case 'PURCHASE_UPGRADE': {
      const result = await app.purchaseUpgrade.execute(message.upgradeId);
      return {
        ok: true,
        state: result.state,
        upgradeNodes: result.nodes,
        purchasableUpgradeCount: result.purchasableCount,
        purchasedUpgradeId: result.purchasedUpgradeId,
      };
    }
    case 'GET_META_TREE': {
      if (!META_LEGACY_ENABLED) {
        return { ok: false, error: 'Legado não está disponível nesta versão' };
      }
      const result = await app.getMetaTree.execute();
      return {
        ok: true,
        state: result.state,
        metaNodes: result.nodes,
        purchasableMetaCount: result.purchasableMetaCount,
      };
    }
    case 'GET_ACHIEVEMENTS': {
      const result = await app.getAchievements.execute();
      return {
        ok: true,
        state: result.state,
        achievements: result.achievements,
        completedAchievementCount: result.completedCount,
        totalAchievementCount: result.totalCount,
      };
    }
    case 'PURCHASE_META_UPGRADE': {
      if (!META_LEGACY_ENABLED) {
        return { ok: false, error: 'Legado não está disponível nesta versão' };
      }
      const result = await app.purchaseMetaUpgrade.execute(message.upgradeId);
      return {
        ok: true,
        state: result.state,
        metaNodes: result.nodes,
        purchasableMetaCount: result.purchasableMetaCount,
        purchasedMetaUpgradeId: result.purchasedMetaUpgradeId,
      };
    }
    case 'SPEND_IMPROVEMENT_POINT': {
      const state = await app.spendImprovementPoint.execute(message.heroId, message.target);
      return { ok: true, state };
    }
    case 'REFUND_IMPROVEMENT_POINT': {
      const state = await app.refundImprovementPoint.execute(message.heroId, message.target);
      return { ok: true, state };
    }
    case 'MASS_REFUND_IMPROVEMENT_POINTS': {
      const result = await app.massRefundImprovementPoints.execute(message.heroId);
      return {
        ok: true,
        state: result.state,
        pointsRefunded: result.pointsRefunded,
        ascensionPointsRefunded: result.ascensionPointsRefunded,
        refundWarnings: result.warnings,
      };
    }
    case 'PREVIEW_MASS_REFUND_IMPROVEMENT_POINTS': {
      const state = await app.getState.execute();
      const massRefundPreview = await app.previewMassRefundImprovementPoints.execute(
        message.heroId,
      );
      return { ok: true, state, massRefundPreview };
    }
    case 'GET_HERO_SKILL_TREE': {
      const result = await app.getHeroSkillTree.execute(message.heroId);
      return { ok: true, state: result.state, skillNodes: result.nodes };
    }
    case 'ASSIGN_SKILL_SLOT': {
      const state = await app.assignSkillSlot.execute(
        message.heroId,
        message.skillId,
        message.slotIndex,
      );
      return { ok: true, state };
    }
    case 'DEACTIVATE_SKILL': {
      const state = await app.deactivateSkill.execute(message.heroId, message.skillId);
      return { ok: true, state };
    }
    case 'ASCEND_CLASS': {
      const state = await app.ascendClass.execute(message.heroId, message.ascensionId);
      return { ok: true, state };
    }
    case 'GET_HERO_ASCENSION_TREE': {
      const result = await app.getHeroAscensionTree.execute(message.heroId);
      return {
        ok: true,
        state: result.state,
        ascensionOptions: result.options,
        ascensionName: result.ascensionName,
        ascensionSkillNodes: result.ascensionSkillNodes,
      };
    }
    case 'SPEND_ASCENSION_POINT': {
      const state = await app.spendAscensionPoint.execute(message.heroId, message.skillId);
      return { ok: true, state };
    }
    case 'ADD_TO_PARTY': {
      const state = await app.addToParty.execute(message.heroId);
      return { ok: true, state };
    }
    case 'REMOVE_FROM_PARTY': {
      const state = await app.removeFromParty.execute(message.heroId);
      return { ok: true, state };
    }
    case 'MOVE_PARTY_MEMBER': {
      const state = await app.movePartyMember.execute(message.fromIndex, message.toIndex);
      return { ok: true, state };
    }
    case 'SET_PARTY_SLOT': {
      const state = await app.setPartySlot.execute(message.slotIndex, message.heroId);
      return { ok: true, state };
    }
    case 'EXPORT_SAVE_BACKUP': {
      try {
        const result = await app.exportSaveBackup.execute();
        const state = await app.getState.execute();
        return {
          ok: true,
          state,
          backupFile: result.backupFile,
          backupFileName: result.fileName,
        };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Falha ao exportar save',
        };
      }
    }
    case 'IMPORT_SAVE_BACKUP': {
      try {
        const state = await app.importSaveBackup.execute(message.backupFile);
        return { ok: true, state };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Falha ao importar save',
        };
      }
    }
    default:
      return { ok: false, error: 'Mensagem desconhecida' };
  }
}
