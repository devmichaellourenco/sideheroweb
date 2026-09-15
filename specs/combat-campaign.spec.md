# Spec — Combate e Campanha

## Status

**Aceite:** 20/20 (100%) · escopo base v1 + integração camp-missions  
**Testes obrigatórios:** 12/12 grupos (inclui `CampaignReleaseScope` + `PhaseChallengeCatalog` + `WaveEnemyCap` + outcome)

## Objetivo

O jogador avança em **fases** com **waves** de inimigos, com combate em tempo real na battle strip, intermissões visuais e progressão de stage/tier.

> **Transição (camp-missions):** o loop de produto passa a ser **acampamento → mapa → missão → batalha → resultado → acampamento**. Auto-avanço de fase e wipe→fase anterior serão substituídos — ver [`camp-missions.spec.md`](camp-missions.spec.md). O combate por waves **dentro** de uma missão ativa permanece nesta spec.

## Critérios de aceite — legado linear (superseded por camp-missions)

Os itens abaixo descrevem o v1 linear entregue; a feature [`camp-missions`](camp-missions.spec.md) **substitui** o fluxo de seleção/auto-avanço/wipe entre fases:

- [x] ~~Wipe na fase: cura completa + reinicia wave 1 da mesma fase~~ → alvo: volta ao acampamento; ver camp-missions
- [x] ~~Seleção de fase: apenas desbloqueadas ou já concluídas (replay)~~ → alvo: board de missões
- [x] ~~Overlay CLEAR/WARNING/VITÓRIA antes da próxima wave/fase~~ → CLEAR/WARNING entre waves **da missão**; VITÓRIA de missão → resultado → camp

## Critérios de aceite — combate (permanecem)

- [x] Tick avança combate quando não pausado; respeita `combatIntermission`, pausa de loadout e **pausa de batalha** (`battlePaused`)
- [x] Pausa de batalha: congela o combate no estado atual (sem reiniciar fase); Continuar retoma; sem edição de party/loadout; Detalhes exibe totais da tentativa (dano/cura/sofrido)
- [x] Recompensas por kill: ouro e loot ao derrotar cada inimigo; XP só na vitória da fase (`targetXp` / `grantPhaseVictoryXp`)
- [x] Boss: loot garantido na 1ª vitória do template; depois chance normal de role (sem penalidade de “replay”); progresso de missão no fim
- [x] Scaling de inimigos segue level (difficultyTier ou `slot.level`) via `EnemyProgressionCatalog` (BAL-013)
- [x] No máximo **3 inimigos por wave** (`WaveEnemyCap` / `MAX_ENEMIES_PER_WAVE`)
- [x] Skills inimigas e heróis resolvem via `CombatActionExecutor` com elementos (`physical`/`fire`/`cold`/`lightning`/`air`) e status
- [x] Persistência migra saves legados: gear/stats `chaos*` → `air*`, IDs `chaos_mantle`/`chaos_pendant` → `air_*`, `dotElement: chaos` → `air`
- [x] Identidade de combate por mapa base (Stendra→Morthaven): bias soft de pool + resists (−15/+20); X-50 temáticos
- [x] Micro-desafios de fase (BAL-011): race / sustain / spike / warded (anti-mago) / armored (anti-físico) com hint na UI — âncoras Stendra→Morthaven
- [x] Recompensas de gear comuns e únicas chegam em baús; Ignus Ix, Vorpal Lupnus, Soler Plégius e Selo de Morthaven só entram no storage quando o baú é aberto

## Critérios de aceite — integração camp-missions (novos)

- [x] Fim de missão (boss clear ou wipe) não auto-inicia outra missão/fase
- [x] Handlers de outcome delegam ao fluxo de missões (vitória/derrota → camp) via `ResolveMissionOutcome` / `PhaseCombatHandlers`
- [x] Templates de wave/fase existentes reutilizados por `MissionDefinition` (marcos = main; intermediárias = pool normal)

## Escopo do jogo base (v1)

**Objetivo:** A campanha jogável termina em **Morthaven** (`4-50`, tier 200). Regiões 5–10 permanecem no catálogo para DLC futuro até o Trono do Vazio (`10-50`).

### Mapa de release

| Perfil | Última região | Finale | Fases jogáveis | Tier máximo |
|--------|---------------|--------|----------------|-------------|
| `base` (v1) | Morthaven | `4-50` | 200 | 200 |
| `full` (futuro) | Trono do Vazio | `10-50` | 500 | 500 |

### Regiões do jogo base

| mapId | Nome | Tiers |
|-------|------|-------|
| `stendra` | Stendra | 1–50 |
| `gruftall` | Gruftall | 51–100 |
| `valdris` | Valdris | 101–150 |
| `morthaven` | Morthaven | 151–200 |

### Regiões reservadas (DLC)

`broken_sky`, `crimson_abyss`, `eternal_forge`, `ancient_grove`, `twilight_tower`, `void_throne` — existem em `CAMPAIGN_MAPS` e `HANDCRAFTED_PHASES`, mas ficam ocultas no perfil `base`.

### Critérios de aceite — escopo

- [x] Perfil de release centralizado em `CampaignReleaseScope` (domínio)
- [x] UI de campanha lista apenas mapas 1–4 no perfil `base`
- [x] Vitória em `4-50` marca `seasonCompleted` e dispara meta/legado
- [x] `4-50` não desbloqueia `5-1` no perfil `base`
- [x] Seleção/jogo de fase DLC rejeitada no perfil `base`
- [x] Saves com `selectedPhaseId` ou tier além do escopo são clampados na carga (progresso DLC preservado)
- [x] Catálogo completo (mapas 5–10) permanece no código para desenvolvimento de DLC

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `src/domain/campaign/*` (incl. `CampaignReleaseScope`), `src/domain/services/combat/*`, `src/domain/combat/*` |
| Application | `TickGameUseCase`, `ResumeCombatIntermissionUseCase`, `PauseBattleUseCase`, `ResumeBattleUseCase`, `SelectPhaseUseCase`, `GetCampaignOverviewUseCase` |
| Presentation | `BattleStripRenderer`, `BattleVictoryFlow`, `CampaignMapPresentation`, `CampaignModalRenderer`, `CampaignTooltipBinder`, `CampaignFlow` |

## Invariantes

- Domínio não conhece Chrome nem DOM
- `phaseRun` nulo + tick **não** inicia fase (hub do acampamento); combate só via `START_MISSION` + restart
- Herói derrotado não permanece como turno ativo
- Dano/cura publicados como eventos para UI (`CombatFloatingEvent`)

## Fora de escopo

- Sprites novos de inimigos (arte incremental)
- PvP ou combate manual por turno do jogador

## Lore — regiões do jogo base

**Gruftall** (`gruftall`, T51–100): terra desolada sob o domínio destrutivo de Gonodor. Cinzas espessas, ruínas e crateras; ar sufocante que aterroriza os fracos. Quase nada vive além de monstros errantes e o próprio Gonodor.

**Fase 2-50:** os heróis enfrentam **Gonodor** — na verdade apenas uma **centelha** de seu poder, enquanto o verdadeiro Gonodor está a quilômetros (fora do alcance do nível atual dos heróis). Título da fase: **Centelha de Gonodor**. Background narrativo; não precisa ser exposto na UI além do nome da fase.

**Fase 4-50 (finale v1):** **Duque de Morthaven** — boss de capítulo que encerra a temporada no jogo base.

## Testes obrigatórios

- [x] `GetCampaignOverviewUseCase.test.ts`, `SelectPhaseUseCase.test.ts` — escopo base na overview e seleção
- [x] `CampaignReleaseScope.test.ts` — perfil base, finale, clamp de save
- [x] `PhaseCombatHandlers.test.ts`, `EnemyKillRewardService.test.ts`, `EnemyLootTable.test.ts`
- [x] `CombatTurnPhase.test.ts`, `CombatActionExecutor.test.ts`
- [x] `EncounterResolver.test.ts`, `WaveEnemyFactory.test.ts`, `EnemyProgressionCatalog.test.ts`
- [x] `PauseBattleUseCase.test.ts` — pausa/retoma preservando combate e phaseRun
- [x] `BattleVictoryFlow.test.ts` — terminal clear/defeat aguarda Continuar; intermissões de wave auto-dismiss
- [x] `BattleStartFlow.test.ts` — cue START antes do combate
- [x] `CampaignMapPresentation.test.ts`, `CampaignTooltipBinder.test.ts`, `CampaignModalRenderer.test.ts` — mapa, trilha e tooltips
- [x] `ResolveMissionOutcome.test.ts` — vitória/derrota por tipo; fração de recompensa em derrota normal (ver também `camp-missions`)
- [x] `MapCombatIdentityCatalog.test.ts`, `EnemyTierProgression.mapBias.test.ts`, `MilestonePhaseBlueprints.theme.test.ts` — identidade por mapa
- [x] `PhaseChallengeCatalog.test.ts` — micro-desafios BAL-011 multi-slot (4 mapas base)
- [x] `WaveEnemyCap.test.ts` — teto de 3 inimigos por wave em todo o catálogo
- [x] `UniqueGearLootService.test.ts` — inclui Selo de Morthaven (4-50)

## Relacionado

- [`camp-missions.spec.md`](camp-missions.spec.md) — hub acampamento, board de missões, fim de batalha → camp
- [`stage-progress-bar.spec.md`](stage-progress-bar.spec.md) — timeline visual das waves da fase ativa
- [`battle-ui.spec.md`](battle-ui.spec.md) — chrome / strip
