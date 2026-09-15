# Spec — Battle UI e UX do Painel

## Status

**Aceite:** 26/26 (100%) · auditoria 2026-08-11  
**Testes obrigatórios:** 19/19 presentes na suite

## Objetivo

Interface HTML5 itch.io (shell 960×740): battle strip 666×266 e menus no rodapé; Loja/Heróis/Runas etc. em **overlay central** (podem cobrir a batalha); **Log e Estatísticas** ficam **abaixo da battle-stage** sem cobrir a cena; o rail permanece visível.

## Critérios de aceite

- [x] Modais de inventário/heróis/melhorias/forja/runas/config no **palco central** (`#systems-dock-stage`), largura `min(920px, 100% − 24px)`; podem **sobrepor** a battle strip. **Log e Estatísticas** ancoram **abaixo** de `.battle-stage` (não cobrem a cena). O rail inferior permanece visível e clicável. `BattleChromeLayout` ancora o palco e a base da battle-stage
- [x] Wow: celebrações centrais; inbox no header (✦) com pendências persistentes (`buildPersistentWowBanners` + `syncPersistentBanners`); strip dismiss sem repetir
- [x] Overlay de derrota sugere contramedida (resist elemental quando detectável)
- [x] Todo card Wow exibe botão de rodapé (padrão **Entendi** para dispensar); o [×] só aparece em CTAs de ação no modo center
- [x] Baú flutuante na batalha quando pendente
- [x] Pausa loadout / hub: mapa embutido no `battle-field` (substitui overlay ACAMPAMENTO); após Continuar do resultado o mapa reaparece no hub
- [x] Pausa de batalha (≠ acampamento): overlay PAUSA + Continuar; stats sempre no menu (abrem ao iniciar missão)
- [x] Menu **Stats** (runa): painel **abaixo da batalha**; atualiza em tempo real; abas Geral | Dano | Cura | Sofrido | Mitigado | Críticos; abas Dano / Sofrido / Mitigado com ranking por tipo de dano; **Por skill** exibe CD com tooltip do cálculo (turns×s, level, CDR)
- [x] Compra de runa não gera Wow duplicado quando o mesmo evento já dispara unlock de herói/feature (`isUpgradePurchaseCoveredByStateChange`)
- [x] Todos os menus da barra de sistemas (`SystemsMenuId`) abrem na própria página (overlays/sheets); sem janelas destacadas nem pin
- [x] **Iniciar missão** no mapa inicia o combate na mesma página e abre **Estatísticas** automaticamente
- [x] Overlays interruptivos (tutorial, cena, resultado de batalha, Wow) **não se sobrepõem**: `UiOverlayOrchestrator` com prioridade tutorial > cena > batalha > Wow; o restante espera na fila
- [x] Overlay de cena narrativa e celebrações Wow bloqueiam ticks até dispensar
- [x] Rail **inferior** (`footer.actions.app-shell-rail`, base do shell): sistemas que abrem telas + **Abrir baú** / **Abrir todos** nas ações rápidas (**Otimizar equipe** desativado); IDs `#open-*-btn` preservados. Sem faixa de ícones dentro dos sheets
- [x] Sheets de sistema (modal, hero drawer, Log, Stats): seta para baixo fecha; **segundo clique no mesmo ícone do rail** fecha o sheet aberto (toggle). Mapa embutido do hub **não** conta como modal de campanha. Troca de sistema só pelo rail inferior (`SystemsMenuNavigation` para disponibilidade)
- [x] Onboarding contextual pausa entre dicas (`OnboardingPolicy`); spotlight com furo no véu escuro no âncora (sem véu claro cobrindo o alvo); clone visual do âncora no overlay (`onboarding-anchor-clone`) para ícone/texto legíveis (ex.: Abrir baú); dica de runa (`first-upgrade`) só no acampamento (`canEditParty`), nunca no meio do combate
- [x] Primeira sessão: após a cena de abertura, card **de boas-vindas** central (`variant: 'welcome'`, sem âncora) cujo CTA abre o mapa; em seguida o tutorial guiado do mapa (pinos → preview do local → Iniciar missão) com passos ancorados em `.campaign-mission-pin--main`, `.campaign-mission-popover` e `.campaign-phase-preview-start`. Passos do mapa só disparam com o mapa aberto (`OnboardingUiContext`) e param após a primeira fase concluída ou ao iniciar a primeira missão
- [x] Barras de vida: heróis verdes, inimigos vermelhas; texto só da vida atual (negrito) sobre barra fina; tooltip com atual/máx; HP no deck da strip
- [x] Barras de TTA: countdown regressivo (herói/inimigo) sobre a barra; tooltip com ASPD e cálculo `1÷ASPD`; cadência no painel Estatísticas e na ficha Status
- [x] Battle field: cena **666×266** (dobro da arte 333×133); deck HUD opaco (~50px) abaixo com HP + TTA + skills alinhados coluna a coluna; overlays de resultado/START cobrem cena + deck (Continuar no espaço do deck; sem scroll)
- [x] Botão **Apoiar** no header (direita) abre card de doação voluntária; link Stripe em nova aba; jogo permanece 100% gratuito
- [x] Heróis / Formação / Loja / Inventário / Baús só aparecem no **acampamento** (`canEditParty`)
- [x] Pista de combate do mapa (ameaça/favorável) no tooltip da campanha e header do mapa; eficácia vs área nas stats de skill
- [x] Splash `splash_screen.png` na abertura da página (≥5s) antes de tutorial/Wow/loop de batalha (`SplashScreenController`)
- [x] Tooltips dos menus do rodapé usam portal RPG (`MenuTooltipBinder`) — pergaminho, selo ouro, categoria e flavor; sem `title` nativo do navegador

## Critérios — camp-missions (novos)

- [x] Modal de campanha: mapa-mundo + **mapa de locais** (missões disponíveis), sem trilha linear como UX principal
- [x] Detalhe de missão: tipo, estrelas, preview waves/monstros/stats, CTA iniciar (popover no pin; ver `camp-missions`)
- [x] Tela/fluxo de resultado pós-batalha: CLEAR/DEFEAT → tela só de recompensas (sem headline nem Ocultar; sem scroll; Continuar no deck) → Continuar → hub com **mapa embutido**. O mapa **não** substitui o resultado; `GET_STATE`/load não reabre o hub enquanto a intermissão terminal está pendente
- [x] Acampamento permanece hub de party/loja/inventário; combate só após iniciar missão
- [x] **Iniciar missão** no mapa fecha o mapa, mostra cue **START**, e só então inicia o combate (sem clique extra em Batalhar)
- [x] Hub pós-missão sem reinício via barra — botão Acampamento mid-missão **oculto**; Batalhar oculto; retomar só pelo mapa
- [x] New game mostra mapa embutido no hub (`loadoutEditOpen`); save persiste o hub sem exigir restart
- [x] Overlay ACAMPAMENTO tem fundo opaco cobrindo todo o `.battle-field` (cena + deck de HUD), sem sprites/barras ao fundo sugerindo combate ativo; pausa de batalha segue translúcida e restrita à cena para mostrar o campo congelado
- [x] Cue **START** precede o combate ao iniciar missão no mapa

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Presentation | `panel/panel.html`, `panel.css`, `GameViewController`, `GameHudController` |
| Presentation | `BattleChromeLayout`, `WowBannerBuilder`, `WowBannerCtaPresentation`, `WowStripRenderer`, `RewardOrchestrator`, `OnboardingPolicy` + `OnboardingStepCatalog`, `DonationCardPresentation` |
| Presentation | `ModalStackController`, `SystemsMenuNavigation`, `BattleChestAffordanceController` |
| Presentation | `MenuTooltipCatalog`, `MenuTooltipBinder`, `MenuTooltipPresentation` |
| Presentation | `UiOverlayOrchestrator` — exclusividade tutorial/cena/batalha/Wow |

## Invariantes

- Presentation consome `GameStateDto` — não importar entidades de domínio
- Tooltips e drag não quebram scroll de modais abertos
- Atualizar testes de políticas de apresentação após mudanças em markup (criar/atualizar arquivos — execução manual)

## Fora de escopo

- Tema claro / acessibilidade WCAG completa

## Testes obrigatórios

- [x] `BattleChromeLayout.test.ts` — palco central + âncora de Log/Stats abaixo da battle-stage
- [x] `WowBannerBuilder.test.ts`, `WowBannerCtaPresentation.test.ts`, `WowStripRenderPolicy.test.ts`
- [x] `OnboardingPolicy.test.ts` — inclui boas-vindas e passos do tutorial do mapa
- [x] `OnboardingController.test.ts` — spotlight/clone do âncora e card central de boas-vindas
- [x] `IdleProgressSummary.test.ts`
- [x] `BattleLogRenderer.test.ts` — log incremental no painel
- [x] `CampaignMapPresentation.test.ts`, `CampaignTooltipBinder.test.ts` (campanha — ver também `combat-campaign.spec.md`)
- [x] `DonationCardPresentation.test.ts` — copy gratuito + link Stripe
- [x] `GameHudController.test.ts` — botões de acampamento ocultos fora de `canEditParty`; Pausar/Continuar/Detalhes na pausa de batalha
- [x] `BattleStatsPresentation.test.ts` — painel de estatísticas da batalha pausada
- [x] `BattleSessionStatsMapper.test.ts` — CD e tooltip de cálculo por skill
- [x] `ModalController.test.ts` — título e shell do modal
- [x] `SystemsMenuNavigation.test.ts` — disponibilidade por camp/unlock + wrap prev/next; segundo clique no rail fecha o sheet (mapa embutido não conta)
- [x] `UiOverlayOrchestrator.test.ts` — prioridade e fila de overlays exclusivos
- [x] `SplashScreenController.test.ts` — splash de abertura antes do loop
- [x] `MenuTooltipBinder.test.ts`, `MenuTooltipPresentation.test.ts` — tooltips RPG dos menus
- [x] `BattleHudDeckLayout.test.ts` — cena + deck HUD + palco central de sistemas + rail inferior (IDs, sem ícones nos sheets)
- [x] `ActionTimeBarPresentation.test.ts` — countdown e tooltip de cálculo TTA
- [x] `BattleVictoryFlow.test.ts` — clear/defeat revelam detalhes (sem headline) e aguardam Continuar; wave-clear auto-dismiss
- [x] `EmbeddedCampaignMapPolicy.test.ts` — mapa embutido só após Continuar (não durante CLEAR/DEFEAT)
- [x] `BattleVictoryDetector.test.ts` — derrota usa baseline da tentativa para ouro/XP dos kills
- [x] `BattleAttemptRewardBaseline.test.ts` — snapshot do hub no START
- [x] `BattleStartFlow.test.ts` — cue START bloqueia avanço e dispara início ao dismiss

## Relacionado

- [`camp-missions.spec.md`](camp-missions.spec.md) — mapa de missões, resultado → acampamento
- [`stage-progress-bar.spec.md`](stage-progress-bar.spec.md) — timeline entre localização e a battle strip
- [`combat-campaign.spec.md`](combat-campaign.spec.md) — waves / fase ativa
- [`medieval-theme.spec.md`](medieval-theme.spec.md) — paleta medieval do chrome (tutorial)
