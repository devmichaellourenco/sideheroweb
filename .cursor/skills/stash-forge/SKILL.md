---
name: stash-forge
description: Baú de itens e Forja Divina no Side Hero. Use para stash, baú de itens, forja divina, fuse, salvage ou DivineForge.
---

# Baú de Itens e Forja Divina

## Spec

`specs/stash-forge.spec.md`

## Fluxo

1. Capacidade → níveis `item_stash` em `UpgradeCatalog`
2. Fusão/salvage → `DivineForgeService` + policies
3. UI → grid de storage, modal forja

## Padrões

- Gate: `FeatureAccessPolicy.divineForge` / `itemStash`
- 9 itens mesma raridade → 1 superior (`GearRarityProgression`)
- Forja: grid com inventário + baú (`listForgeEligibleGear`)
- UI Forja: classes `forge-panel--game`, `forge-tab`, `forge-dock`, `forge-game-btn`; confirm com `forge-confirm-dialog`
- Limpar seleção: ícone `forge-clear-btn` (`data-forge-clear-selection`) à direita do status no dock; texto só no `title`/aria; `DivineForgeModalRenderer.resetSelection()`
- Scroll do grid: `ForgeGridScrollPresentation` captura/restaura `scrollTop` no re-render completo
- Seleção na forja: patch in-place (`DivineForgeModalRenderer.patchSelection`) — não recria a grade no clique
- Confirm destroy fora da modal stack principal

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
