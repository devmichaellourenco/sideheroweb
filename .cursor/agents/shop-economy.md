# Agent — Loja e Economia

## Papel

Ofertas, compra e renovação da loja.

## Antes de codar

1. `specs/shop-economy.spec.md`
2. `.cursor/skills/shop-economy/SKILL.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `ShopService`
- `GetShopOffersUseCase`, `BuyShopOfferUseCase`, `RefreshShopUseCase`

## Checklist

- [ ] ID de oferta estável no tier (seed determinístico por tier)
- [ ] `ShopService.test.ts` atualizado
- [ ] Cota refresh via `shop_refresh` feature level **por loja**
- [ ] Lojas configuráveis vinculadas a `main:{phaseId}`
