import { describe, expect, it } from 'vitest';
import { GameState } from '../../entities/GameState';
import { PhaseRun } from '../PhaseRun';
import { mainMissionId, normalMissionId, sideMissionId } from './MissionId';
import {
  applyMissionDefeat,
  applyMissionVictory,
  enterCampHub,
  startMissionOnState,
} from './ResolveMissionOutcome';
import { MissionProgress } from './MissionProgress';

describe('ResolveMissionOutcome', () => {
  it('vitória concede XP do orçamento da fase', () => {
    const phaseId = '1-1';
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(
        MissionProgress.initial().withActiveMission(mainMissionId(phaseId)),
      ),
    );
    const xpBefore = state.heroes[0]!.toProps().experience.current;

    const result = applyMissionVictory({
      state,
      phaseId,
      heroes: state.heroes,
      phaseDisplayName: 'Fase 1-1',
    });

    expect(result.state.heroes[0]!.toProps().experience.current).toBeGreaterThan(xpBefore);
  });

  it('vitória main marca concluída e prepara retorno ao camp sem próxima fase', () => {
    const phaseId = '1-1';
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(
        MissionProgress.initial().withActiveMission(mainMissionId(phaseId)),
      ),
    );

    const result = applyMissionVictory({
      state,
      phaseId,
      heroes: state.heroes,
      phaseDisplayName: 'Fase 1-1',
    });

    expect(result.missionId).toBe(mainMissionId(phaseId));
    expect(result.state.campaignProgress.missionProgress.isMainCompleted(mainMissionId(phaseId))).toBe(
      true,
    );
    expect(result.state.campaignProgress.missionProgress.activeMissionId).toBeNull();
    expect(result.state.combatIntermission?.variant).toBe('phase-clear');
    expect(result.state.combatIntermission?.nextPhaseId).toBeNull();
    expect(result.state.phaseRun).toBeNull();
  });

  it('vitória normal remove da oferta sem marcar main', () => {
    const phaseId = '1-2';
    const missionId = normalMissionId(phaseId);
    const progress = MissionProgress.initial()
      .withNormalOffer('stendra', [missionId, normalMissionId('1-3')], 0)
      .withActiveMission(missionId);
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(progress),
    );

    const result = applyMissionVictory({
      state,
      phaseId,
      heroes: state.heroes,
      phaseDisplayName: 'Fase 1-2',
    });

    expect(result.state.campaignProgress.missionProgress.normalOfferFor('stendra')).not.toContain(
      missionId,
    );
    expect(result.state.campaignProgress.missionProgress.completedMainIds).toHaveLength(0);
  });

  it('derrota normal remove da oferta e não concede recompensa de conclusão; main sem recompensa', () => {
    const phaseId = '1-2';
    const missionId = normalMissionId(phaseId);
    const progress = MissionProgress.initial()
      .withNormalOffer('stendra', [missionId], 0)
      .withActiveMission(missionId);
    const state = GameState.initial()
      .withPhaseRun(PhaseRun.start(phaseId))
      .withCampaignProgress(GameState.initial().campaignProgress.withMissionProgress(progress));
    const goldBefore = state.gold.value();
    const xpBefore = state.heroes[0]!.toProps().experience.current;

    const defeat = applyMissionDefeat({
      state,
      phaseId,
      phaseDisplayName: 'Fase 1-2',
    });

    expect(defeat.state.campaignProgress.missionProgress.normalOfferFor('stendra')).not.toContain(
      missionId,
    );
    expect(defeat.state.combatIntermission?.variant).toBe('defeat');
    // XP só na vitória (orçamento da fase); derrota não paga conclusão nem XP.
    expect(defeat.state.gold.value()).toBe(goldBefore);
    expect(defeat.state.heroes[0]!.toProps().experience.current).toBe(xpBefore);

    const mainState = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(
        MissionProgress.initial().withActiveMission(mainMissionId('1-1')),
      ),
    );
    const mainGold = mainState.gold.value();
    const mainDefeat = applyMissionDefeat({
      state: mainState,
      phaseId: '1-1',
      phaseDisplayName: 'Fase 1-1',
    });

    expect(
      mainDefeat.state.campaignProgress.missionProgress.isMainCompleted(mainMissionId('1-1')),
    ).toBe(false);
    expect(mainDefeat.state.campaignProgress.missionProgress.activeMissionId).toBeNull();
    expect(mainDefeat.state.gold.value()).toBe(mainGold);
  });

  it('derrota de secundária não concede ouro/XP/cena de conclusão', () => {
    const ashId = sideMissionId('stendra_ash_trail');
    const ashState = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(
        MissionProgress.initial()
          .markMainCompleted(mainMissionId('1-1'))
          .withActiveMission(ashId),
      ),
    );
    const goldBefore = ashState.gold.value();
    const defeat = applyMissionDefeat({
      state: ashState,
      phaseId: '1-6',
      phaseDisplayName: 'Trilha',
    });

    expect(defeat.state.gold.value()).toBe(goldBefore);
    expect(defeat.state.campaignProgress.missionProgress.isSideCompleted(ashId)).toBe(false);
    expect(defeat.state.campaignProgress.missionProgress.pendingNarrativeSceneIds).not.toContain(
      'side:stendra_ash_trail',
    );
  });

  it('enterCampHub bloqueia combate e conta visita (refresh a cada 2)', () => {
    const progress = MissionProgress.initial().withNormalOffer(
      'stendra',
      [normalMissionId('1-2')],
      0,
    );
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(progress),
    );

    const camp = enterCampHub(state, 'camp');

    expect(camp.loadoutEditOpen).toBe(true);
    expect(camp.phaseRestartOnResume).toBe(false);
    expect(camp.phaseRun).toBeNull();
    expect(camp.combat).toBeNull();
    expect(camp.campaignProgress.missionProgress.campVisitsSinceNormalRefresh).toBe(1);
    expect(camp.campaignProgress.missionProgress.offerEpochFor('stendra')).toBe(0);

    const camp2 = enterCampHub(camp, 'camp2');
    expect(camp2.campaignProgress.missionProgress.offerEpochFor('stendra')).toBe(1);
  });

  it('vitória side marca concluída e desbloqueia cena sem conceder ouro/XP', () => {
    const ashId = sideMissionId('stendra_ash_trail');
    const ashState = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(
        MissionProgress.initial()
          .markMainCompleted(mainMissionId('1-1'))
          .withActiveMission(ashId),
      ),
    );
    const goldBefore = ashState.gold.value();
    const xpBefore = ashState.heroes[0]!.toProps().experience.current;
    const result = applyMissionVictory({
      state: ashState,
      phaseId: '1-6',
      heroes: ashState.heroes,
      phaseDisplayName: 'Trilha',
    });
    expect(result.state.campaignProgress.missionProgress.isSideCompleted(ashId)).toBe(true);
    expect(result.state.gold.value()).toBe(goldBefore);
    expect(result.state.heroes[0]!.toProps().experience.current).toBe(xpBefore);
    expect(result.state.campaignProgress.missionProgress.pendingNarrativeSceneIds).toContain(
      'side:stendra_ash_trail',
    );
  });

  it('vitória side concede item exclusivo uma vez', () => {
    const cacheId = sideMissionId('stendra_hidden_cache');
    const state = GameState.initial().withCampaignProgress(
      GameState.initial().campaignProgress.withMissionProgress(
        MissionProgress.initial()
          .markMainCompleted(mainMissionId('1-1'))
          .markSideCompleted(sideMissionId('stendra_ash_trail'))
          .withActiveMission(cacheId),
      ),
    );

    const first = applyMissionVictory({
      state,
      phaseId: '1-8',
      heroes: state.heroes,
      phaseDisplayName: 'Cache',
    });

    expect(
      first.state.campaignProgress.missionProgress.awardedExclusiveItemIds,
    ).toContain('side_stendra_cache_charm');
    expect(
      first.state.inventory.some((gear) => gear.catalogItemId === 'side_stendra_cache_charm') ||
        first.state.stash.some((gear) => gear.catalogItemId === 'side_stendra_cache_charm'),
    ).toBe(true);

    const second = applyMissionVictory({
      state: first.state.withCampaignProgress(
        first.state.campaignProgress.withMissionProgress(
          first.state.campaignProgress.missionProgress.withActiveMission(cacheId),
        ),
      ),
      phaseId: '1-8',
      heroes: first.state.heroes,
      phaseDisplayName: 'Cache',
    });
    const charmCount = [...second.state.inventory, ...second.state.stash].filter(
      (gear) => gear.catalogItemId === 'side_stendra_cache_charm',
    ).length;
    expect(charmCount).toBe(1);
  });

  it('startMissionOnState rejeita side ainda bloqueada', () => {
    const result = startMissionOnState({
      state: GameState.initial(),
      missionId: sideMissionId('stendra_ash_trail'),
    });

    expect(result.error).toMatch(/indisponível/i);
  });

  it('startMissionOnState aceita próxima main e mantém camp', () => {
    const result = startMissionOnState({
      state: GameState.initial(),
      missionId: mainMissionId('1-1'),
    });

    expect(result.error).toBeUndefined();
    expect(result.state.campaignProgress.selectedPhaseId).toBe('1-1');
    expect(result.state.campaignProgress.missionProgress.activeMissionId).toBe(
      mainMissionId('1-1'),
    );
    expect(result.state.loadoutEditOpen).toBe(true);
    expect(result.state.phaseRestartOnResume).toBe(true);
  });
});
