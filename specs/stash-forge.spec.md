# Spec — Baú de Itens e Forja Divina

## Status

**Aceite:** 10/10 (100%) · auditoria 2026-07-19  
**Testes obrigatórios:** 10/10

## Objetivo

Guardar gear extra no **baú** (capacidade por melhoria) e usar a **Forja Divina** para fundir 9 itens da mesma raridade ou destruir por ouro.

## Critérios de aceite

- [x] Stash desbloqueado por `item_stash` (24/36/48 slots)
- [x] Mover item inventário ↔ baú (drag ou ação)
- [x] Forja: fundir 9 → 1 raridade superior; validar mesma raridade
- [x] Salvage: destruir item por ouro (`ForgeSalvageGoldCatalog`)
- [x] Gates via `FeatureAccessPolicy` / melhorias `divine_forge`
- [x] Forja lista itens do **inventário e do baú**; fusão/salvage remove da origem correta
- [x] UX game-like da Forja: abas temáticas (⚒ Fundir / 💰 Destruir), chips de capacidade, grid com scroll, dock fixo com badge de seleção e botões `forge-game-btn`; confirmação com eyebrow “Forja Divina”, ritual 9→1 e cards de recompensa — sem `primary-btn` nem painéis estilo site
- [x] Seleção de itens no grid da Forja **preserva** a posição do scroll (não volta ao topo ao clicar)
- [x] Seleção na Forja atualiza classes/dock **in-place** (não recria a grade no clique; evita flicker)
- [x] Tooltip pin de gear **reancora** após re-render do inventário/baú/forja (`reanchorPinnedInventoryGearTooltip`)
- [x] Botão **Limpar seleção** (ícone) à direita do status no dock (Fundir e Destruir); texto só no tooltip
- [x] Tela do baú tem drag & drop espelhando o inventário: arrastar item para o slot **Inventário** (`data-drop-zone="inventory"`, ativo só com espaço livre) envia ao inventário; arrastar para o slot **Destruir** abre a confirmação de destruição; itens do baú continuam arrastáveis com inventário cheio (destruir segue válido)

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `DivineForgeService`, `DivineForgePolicy`, `GameState` stash fields |
| Application | `MoveGearToStashUseCase`, `MoveGearFromStashUseCase`, `FuseGearInForgeUseCase`, `SalvageGearInForgeUseCase`, `DestroyGearUseCase` |
| Presentation | `StorageGridPresentation`, `StashModalRenderer`, `StashInventorySlotPresentation`, `GearDragDropBinder`, `DivineForgeModalRenderer`, `DivineForgePresentation`, `DivineForgeConfirmPresentation`, `ForgeGridScrollPresentation`, modal Forja |

## Invariantes

- Capacidade do baú nunca negativa
- Fusão consome exatamente 9 itens válidos
- Confirmação destruição fora da pilha principal de modais

## Fora de escopo

- Forja de skills ou materiais não-gear

## Testes obrigatórios

- [x] `DivineForgeService.test.ts`, `DivineForgePolicy.test.ts`
- [x] `GearDragDropPresentation.test.ts` (stash no drag)
- [x] `DivineForgePresentation.test.ts` — `listForgeEligibleGear` une inventário + baú; abas, dock e botões game-like
- [x] `DivineForgeConfirmPresentation.test.ts` — ritual de fusão e card de recompensa no salvage
- [x] `ForgeGridScrollPresentation.test.ts` — preserva scrollTop do grid ao re-render
- [x] `DivineForgeModalRenderer.test.ts` — seleção/limpeza in-place sem recriar nós da grade
- [x] `InventoryGearTooltipBinder.test.ts` — pin reancorado após re-render; some se o item sumiu
- [x] `GearDragDropBinder.test.ts` + `StashInventorySlotPresentation.test.ts` — drop de item do baú na zona inventário/destruir e slot desabilitado com inventário cheio
