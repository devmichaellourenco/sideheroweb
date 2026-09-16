---
name: game-balance
description: Balanceamento transversal do Side Hero — fórmulas de combate, elementos, gear, waves, economia e curva de dificuldade. Use para balance, rebalance, curva, tier scaling, mitigação, resist, DOT, dificuldade, auditoria numérica ou BAL-*.
---

# Balanceamento do Jogo

## Spec

`specs/game-balance.spec.md`

## Quando usar este skill

- Revisar ou alterar **números** que afetam desafio ou progressão
- Auditar se sistemas **funcionam juntos** (não só isolados)
- Antes de corrigir gaps conhecidos (DOT, gelo, loja, waves)
- Depois de entregar conteúdo novo (inimigo, skill, melhoria, loot)

## Fluxo de auditoria

1. Identifique **domínios** afetados (tabela na spec)
2. Leia a **spec parceira** da feature que será implementada
3. Trace a fórmula nos arquivos de domínio (nunca só na UI)
4. Verifique **early (T1–10)**, **mid (T11–40)**, **late (T41+)** mentalmente ou com notas
5. Atualize backlog `BAL-*` e critérios `[ ]` → `[x]` em `game-balance.spec.md`
6. Peça ao agent de feature para implementar; não duplicar lógica fora do domínio

## Mapa rápido de fórmulas

| Sistema | Entrada | Mitigação / escala | Arquivo |
|---------|---------|-------------------|---------|
| Hit instantâneo | `damageComponents[]` | Pipeline por elemento + DEF | `MitigationPipeline.ts` |
| TTA / ASPD | perfil do combatente | `1/ASPD`; fator ASPD por herói/monstro | `HeroCombatIdentityCatalog.ts`, `EnemyCombatIdentityCatalog.ts`, `CombatSpeedScaling.ts` |
| Inimigo stats | level, attrs, role, tier template | `buildEnemyCombatSheet` + derived (crescimento por tipo) | `EnemyProgressionCatalog.ts`, `WaveEnemyFactory.ts` |
| Recarga de skill | `cooldownTurns` × s/turno do combatente − `cooldownSecondsPerRank` da skill | sem piso global | `SkillCooldownTiming.ts` |
| Recovery pós-skill | `actionRecoverySeconds` da skill / castSpeed | por skill | `CombatSkillDefinition` |
| Ataque básico | ATK × `basicAttackDamageRatio` do combatente | por herói/tipo de monstro | `HeroCombatIdentityCatalog.ts`, `EnemyCombatIdentityCatalog.ts` |
| CDR | % do gear, teto/piso na skill | `maxCooldownReduction` / `minCooldownReduction` | `CombatProfileProvider.ts` |
| Crescimento ATK/DEF/HP | herói: base + atributos + gear (+ `levelUp*Gain` na base); monstro: `attackPerLevel` + `levelUp*Gain` | `HeroCombatIdentityCatalog.ts`, `EnemyCombatIdentityCatalog.ts` |
| Skill herói com CD | powerPerRank no catálogo | valores 3× o legado (sem constante global) | `HeroCombatSkillCatalog.ts` |
| Crítico | `critChance`, `critDamage` | Multiplicador antes do split | `CombatDamageResolver.ts` |
| DEF efetiva | base + debuff | Só componente `physical` | `CombatStatResolver.ts` |
| Resist | gear + inato | `getEffectiveResistance` | `ResistanceProfile.ts` |
| Esquiva/block/DR | gear + passivas | Após soma de componentes | `DefensiveMitigation.ts` |
| DOT tick | `onHitDot` | **Deve** usar pipeline (backlog BAL-001) | `CombatTurnPhase.ts` |
| XP por fase | `targetXp` (vitória) | lump sum; kills sem XP | `PhaseVictoryXp.ts`, `PhaseXpBudget.ts` |
| Loot primário | itemLevel, raridade | `rolledGearPrimaryStat` | `DifficultyCombatScaling.ts`, `MapGearLevelPolicy.ts` |
| Ouro por fase | tier, # inimigos | `PhaseGoldBudget` → kills | `PhaseGoldBudget.ts`, `EconomyReference.ts` |
| Loja | `basePrice` do item + definição da loja | `priceMultiplier`/`flatPriceAdjustment`; pool explícito; cap de raridade por main | `ShopPricing.ts`, `ConfigurableShopCatalog.ts`, `ShopService.ts` |
| Identidade de mapa | mapId | bias pool + resists soft (−15/+20) | `MapCombatIdentityCatalog.ts`, `EnemyTierProgression.ts` |

## Faixas alvo (orientação — calibrar com playtest)

| Tier | Sensação | Sinais de desbalance |
|------|----------|----------------------|
| 1–10 | Tutorial pressionado; mortes ocasionais | Lendário na loja T1; one-shot constante |
| 11–25 | Build importa; upgrades sentidos | Zero progresso em 20+ fases |
| 26–60 | Checks de resist/gear | Dano irrelevante ou only-meta |
| 61+ | Endgame; meta + mitos | Impossível sem mythic |

## Coordenação SDD

Sempre em **par** com o skill da feature:

```
@.cursor/skills/game-balance/SKILL.md  +  @.cursor/skills/<feature>/SKILL.md
```

Exemplo: corrigir DOT → `game-balance` define critério + teste; `combat-campaign` implementa em `CombatTurnPhase`.

## Laboratório local (Balance Lab)

Simulador local — mesmas fórmulas do domínio (`CombatantDerivedStats`, sheet inimigo, ASPD).

```bash
npm run balance-lab
# http://127.0.0.1:5179/
```

Arquivos: `tools/balance-lab/` (+ `scripts/balance-lab.mjs`).

- **Simulador:** 1 combatente | lado a lado; identidade por herói/tipo de monstro (básico, CD, ASPD, crescimento); timing por skill; pesos globais (STR/DEX) e passivas editáveis; export/import JSON.
- **Missões:** aba no lab para editar batalhas (main/side/normal) via formulário + JSON. Filtros por **capítulo da main** (ex. Cap. 10 = fases 2–10; Cap. 1 = só fase 1), tipo, mapa e busca. Badge `shared` quando main/normal usam o mesmo `phaseTemplateId`. Seletor de inimigos com **miniatura** (sprites de `dist/assets/characters`). Grava em `src/domain/campaign/data/phase-battle-overrides.json` (merge em `CampaignCatalog.resolvePhase`). Cada save/delete gera backup em `src/domain/campaign/data/backups/phase-battle-overrides/`. Após salvar, rebuild (`npm run build`) para o jogo embutir o JSON.
- **XP por fase:** aba com soma de XP/ouro de todos os kills por fase, XP acumulado, nível projetado, filtros mapa/capítulo. Edição de **nome**, **XP/ouro alvo** com save em `phase-reward-overrides.json` (backup automático); domínio aplica nome via `resolvePhase` e escala kills via `PhaseXpBudget` / `PhaseGoldBudget`. API `GET|PUT /api/phase-rewards`.
- **XP por nível:** aba com a curva de level-up 1→100 (XP base do catálogo, XP efetiva editável, crescimento vs nível anterior, XP acumulada), filtro por faixa de 10 níveis. Níveis 1–50 vêm de `campaignHeroXpRequired`; 51–100 da tabela legada em `HERO_LEVEL_XP_TABLE`. Save em `src/domain/progression/data/hero-level-xp-overrides.json` (backup automático); merge em `expRequiredToAdvanceFromLevel` (canônico segue em `catalogExpRequiredToAdvanceFromLevel`). API `GET|PUT|DELETE /api/hero-level-xp`. Rebuild (`npm run build`) para o jogo.
- **Itens:** aba com o catálogo de gear (`gear-items.catalog.json`): lista com miniatura, filtros slot/raridade/busca; editor de nome, preço base fixo, raridade, flags (`lootPool`/`unique`/`namedLegendary`/`salvageBlocked`), requisitos e todos os stats numéricos. Save em `src/domain/gear/data/gear-item-overrides.json` (backup automático); merge em `getGearCatalogItem` (canônico em `getCatalogGearItem`). API `GET|PUT|DELETE /api/gear-items`. Novos drops usam o catálogo efetivo; itens já no save mantêm stats até `resyncGearFromCatalog`/rebuild conforme o fluxo. Rebuild (`npm run build`) para o jogo.
- **Lojas:** aba CRUD de lojas (`shops.catalog.json` + `shop-overrides.json`): criar/editar/duplicar/excluir; vincular a marco `main:X-Y`; pool explícito de itens; modificador global (`priceMultiplier` + `flatPriceAdjustment`). Só a loja do maior marco concluído fica ativa. API `GET|PUT|DELETE /api/shops` e restore de backups. Rebuild (`npm run build`) para o jogo.
- **Personagens:** índice em grade (sprite, número, nome, classe/papel) e ficha no estilo wiki — pager `<` título `>` para o herói anterior/próximo (ordem do índice + Universais, cicla; hash `#heroes?class=` atualiza); botão Índice volta à grade. Seções-marco **Visão geral / Atributos / Evolução / Passivas / Skills** agrupam os subitens e recolhem/expandem com um toggle `^`/`v` à direita. Barras ATK/DEF/HP/ASPD com pictogramas, Passivas (ícone), Evolução (retrato da forma + trilha), Skills (ícone). A ficha **não exibe IDs de catálogo** (`knight_military_guerreiro`, `discipline_steel`, `arcane_bolt` etc.) — só nomes e knobs com rótulo de balanceamento; IDs ficam em `data-*` para o save. Edita stats base, identidade, skills, passivas e evoluções; preview de impacto (pts acumulados, skills/passiva do tier). **Ataque básico** usa ATK × fator da identidade — não o poder base da skill. Grava em `src/domain/progression/data/hero-combat-overrides.json`; merge em `getHeroCombatSkill` / `getHeroCombatIdentity` / `getHeroBaseStats` / `getPassiveDefinition` / `getAscensionById`. API `GET|PUT /api/hero-combat`. Rebuild (`npm run build`) para o jogo. Deep-link `#heroes?class=knight`. Reinicie o lab após mudar o servidor de assets.
- **Inimigos:** índice em grade (sprite, número, nome, tier/papel) e ficha no estilo wiki — pager `<` título `>` entre monstros (ordem do roster, cicla; hash `#enemies?id=` atualiza); botão Índice volta à grade. Seções-marco **Visão geral / Atributos / Skills** recolhem/expandem com toggle `^`/`v`. Miniaturas, ícones de skill e rótulos de balanceamento (sem IDs de catálogo na ficha). Edita identidade e skills de monstro; save em `src/domain/enemies/data/enemy-combat-overrides.json`; merge em `EnemyCombatOverrides` → `EnemyCombatIdentityCatalog` / `CombatSkillRegistry`. API `GET|PUT /api/enemy-combat` + restore de backups. Rebuild (`npm run build`) para o jogo.
- **Melhorias:** aba para editar custo, nome e descrição dos nós da árvore; filtro por ramo/busca. Grava em `src/domain/upgrades/data/upgrade-overrides.json`; merge em `UpgradeOverrides` / `UpgradeCatalog`. API `GET|PUT /api/upgrades` + restore de backups.
- **Economia:** auditoria read-only de ouro por fase (mapa/capítulo) + pool das lojas (preços efetivos e custo de renovação). API `GET /api/economy-audit`.
- **Wave Power (Missões):** botão no editor de batalha calcula poder da fase via `estimatePhasePower` + `DEFAULT_REFERENCE_PARTY`; exibe HP total, DPS da party, tempo de clear e pressão por wave. API `GET /api/wave-power?phaseId=`.
- **Simulação Real (Missões + Inimigos):** botão "▶️ Simular combate (real)" roda o motor real (`CombatTurnPhase`) tick a tick via `CombatEncounterSimulator`; suporta fase completa, wave única, encontro ad-hoc ou **`draftPhase`** (rascunho do editor sem Save); seed determinística; `POST /api/combat-sim`; resultado: outcome, winRate, tempo, HP% restante por herói, waves limpas.
  - **Perfil da party** (`profile`): `naked` = piso (sem gear/pontos), `geared` = Core com o kit da loja do marco, `optimal` = teto (uma raridade acima + 3 slots de skill). Build montado por `SimHeroLoadout` reusando `SkillService` e `canHeroEquip`; sem `profile` o herói fica pelado e o win rate **não** representa o jogador real. Alvo Core: 60–85% em `geared`.
- **Arena visual (Missões):** painel com sprites/HP anima `simulateEncounterPlayback` (`POST /api/combat-sim-playback`); Iniciar/Pausar/Reiniciar/velocidade; sempre usa o draft atual + party/perfil.
- **Varredura de win rate (Missões):** painel "Varredura de win rate" roda `CampaignWinRateSweep.sweepMapWinRate` em todas as fases do mapa no **nível projetado de chegada** (XP acumulado das fases anteriores) e classifica contra a faixa 60–85%. API `GET /api/combat-sim-sweep?mapId=&profile=&runs=&classes=&seed=`. Use para achar walls e plateaus antes de mexer em wave. Nota: plateau de ~100% no miolo do Stendra é intencional para party cheia no mapa tutorial — sempre confira a curva com duo/solo (`classes=`) antes de nerfar.
- **Balance Pack (Manutenção):** export/preview/import de todos os overrides em JSON versionado (`side-hero-balance-pack` v1); backup por scope antes do import. API `GET /api/balance-pack`, `POST /api/balance-pack/preview|import`.
- **Stock Preview (Lojas):** painel seed/tier gera prévia determinística do estoque via `previewShopStock`; exibe itens sorteados com preço efetivo. API `GET /api/shops/:id/stock-preview?seed=&tier=`.

Não entra no zip de release.

## Testes de fórmula

Ver lista em `specs/game-balance.spec.md`. Criar/atualizar arquivos; não executar `npm test` automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes

## Próximos itens sugeridos (backlog)

1. ~~Auditoria curva ouro: recompensa por wave vs preço loja/forja~~ (`PhaseGoldBudget`)
2. ~~Expandir BAL-011 (race/sustain/spike) para Gruftall → Morthaven~~ (+ warded/armored multi-slot)
3. BAL-003 — dodge/block/DR por componente (opcional)
4. Playtest documentado tier 1–25 / 26–60 / 61+
