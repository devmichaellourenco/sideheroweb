# Spec — Árvore de Melhorias

## Status

**Aceite:** 11/11 (100%) · auditoria 2026-08-15  
**Testes obrigatórios:** 10/10 presentes na suite

## Objetivo

Desbloquear automações e QoL comprando nós na **árvore única** com ouro, dependências visíveis e ramos retos.

## Critérios de aceite

- [x] Canvas único: pan, zoom, legenda por ramo
- [x] Cada nó tem `parents[]` válidos; `UpgradeService.areParentsOwned` bloqueia compra
- [x] Layout colinear (H/V/45°) em `UpgradeTreeLayout.ts`
- [x] Ramos integrados à raiz `battle_skill_slot_2`: combate, baús (abrir todos manual), slots, loja, heróis; log via `auto_battle_3` (otimizar equipe e auto-abrir baús desativados)
- [x] Compra aplica `feature` level + `unlockHeroClass` quando aplicável
- [x] Tooltip com requisitos; runas **não compradas** mostram o custo no canto inferior direito (sem botão Comprar)
- [x] Clique no nó **disponível** (ouro suficiente) compra direto; hover continua só informativo
- [x] **Viewport estável após compra:** ao habilitar uma melhoria (clique no nó disponível), o canvas **mantém** pan e zoom atuais — a visão não volta ao início nem recentraliza sozinha
- [x] Modal **sem** hint estático de pan/zoom/hover; legenda, nodos com tooltip e botão **Ir para disponível** comunicam a interação
- [x] Balance Lab edita `parents[]` e `requirements[]`; save rejeita IDs inexistentes, autorreferência, ciclos e mudança da raiz única `battle_skill_slot_2`
- [x] Toda aresta é uma **linha reta**; filhos da mesma dependência se distinguem pelo **ângulo de saída**, nunca por curvatura

## Comportamento esperado do viewport

| Situação | Pan / zoom |
|----------|------------|
| **Abertura do modal** de melhorias | Pode focar o próximo nó disponível (`findFocusNodeId`) — comportamento atual |
| **Re-render após compra** (ouro/nós atualizados) | **Preservar** `scale`, `panX`, `panY` exatamente como antes da compra |
| **Botão "Ir para disponível"** | Centraliza manualmente no próximo nó — comportamento atual, inalterado |
| **Scroll / arrastar** entre compras | Continua funcionando; estado persiste até o usuário mover ou usar o botão de foco |

O tooltip continua informativo no hover; a compra ocorre pelo **clique no nó** quando há ouro. O **reset involuntário** do canvas após a compra permanece proibido.

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `UpgradeCatalog`, `UpgradeService`, `FeatureAccessPolicy`, `UpgradeRequirementEvaluator` |
| Application | `GetUpgradeTreeUseCase`, `PurchaseUpgradeUseCase`, `UpgradeTreeMapper` |
| Presentation | `UpgradeTreeModalRenderer`, `UpgradeTreeGraphPresentation`, `UpgradeTreeViewportBinder`, `UpgradeTreeLayout` |

## Invariantes

- Sem ciclos em `parents`
- Todo ID do catálogo tem posição no layout
- Centros de pai/filho permanecem colineares no layout (H/V/45°)
- Cada filho de um mesmo pai sai num ângulo distinto, e nenhuma aresta passa por cima de um nodo que não seja sua ponta
- Re-render da árvore (ex.: após `PurchaseUpgradeUseCase`) não reinicializa viewport salvo na **primeira** montagem do modal na sessão aberta

## Fora de escopo

- Árvore de meta legado (spec separada)
- Mini-map ou botões extras de zoom (+/−) — pan/zoom atuais permanecem

## Relacionado

- Reset de pontos de aprimoramento (novo nó Runas): [`improvement-reset.spec.md`](improvement-reset.spec.md)

## Testes obrigatórios

- [x] `UpgradeCatalog.test.ts`, `UpgradeTreeLayout.test.ts`, `UpgradeService.test.ts`
- [x] `UpgradeTreeGraphPresentation.test.ts`
- [x] `UpgradeTreeModalRenderer.test.ts`, `UpgradeTreeViewportBinder.test.ts`
- [x] `UpgradeTreeViewportBinder.test.ts` — restaurar `UpgradeTreeViewportState` (`scale`, `panX`, `panY`) após re-bind
- [x] `UpgradeTreeModalRenderer.test.ts` — clique no nó disponível dispara compra; tooltip sem `data-upgrade-buy` e com preço; segundo `render()` após compra **não** chama foco automático nem reseta transform; **sem** parágrafo `upgrade-intro`
- [x] `UpgradeNodeTooltipBinder.test.ts` — hover informativo; clique compra se `available`; pin só fora de compra
- [x] `tools/balance-lab/upgradeTreeCatalog.test.ts` — valida edição de dependências e rejeita grafos inválidos
- [x] `UpgradeTreeGraphPresentation.test.ts` — `buildEdgePath` só emite `M ... L ...`; `findSiblingBranchConflicts` acusa irmãos no mesmo ângulo
- [x] `UpgradeTreeLayout.test.ts` — ângulo distinto por irmão e nenhuma aresta cruzando nodo alheio

## Notas de implementação (orientação)

Implementado via `captureUpgradeTreeViewport`, `bindUpgradeTreeViewport({ initialState })` e `UpgradeTreeModalRenderer.beginSession()` na abertura do modal. Auto-foco só na primeira montagem da sessão.

## Notas

- `battle_skill_slot_2` é a **única raiz** (`parents: []`); demais ramos partem dela ou de descendentes
- Estatísticas de batalha **não** são runa — disponíveis desde o início; abrem automaticamente ao iniciar missão
- **Otimizar equipe** (`optimize_loadout_*`) está **desativado** (2026-08): fora do catálogo e flags sempre off — o jogador avalia itens manualmente
