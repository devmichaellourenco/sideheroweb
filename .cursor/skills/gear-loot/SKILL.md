---
name: gear-loot
description: Gear, inventário, baús e equipamento no Side Hero. Use para loot, chest, baú, equipar, inventário, LoadoutOptimizer ou GearDragDrop.
---

# Gear, Inventário e Baús

## Spec

`specs/gear-loot.spec.md`

## Fluxo

1. Templates → `GearTemplateCatalog`, geração em `LootService`
2. Equipar → `GearEquipService` + `EquipGearUseCase`
3. UI → `InventoryGridPresentation`, `GearDragDropPolicy`

## Padrões

- Abrir baú: `ChestService` via use cases
- Abrir todos: preenche inventário, depois baú de itens; restante fica pendente (`GearStorageService.resolveLootDestination`)
- Auto-abrir baús / auto-abrir todos: **desativados** (2026-08) — flags sempre off; nós `auto_open_chests_1` / `open_all_chests_2` fora do catálogo
- Badge no ícone da grid: ▲ / ▼ / ▲▼ conforme deltas por status (`resolveGridCompareBadge`); tooltip com números coloridos (`listGearStatDeltas`)
- Inline equip no drawer sem modal empilhado quando possível
- Mythic: loja/loot de área só a partir do Ato 3 de Valdris (`MythicGearAccessPolicy`)
- Balance Lab (aba **Itens**): overrides de nome, `basePrice`, stats e requisitos em `gear-item-overrides.json`, mesclados por `getGearCatalogItem` — não editar o JSON canônico pelo lab

## Testes

`GearEquipService.test.ts`, `GearDragDropPolicy.test.ts`, `EquipGearRace.test.ts`, `ChestService.test.ts`, `GearItemOverrides.test.ts` — criar ou atualizar; não executar automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
