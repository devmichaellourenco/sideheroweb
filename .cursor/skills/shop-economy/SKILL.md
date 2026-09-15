---
name: shop-economy
description: Loja, ofertas e economia de ouro no Side Hero. Use para shop, loja, renovar loja, buy offer ou ShopService.
---

# Loja e Economia

## Spec

`specs/shop-economy.spec.md`

## Fluxo

1. Ofertas → loja ativa (`resolveActiveShop`) + estoque persistido (`ShopService.offersFromStock`)
2. Compra → `BuyShopOfferUseCase` valida ouro + consome a oferta no estoque
3. Refresh → `RefreshShopUseCase` rerola o pool da loja ativa, preservando epic+ já comprados

## Padrões

- Ouro via VO `Gold` — `canAfford` / `spend`
- Lojas declarativas em `shops.catalog.json` + overrides em `shop-overrides.json`
- Só a loja do maior marco `main:*` já concluído fica ativa
- Melhoria `shop_refresh` controla cota e desconto **por loja**
- Cap de raridade por **mains** (`getShopMaxRarityIndex`); mythic só Ato 3 Valdris (`main:3-21` / tier ≥ 121)
- Preço: `basePrice` do item × `priceMultiplier` da loja + `flatPriceAdjustment`
- common/uncommon/rare podem voltar após refresh; epic/legendary/mythic comprados nunca retornam naquela loja
- UI da loja: grade **4 colunas**; card = ícone + preço; detalhes no tooltip; badge ▲/▼; seletor + loadout (`shop`); drag da oferta paga → slot (`BuyAndEquipShopOfferUseCase`)

## Testes

`ShopService.test.ts`, `ConfigurableShopCatalog.test.ts`, `BuyShopOfferUseCase.test.ts`, `ShopRefreshRules.test.ts`, `ShopModalRenderer.test.ts`, `BuyAndEquipShopOfferUseCase.test.ts` — criar ou atualizar; não executar automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
