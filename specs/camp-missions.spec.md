# Spec — Acampamento, Mapa e Missões

## Status

**Aceite:** 23/23 (100%) · Fases 0–6  
**Testes obrigatórios:** 18/18

## Objetivo

Substituir o avanço automático de fases por um loop **acampamento → mapa → missão → batalha → resultado → acampamento**. O jogador escolhe missões no mapa; há três tipos (principal, secundária, normal) com regras distintas de disponibilidade, derrota e recompensa.

## Loop canônico

```
Acampamento → abrir mapa → escolher missão → batalha (waves)
  → vitória ou derrota → tela de resultado/recompensas → Acampamento
```

- Não há auto-avanço para a próxima fase/missão após limpar waves ou boss.
- Waves **dentro** de uma missão ativa continuam com intermissões CLEAR/WARNING (timeline: `stage-progress-bar`).
- Sistemas de party/loja/inventário/formação permanecem restritos ao **acampamento**.

## Tipos de missão

| Tipo | Papel | Repetível? | No mapa |
|------|--------|------------|---------|
| **Principal** (`main`) | Avança a história do mapa (marcos) | Não, após concluir | Sempre a **próxima** incompleta |
| **Secundária** (`side`) | História paralela + loot exclusivo | Não, após concluir | Desbloqueadas e incompletas (várias ok) |
| **Normal** (`normal`) | Loot/recursos; não avança história | Sim, em **próximos** sorteios; some da oferta atual na derrota/vitória; ouro nos kills; XP só na vitória (`targetXp` da fase) | 2–4 por oferta, só do capítulo da main atual |

### Principais (marcos)

Por mapa (`stendra` … `morthaven` no v1), ids alinhados às fases-marco:

`{mapIndex}-1`, `{mapIndex}-10`, `{mapIndex}-20`, `{mapIndex}-30`, `{mapIndex}-40`, `{mapIndex}-50`.

- Ordem sequencial: só a **próxima** principal incompleta aparece no board.
- Concluídas **não** voltam ao mapa.
- Derrota: missão **permanece**; progresso da tentativa zera (recomeça waves do zero).
- Marcos intermediários legados (`x-5`, `x-15`, `x-25`, `x-35`, `x-45`) existem só como **normais** do bloco anterior (ex.: `normal:1-5` no capítulo da main `1-1`).

### Secundárias

- Únicas por arco de conteúdo; **várias** podem estar ativas ao mesmo tempo.
- **Vinculadas ao capítulo da main atual**: só aparecem no board se o `phaseTemplateId` estiver na mesma faixa da main incompleta (ex.: main `1-10` → sides com fases `1-2`…`1-10`; main `1-1` tutorial não traz sides de farm).
- Cadeias de unlock (ex.: sides do bloco `1-10` livres no grafo desde o início, mas só no board após o tutorial; após `1-1` → `Trilha de Cinzas` no mesmo bloco).
- Concluídas **não** repetíveis.
- **Expiram** se incompletas quando o jogador conclui uma main **posterior** no mesmo mapa (janela entre o maior pré-requisito main e a próxima main; ex.: unlock em `1-1` some ao zerar `1-10`).
- Derrota: permanece no mapa; tentativa zera.
- Recompensa exclusiva: item e/ou ouro e/ou XP e/ou cena narrativa (`story-scenes` / catálogo próprio).

### Normais

- Templates por **mapa** para fases `1–50` (incluindo marcos): `normal:x-n` usa o combate da fase `x-n`.
- **Capítulo da main atual**:
  - main `1-1` (tutorial): só a fase `1`.
  - demais marcos: `(marco anterior)+1` … marco atual (ex.: main `1-10` → `2`…`10`; main `1-20` → `11`…`20`).
- Dentro do capítulo há templates mais fáceis e mais exigentes (próximo ao marco seguinte pede grind/build); não devem ser triviais nem impossíveis cedo demais.
- Oferta: entre **2 e 4** missões sorteadas (sem repetir **no mesmo** sorteio).
- **Repetíveis entre sorteios**: o mesmo template pode voltar em refreshes futuros (diferente de main/side). **Não** há penalidade de ouro por “replay” — kills pagam ouro cheio; XP só na vitória.
- Renovação: a cada `NORMAL_MISSION_REFRESH_EVERY_N_CAMP_VISITS` visitas ao acampamento (constante de domínio, default calibrável).
- Derrota: a missão **some** da oferta atual (pode voltar no próximo refresh).
- Vitória: remove da oferta atual; concede loot/recursos sem avançar história.

## Estrelas (1–5)

- Indicam dificuldade e template.
- UI: preview no pin (quest card) com tipo, ouro esperado, XP na vitória, bônus (item/cena), waves/tier, monstros e CTA **antes** de entrar.
- Balanceamento: ver `game-balance` (BAL de missões).

## UI do mapa

Evoluir o mapa de campanha (`CampaignFlow` / `CampaignModalRenderer`):

1. **Hub:** mapa **embutido** no `battle-field` — **somente** o board com pins e scroll (sem header Stendra/bioma, sem toggle mapa-mundo).
2. **Expandir:** ícone Mapa abre modal com mapa-mundo/trilha completa; ao clicar numa região no mapa-mundo, fecha o modal e mostra só os pins dessa região no hub.
3. **Preview do pin:** quest card ancorado no pin — badge de tipo, faixa de recompensas (`expectedGold` / `victoryXp` + item/cena), ameaça (waves/tier/hint), inimigos e CTA Iniciar.

## Critérios de aceite

- [x] Fim de batalha (vitória ou derrota) mostra CLEAR/DEFEAT, depois tela só de recompensas (sem scroll; Continuar no deck); Continuar → hub com **mapa embutido** no battle-field. Load/refresh não abre o mapa enquanto o resultado está pendente
- [x] **Iniciar missão** no mapa → combate imediato (sem overlay START; o CTA já confirma); painel **Estatísticas** abre automaticamente
- [x] Preview do pin (quest card) mostra ouro esperado, XP de vitória e bônus (item/cena com nome) quando houver
- [x] Hub / Acampamento sem reinício via Batalhar (`phaseRestartOnResume: false`); combate só pelo mapa
- [x] New game inicia no hub do acampamento (`loadoutEditOpen: true`) com **mapa embutido** (sem overlay “Acampamento”)
- [x] New game: depois da cena de abertura, boas-vindas → mapa aberto automaticamente → tutorial guiado (pinos/tipos de missão, preview do local, Iniciar missão); ver `battle-ui` (`OnboardingPolicy`)
- [x] Derrota concede ouro já pago nos kills e **zero XP**; overlay mostra ouro da tentativa (delta vs. START) e XP 0; main/side na derrota sem recompensa de conclusão
- [x] Sem auto-seleção / auto-start da próxima fase ao limpar boss de missão
- [x] Board do mapa lista próxima principal + secundárias elegíveis + oferta normal (2–4)
- [x] Principais = marcos `x-1`…`x-50` apenas; concluídas fora do board
- [x] Secundárias respeitam grafo de unlock; múltiplas ativas permitidas; incompletas expiram ao concluir main posterior no mapa
- [x] New game / party inicial: só Nix até unlocks na árvore (gates de main)
- [x] Normais sorteadas no **capítulo da main atual** (ex.: `1-1` → só `1`; `1-10` → fases `2–10`); templates repetíveis entre sorteios; pool por visitas ao camp
- [x] Secundárias no board filtradas pelo mesmo capítulo (template na faixa) + grafo de unlock/expiração
- [x] Pins do mapa de locais com margem segura (visíveis por completo; sem corte no topo/laterais)
- [x] Popover de missão em portal fixo; clamp na viewport e scrollport visível (não corta nos cantos); CTA verde (--forest)
- [x] Hub: mapa no `battle-field` (altura fixa); stage encaixa por altura com aspect-ratio do layout, centralizado, sem scroll
- [x] Derrota: normal some; main/side permanecem com tentativa zerada
- [x] Vitória main: marca concluída, libera próxima principal (e unlocks side se houver)
- [x] Vitória side: marca concluída, aplica unlocks e loot exclusivo
- [x] Vitória normal: remove da oferta, loot/recursos sem progresso de história
- [x] Preview de waves/monstros/stats antes de iniciar
- [x] Estrelas 1–5 visíveis nas normais (e onde aplicável)
- [x] Modal: mapa-mundo + mapa de locais (região compacta: padding/gap mínimos; progresso no hover; sem abas laterais)
- [x] Persistência: board, ofertas, concluídas, visitas desde refresh, tentativa ativa
- [x] `CampaignReleaseScope` base (mapas 1–4) respeitado
- [x] Presentation consome apenas DTOs
- [x] Domínio em `domain/campaign/missions/` (ou equivalente) sem browser/DOM
- [x] Use cases + cases em `handleGameMessage.ts`
- [x] Migração de save legado (fase linear → progresso de marcos + board inicial)
- [x] Testes listados abaixo criados/atualizados
- [x] Specs cruzadas (`combat-campaign`, `battle-ui`, `story-scenes`, `gear-loot`, `game-balance`, `stage-progress-bar`) alinhadas
- [x] Skill, agent e rule `camp-missions` presentes

## Constantes de domínio (iniciais)

| Constante | Default sugerido | Notas |
|-----------|------------------|--------|
| `NORMAL_MISSION_OFFER_MIN` | 2 | Inclusivo — **somente** missões normais |
| `NORMAL_MISSION_OFFER_MAX` | 4 | Inclusivo — principal/secundária não entram na contagem |
| `NORMAL_MISSION_REFRESH_EVERY_N_CAMP_VISITS` | 2 | Renova a cada 2 retornos ao camp (calibração Fase 6) |

Ouro de cada fase vem do orçamento `targetGold` (pago via kills). XP vem do orçamento `targetXp` (Balance Lab → aba XP) **somente na vitória**, em valor fixo independente do número de inimigos. Derrota: sem XP. Missões não têm recompensa de conclusão em ouro/XP — apenas item exclusivo e cena (só na vitória).

## Camadas e arquivos-chave (alvo)

| Camada | Paths |
|--------|-------|
| Domain | `src/domain/campaign/missions/*`, ajustes em `PhaseCombatHandlers`, `CampaignProgress`, `PartyEditPolicy` |
| Application | `GetMissionBoardUseCase`, `StartMissionUseCase`, `ResolveMissionOutcomeUseCase`, DTOs |
| Presentation | `CampaignFlow`, `CampaignModalRenderer`, `CampaignMapPresentation` (locais), fluxo de resultado → camp |
| Infra | `handleGameMessage.ts` (novas actions), migração de storage |

## Invariantes

- Acampamento é o hub; combate só após `StartMission`
- Principais/secundárias concluídas nunca reaparecem no board
- Sem multiplicador de ouro por template já cleared (normais farmam ouro cheio); XP só na vitória
- Sides incompletas saem do board ao expirar a janela de main
- Oferta normal é determinística por seed de save + epoch de refresh
- Domínio não conhece Chrome nem DOM
- Escopo `base` não oferece missões de mapas DLC

## Fora de escopo (v1)

- Replay de principais/secundárias
- Grafo não-linear de principais (continua sequência de marcos)
- Tela de mapa totalmente nova fora do modal de campanha
- Editor de missões in-game

## Testes obrigatórios

- [x] `MissionUnlockGraph.test.ts` — cadeias, paralelas e expiry ao completar main posterior
- [x] `NormalMissionOffer.test.ts` — 2–4, refresh por visitas, seed, faixa da main
- [x] `NormalMissionMainBand.test.ts` — banda de fases por marco da main
- [x] `CampMissionBoard.test.ts` — próxima main, sides elegíveis, normais na faixa
- [x] `MissionMapLayoutCatalog.test.ts` — margem segura dos pins
- [x] `ResolveMissionOutcomeUseCase.test.ts` — vitória/derrota por tipo → camp
- [x] `ResolveMissionOutcome.test.ts` — domínio: XP na vitória; derrota sem XP; main/side sem recompensa de conclusão
- [x] `StartMissionUseCase.test.ts` — inicia tentativa / rejeita inválida
- [x] `GetMissionBoardUseCase.test.ts` — DTO / escopo base
- [x] `CampaignMissionMapPresentation.test.ts` — locais clicáveis / tipos / quest card no pin (ouro/XP/bônus) / tooltip de stats
- [x] `MissionBoardMapper.test.ts` — `expectedGold` / `victoryXp` / nomes de recompensa
- [x] `EnemyBattlePresentation.test.ts` — tooltip compacto com ícones (~3 por linha)
- [x] `MissionEnemyPreviewMapper.test.ts` — ficha de combate dos inimigos em destaque
- [x] `BattleVictoryDetector.test.ts` — vitória com rewards; derrota normal com ouro/XP da tentativa (baseline do START, não só o último tick)
- [x] `BattleAttemptRewardBaseline.test.ts` — captura/limpa snapshot da tentativa
- [x] `BattleVictoryFlow.test.ts` — CLEAR/DEFEAT → tela de recompensas e Continuar (ver também `battle-ui` / `combat-campaign`)
- [x] `EmbeddedCampaignMapPolicy.test.ts` — mapa só no hub após Continuar
- [x] `BattleStartFlow.test.ts` — START antes do combate (ver também `battle-ui`)
- [x] Migração de save: progresso linear → marcos concluídos + board

## Relacionado

- [`combat-campaign.spec.md`](combat-campaign.spec.md) — combate, waves, fim de batalha
- [`battle-ui.spec.md`](battle-ui.spec.md) — acampamento, modal, resultado
- [`stage-progress-bar.spec.md`](stage-progress-bar.spec.md) — timeline na missão ativa
- [`story-scenes.spec.md`](story-scenes.spec.md) — cenas por unlock de missão
- [`gear-loot.spec.md`](gear-loot.spec.md) — loot exclusivo side / normal
- [`game-balance.spec.md`](game-balance.spec.md) — refresh e templates ★

## Fases de entrega

| Fase | Conteúdo |
|------|----------|
| 0 | Specs / skill / agent / rule (esta entrega) |
| 1 | Domínio board + unlock + oferta + persistência |
| 2 | Handlers fim de batalha → camp; derrota por tipo |
| 3 | Use cases + SW + DTOs |
| 4 | UI mapa de locais + preview + resultado |
| 5 | Catálogo marcos + pool normal ★ + sides piloto |
| 6 | Cenas/loot exclusivo + calibração refresh |
