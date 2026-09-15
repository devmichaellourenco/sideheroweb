---
name: battle-ui
description: Battle strip, modais, Wow e UX do painel Side Hero. Use para battle strip, modal, wow, onboarding, panel.css, GameViewController ou HUD.
---

# Battle UI e UX

## Spec

`specs/battle-ui.spec.md`

## Princípios

- Batalha e barra Pausar/Acampamento sempre visíveis no topo
- Modais/drawers abaixo de `--panel-sheet-top` (`BattleChromeLayout` — base da `.battle-combat-bar`)
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
| Stats | Sempre no menu; abre automaticamente ao iniciar missão; overlay na página |
| Modais | `ModalStackController`, `GameViewController`, `SystemsMenuNavigation`, `SystemsMenuIconPresentation` |
| Navegação menus | Faixa de ícones nos sheets (modal/drawer/Log/Stats) + seta v para fechar |
| Apoio | `DonationPromptController`, `DonationCardPresentation`, `DonationConfig` |
| Wow | `WowBannerBuilder`, `WowCelebrationController.syncPersistentBanners`, `WowStripRenderer` |
| Onboarding | `OnboardingPolicy` (gatilhos + `OnboardingUiContext`) e `OnboardingStepCatalog` (textos/âncoras); primeira sessão = boas-vindas central → mapa aberto pelo CTA → tutorial guiado do mapa; dica de runa só no acampamento, nunca no combate |
| Overlays exclusivos | `UiOverlayOrchestrator` — prioridade tutorial > cena > resultado de batalha > Wow; um ativo por vez, fila pelo restante |

## Coordenação

Tema de cores do chrome: skill `medieval-theme` (`specs/medieval-theme.spec.md`).

Overlays interruptivos (tutorial, cena narrativa, CLEAR/DEFEAT → recompensas, START, Wow central) passam pelo `UiOverlayOrchestrator` em `GameViewController` / `WowCelebrationController` (resultado/START bloqueiam ticks via flows). Pausa de batalha fica fora (estado do jogador). Resultado terminal: Continuar → hub com mapa embutido. Início de missão: mapa → START → combate.
## Testes de apresentação

Listados em `specs/battle-ui.spec.md` — criar ou atualizar ao mudar markup/CSS crítico (não executar `npm test` automaticamente).

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
