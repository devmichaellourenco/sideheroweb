---
name: battle-ui
description: Battle strip, modais, Wow e UX do painel Side Hero. Use para battle strip, modal, wow, onboarding, panel.css, GameViewController ou HUD.
---

# Battle UI e UX

## Spec

`specs/battle-ui.spec.md`

## Princípios

- Batalha e barra Pausar/Acampamento na coluna de combate (cena 666×266)
- Fundo único da strip (`strip-bg--unified`): preenche 666×266 com `background-size: 100% 100%` e sem repeat. Não usar `background:` shorthand em regras `[data-map-id]` — isso reseta size/repeat e replica a arte 333×133 em 2×2.
- Sistemas: Loja/Heróis/etc. em overlay central (`#systems-dock-stage`); Log e Stats abaixo da `.battle-stage`; menus só no rodapé; `BattleChromeLayout` ancora o palco e a base da batalha
- Presentation só usa `GameStateDto`

## Áreas

| Área | Arquivos |
|------|----------|
| Strip | `BattleStripRenderer`, `BattleActorCardPresentation`, `BattleFloatingTextController` (`Lv UP`); cena `.battle-strip` + deck `.battle-hud-deck` em `.battle-field`; TTA com countdown + tooltip (`ActionTimeBarPresentation`) |

| Pausa | Pausar/Continuar à **esquerda**; botão **Acampamento** mid-missão na barra **oculto** (hub só pós-missão / mapa); Batalhar oculto (mapa → START → combate) |
| Hub | New game / pós-missão: `loadoutEditOpen` + **mapa embutido** no `battle-field`; ícone Mapa expande para modal |
| Mapa embutido | `#camp-campaign-map-root` — só pins; preenche o `battle-field` sem scroll; tema do painel (não o reset light da batalha); mapa-mundo no modal expandido |
| Overlay Acampamento | Removido no hub — `.battle-pause-overlay` só na **pausa de batalha** (`--battle`, translúcido na strip) |
| Splash | `SplashScreenController` — ≥5s antes de tutorial/Wow/auto-battle |
| Stage progress | Ver skill `stage-progress-bar` — timeline entre localização e a strip |
| Resultado / START | `BattleVictoryFlow` + `BattleStartFlow`; Continuar no deck; recompensas sem scroll; START só no botão **Batalhar** (Iniciar missão no mapa vai direto ao tick) |
| Stats | Sempre no rail; abre automaticamente ao iniciar missão; painel abaixo da battle-stage |
| Modais | `ModalStackController`, `GameViewController`, `SystemsMenuNavigation`, `SystemsMenuIconPresentation` |
| Navegação menus | Rail inferior (`footer.actions`); sheets só com seta v para fechar; segundo clique no mesmo ícone fecha o sheet. Loja/Formação/Runas/Achievements/Config fecham pela pilha do modal + trackedId (Log/Stats não roubam o toggle). Mapa embutido do hub não é o modal de campanha |
| Apoio | `DonationPromptController`, `DonationCardPresentation`, `DonationConfig` |
| Wow | `WowBannerBuilder`, `WowCelebrationController.syncPersistentBanners`, `WowStripRenderer` |
| Onboarding | `OnboardingPolicy` (gatilhos + `OnboardingUiContext`) e `OnboardingStepCatalog` (textos/âncoras); primeira sessão = boas-vindas central → mapa aberto pelo CTA → tutorial guiado do mapa; dica de runa só no acampamento, nunca no combate |
| Overlays exclusivos | `UiOverlayOrchestrator` — prioridade tutorial > cena > resultado de batalha > Wow; um ativo por vez, fila pelo restante |

## Coordenação

Tema de cores do chrome: skill `medieval-theme` (`specs/medieval-theme.spec.md`).

Overlays interruptivos (tutorial, cena narrativa, CLEAR/DEFEAT → recompensas, START, Wow central) passam pelo `UiOverlayOrchestrator` em `GameViewController` / `WowCelebrationController` (resultado/START bloqueiam ticks via flows). Pausa de batalha fica fora (estado do jogador). Resultado terminal: Continuar → hub com mapa embutido. Intermissão `phase-clear`/`defeat` **bloqueia** o mapa e o `canEditParty` até o Continuar; load do save não reabre o hub nesse meio. Início de missão: mapa → START → combate.
## Testes de apresentação

Listados em `specs/battle-ui.spec.md` — criar ou atualizar ao mudar markup/CSS crítico (não executar `npm test` automaticamente).

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
