# Spec — Gear, Inventário e Baús

## Status

**Aceite:** 10/10 (100%)  
**Testes obrigatórios:** 10/10

## Objetivo

Todo loot de combate chega como **baú**; ao abrir, o gear é enviado ao inventário ou ao baú de itens. O jogador equipa, compara e otimiza o loadout da party.

## Critérios de aceite

- [x] Baú a cada N vitórias; abrir 1 ou todos (se melhoria desbloqueada)
- [x] **Abrir todos** preenche inventário vazio, depois baú de itens (se desbloqueado); baús restantes ficam pendentes — nunca falha em silêncio por falta de espaço total
- [x] Loot procedural por raridade/template (`LootService`, `GearTemplateCatalog`); stats elementais usam `air*` (não `chaos*`); itens `air_mantle` / `air_pendant`
- [x] Combate nunca insere gear diretamente no inventário: drops comuns viram baús sorteados na abertura; lendários de boss ficam reservados como loot garantido dentro do baú
- [x] Loot garantido de boss (Ignus Ix, Vorpal Lupnus, Soler Plégius e Selo de Morthaven) persiste no baú e é entregue sem novo sorteio ao abrir
- [x] Equipar valida slot, nível e classe (`GearRequirementChecker`)
- [x] Otimizar equipe (`LoadoutOptimizer`) — **desativado na UI** (2026-08); código preservado
- [x] Auto-abrir baús / auto-abrir todos (`autoOpenChests`, `autoOpenAllChests`) — **desativados** (2026-08); botão manual Abrir todos permanece
- [x] Comparação visual: tooltip com deltas por status (cor + número); no ícone da grid ▲ (só melhorias), ▼ (só pioras), ▲▼ (misto) ou sem badge se igual
- [x] Inventário (global e embedded): filtro por categoria exclusivamente pelos ícones do loadout; toolbar de ordenação única; sem painel inline duplicado para escolha por slot
- [x] Bordas de raridade consistentes em inventário, loadout, loja, forja, loot e tooltips: common cinza, uncommon verde, rare azul, epic lilás, legendary dourado, mythic vermelho com brilho
- [x] Raridade **mythic** não aparece em loja nem em loot de área/baú antes do Ato 3 de Valdris (`MythicGearAccessPolicy`, tier ≥ 121)
- [x] Todo item do catálogo possui `basePrice` fixo e editável pelo Balance Lab; preço não é derivado da raridade/tier em runtime

## Critérios — camp-missions (novos)

- [ ] Loot exclusivo de quest **secundária** (item e/ou cena) só na primeira conclusão
- [x] Missão **normal**: loot/recursos sem progresso de história; XP/ouro vêm só do orçamento da fase (kills), sem recompensa de conclusão em nenhum tipo
- [ ] Tabelas/templates de loot referenciáveis por `MissionDefinition`

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `src/domain/entities/Gear.ts`, `LootService`, `GearEquipService`, `LoadoutOptimizer`, `ChestService`, `GearStorageService` |
| Application | `OpenChestUseCase`, `EquipGearUseCase`, `EquipBestLoadoutUseCase`, `UnequipGearUseCase` |
| Presentation | `InventoryGridPresentation`, `GearPresentation`, `GearDragDrop*`, `GearComparison` |

## Invariantes

- IDs de gear únicos no inventário
- Inventário nunca cresce além de 30 por recompensa de combate; saves legados excedentes convertem o excesso em baús pendentes sem perder gear
- Gear único reservado em baú pendente conta como posse para impedir duplicação
- Abrir todos consome espaço disponível (inventário → baú de itens) antes de parar
- Equipar fora da pausa só via auto-equip se melhoria ativa
- Race de equip: `EquipGearRace` / fila de mutação no UI

## Fora de escopo

- Trading entre jogadores

## Backlog (Fase 2 — não implementado)

Adicionar critérios `[ ]` aqui antes de codar:

- Efeitos únicos → [`unique-effects.spec.md`](unique-effects.spec.md) (entregue)
- Busca textual no grid de inventário
- Favoritar itens
- Vender/descartar lixo em lote
- Compare side-by-side
- Virtualização para 500+ itens

## Relacionado

- [`camp-missions.spec.md`](camp-missions.spec.md) — loot por tipo de missão

## Testes obrigatórios

- [x] `LootService.test.ts`
- [x] `MythicGearAccessPolicy.test.ts` — unlock mythic no Ato 3 de Valdris
- [x] `GearEquipService.test.ts`, `LoadoutOptimizer.test.ts`
- [x] `GearDragDropPolicy.test.ts`, `InventoryGridPresentation.test.ts`
- [x] `EquipGearRace.test.ts`
- [x] `ChestService.test.ts` — abrir todos parcial (inventário + baú de itens)
- [x] `EnemyKillRewardService.test.ts`, `UniqueGearLootService.test.ts` — drops diretos e lendários reservados em baús
- [x] `GameStateMigration.test.ts`, `GameStateRepository.test.ts` — persistência do loot garantido, conversão de excesso legado e migração Caos→Ar (`chaos*` → `air*`)
- [x] `GearRarityPresentation.test.ts` — normalização e ordenação das 6 raridades
