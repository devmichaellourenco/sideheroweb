---
name: camp-missions
description: Acampamento, mapa de missões e tipos principal/secundária/normal no Side Hero. Use para mission board, quest principal/secundária, missão normal, estrelas, CampMissionBoard, unlock de missões ou retorno ao acampamento pós-batalha.
---

# Acampamento, Mapa e Missões

## Spec

`specs/camp-missions.spec.md`

## Quando usar

- Board do mapa, tipos de missão, estrelas, oferta normal
- Fim de batalha → resultado → acampamento
- **Iniciar missão** → START → combate (sem Batalhar no hub)
- Unlock de secundárias / próxima principal
- UI de locais no modal de campanha

## Fluxo de implementação

1. Domínio → `src/domain/campaign/missions/`
2. Progresso/save → `CampaignProgress` (+ migração)
3. Fim de combate → `ResolveMissionOutcome` / handlers (sem auto-fase)
4. Use cases + SW messaging
5. UI → `CampaignFlow` / mapa de locais + preview no pin (popover; tooltip de stats nos inimigos)
6. Testes listados na spec — criar/atualizar; **não** executar `npm test`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes

## Regras de produto (resumo)

- Normal = 2–4, mapa×estrela; **capítulo da main atual** (ex.: main 1-1 → só fase 1; main 1-10 → templates 2–10); podem **repetir** em próximos sorteios com ouro/XP **cheios** (não são “replay”); some na derrota da oferta atual; refresh a cada N visitas ao camp
- Sem penalidade de ouro/XP por template já cleared; main/side são únicas
- Secundária = únicas; só as vinculadas ao capítulo da main (template na mesma faixa); unlock/expiração por grafo
- Principal = marcos `x-1, x-10, …, x-50`; próxima incompleta no board; não repetível
- New game: party **Nix solo**; unlocks Galneon→Elara→… na árvore com gates de main; inicia no hub Acampamento (`loadoutEditOpen`); cena de abertura → boas-vindas → mapa aberto automaticamente + tutorial guiado (skill `battle-ui`)
- Vitória/derrota → CLEAR/DEFEAT → tela de recompensas (sem scroll; Continuar no deck) → acampamento + mapa
- Iniciar no mapa → cue START → combate + abrir Estatísticas; mapa embutido no hub; ícone Mapa expande modal; unpin retransmite ao painel principal
- XP/ouro: ouro nos kills (`targetGold`); XP = orçamento `targetXp` só na vitória (`grantPhaseVictoryXp`). Derrota: ouro parcial dos kills, XP 0. Overlay CLEAR/DEFEAT usa baseline do START (`BattleAttemptRewardBaseline`)
- Preview/CTA só ao clicar no pin (quest card: tipo, ouro/XP, bônus item/cena, ameaça, inimigos, CTA; sem footer permanente)
- Região: título + bioma compactos; painel do mapa com padding mínimo; progresso só no hover; troca via mapa-mundo
- Pins do mapa com margem segura (não cortam no topo/laterais)
- Clique fora do popover fecha a seleção; popover em portal com clamp na viewport/scrollport (sempre visível)
- Tooltip de inimigo: grade compacta com ícones de stats (~3 por linha)

## Coordenação

- Combate/waves: skill `combat-campaign`
- HUD/acampamento/modal: `battle-ui`
- Timeline na missão: `stage-progress-bar`
- Cenas: `story-scenes`
- Loot: `gear-loot`
- Coordenação de números: skill `game-balance` + Balance Lab (abas Missões e Lojas)

## Arquivos frequentes (alvo)

- `MissionCatalog.ts`, `MissionSceneCatalog.ts`, `MissionUnlockGraph.ts`, `NormalMissionOffer.ts`, `CampMissionBoard.ts`
- `GetMissionBoardUseCase`, `StartMissionUseCase`, `ResolveMissionOutcomeUseCase`
- `MissionMapLayoutCatalog` (slots % Stendra), `CampaignMissionMapPresentation` (popover no pin), `CampaignModalRenderer`, `CampaignFlow`
