---
name: combat-campaign
description: Implementa combate em tempo real, campanha por fases/waves, tick e intermissões no Side Hero. Use para combate, boss, wave, fase, tick, PhaseCombatHandlers, CombatActionExecutor ou campanha.
---

# Combate e Campanha

## Spec

`specs/combat-campaign.spec.md`

## Fluxo de implementação

1. Regra nova → `domain/campaign` ou `domain/services/combat`
2. Orquestração → use case (`TickGameUseCase`, etc.)
3. UI de resultado → `presentation/flows/BattleVictoryFlow`, strip
4. Testes listados na spec — criar ou atualizar; não executar automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes

## Padrões

- Boss vs wave: `PhaseCombatHandlers.onBossDefeated` vs `onWaveCleared`
- XP na vitória da fase (`grantPhaseVictoryXp` / `targetXp`); kills pagam ouro/loot
- Intermissão: setar `combatIntermission`, não avançar combate até resume
- Pausa de batalha: `battlePaused` mantém `combat`/`phaseRun`; ticks no-op até `ResumeBattleUseCase`
- Stats da tentativa: `battleSessionStats` (geral/herói/skill/elementos/mitigação); reset ao iniciar/reiniciar fase; UI sempre disponível (abre ao iniciar missão)
- Timeline visual da fase: skill `stage-progress-bar` (roles trash/elite/boss → marcadores)
- Identidade de mapa: `MapCombatIdentityCatalog` + `pickCommonForMapPhase` (bias soft) + resists via `resolveEnemyInnateResists(..., mapId)`
- **Loop de produto (novo):** skill `camp-missions` — fim de missão → CLEAR/DEFEAT → detalhes de recompensa → Continuar → camp; sem auto-próxima fase; tick com `phaseRun` nulo é no-op
- Auto-batalha 1×: intervalo de tick = `COMBAT_DELTA_SECONDS × 1000` ms (TTA/CD alinhados ao tempo real); 2×/3× dividem o intervalo
- Overlay terminal (`phase-clear` / `defeat`): `BattleVictoryFlow` anima CLEAR/DEFEAT, depois troca para tela só de recompensas (sem Ocultar); Continuar → camp + abre o mapa; waves intermediárias ainda auto-dismiss

## Arquivos frequentes

- `PhaseCombatHandlers.ts`, `CombatTurnPhase.ts`, `CombatActionExecutor.ts`
- `HandcraftedPhaseCatalog.ts`, `PhaseDisplayNameCatalog.ts`, `EnemyProgressionCatalog.ts`, `WaveEnemyFactory.ts`
- `HeroCombatIdentityCatalog.ts`, `EnemyCombatIdentityCatalog.ts` — básico, CD/turno, ASPD, crescimento por combatente
- `CampaignMapPresentation.ts`, `CampaignModalRenderer.ts`, `CampaignTooltipBinder.ts`
