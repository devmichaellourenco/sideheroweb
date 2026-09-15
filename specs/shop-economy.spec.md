# Spec — Loja e Economia

## Status

**Aceite:** 13/13 (100%) · auditoria 2026-08-14  
**Testes obrigatórios:** 7/7 presentes na suite

## Objetivo

Gastar **ouro** em ofertas da loja ativa (gear consumível/equipável) com renovação limitada **por loja**.

## Critérios de aceite

- [x] Catálogo por tier/seed; oferta identificada por ID estável ao reabrir modal no mesmo tier
- [x] Comprar desconta ouro e entrega item ao inventário
- [x] Renovar loja consome cota **por loja** (`shop_refresh` melhorias; `ShopStock.refreshUses`)
- [x] Ofertas indisponíveis quando ouro insuficiente ou já compradas
- [x] Cap de raridade por **mains concluídas** (uncommon → rare pós `1-5` → epic pós `1-50` → legendary mapa 3+ → mythic `3-21` / tier ≥ 121)
- [x] Raridade **mythic** só entra no estoque a partir do Ato 3 de Valdris (`main:3-21` ou tier ≥ 121)
- [x] Modal da loja: tooltip com preview grande + comparação vs herói selecionável (sem fechar a loja)
- [x] Arrastar oferta (só se puder pagar) para o slot do herói: compra + equipa; troca exige espaço no inventário/baú
- [x] Grade de ofertas em **4 colunas**; card compacto = ícone + botão de preço (detalhes só no tooltip)
- [x] Botão de preço ≤ largura do ícone; badge ▲/▼ de comparação no canto superior esquerdo (mesmo padrão do inventário)
- [x] Seletor “Comparar com” + loadout do herói no contexto `shop` (sem fechar a loja)
- [x] Cada item possui `basePrice` fixo no catálogo; a loja calcula o preço final exclusivamente como preço base + seus modificadores explícitos (tier/raridade não precificam mais o item)
- [x] Lojas são definições configuráveis (`id`, nome, `unlockAfterMainId`, pool explícito, `priceMultiplier`/`flatPriceAdjustment`); só a mais recente desbloqueada após o marco fica ativa
- [x] Estoque persistido por loja; ofertas compradas somem; common/uncommon/rare podem voltar no refresh; epic/legendary/mythic comprados nunca reaparecem naquela loja
- [x] Balance Lab: aba **Lojas** com CRUD (criar/editar/duplicar/excluir), vínculo ao marco, pool e modificadores globais (`shop-overrides.json` + backups)

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `ShopService`, `ConfigurableShopCatalog`, `ShopStock`, `Gold` VO |
| Application | `GetShopOffersUseCase`, `BuyShopOfferUseCase`, `BuyAndEquipShopOfferUseCase`, `RefreshShopUseCase` |
| Presentation | `ShopModalRenderer`, drag da oferta → slot (`GearDragDrop*`), ícone shop no footer/HUD |

## Invariantes

- Ouro nunca negativo (`Gold.spend`)
- `basePrice` pertence ao item; descontos/ágios pertencem à definição da loja (`priceMultiplier` + `flatPriceAdjustment`)
- Apenas uma loja ativa: a de maior `unlockAfterMainId` já concluído (`main:{phaseId}`); desempate por `id`
- Compra consome a oferta no estoque persistido; raridades limitadas (epic+) entram em `purchasedLimitedItemIds` daquela loja
- Validação de compra no use case, não só na UI
- Drag de oferta só se o jogador puder pagar; troca de equip exige espaço em inventário ou baú

## Fora de escopo

- Moeda premium / IAP

## Testes obrigatórios

- [x] `ShopService.test.ts` — caps por mains concluídas, preços, pool explícito e consumo limitado
- [x] `ConfigurableShopCatalog.test.ts` — criar/editar/excluir lojas e resolver a ativa
- [x] `BuyShopOfferUseCase.test.ts` — oferta comprada não reaparece
- [x] `ShopRefreshRules.test.ts` — cota de renovação por loja
- [x] `RefreshShopUseCase.test.ts` — renovar consome `refreshUses` do estoque da loja e bloqueia no limite
- [x] `ShopModalRenderer.test.ts` — preview no tooltip + seletor de herói / comparação / drag / grade
- [x] `BuyAndEquipShopOfferUseCase.test.ts` — compra+equipa, troca com espaço, erro sem espaço
