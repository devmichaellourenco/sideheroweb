---
name: meta-legacy
description: Meta progressão e legado entre temporadas no Side Hero (FORA do produto canônico atual). Use só para código legado de meta/selos/MetaService — não para design de retenção.
---

# Meta e Legado (fora do produto canônico)

## Spec

`specs/meta-legacy.spec.md`

## Decisão atual

Produto = campanha finita (começo → meio → fim em Morthaven).  
Gate: `META_LEGACY_ENABLED` em `src/application/ProductGates.ts` (**false**).

## Fluxo (código existente, gated)

1. Definição → `MetaUpgradeCatalog`
2. Selos/bônus → `MetaService` (não chamado no tick com gate off)
3. Persistência → `IMetaProgressRepository` (storage separado)
4. Nova run → `NewGameUseCase` (SW bloqueia `NEW_GAME` com gate off)

## Padrões

- Não misturar selos no `GameState` principal
- Não citar legado como promessa em pitch/GDD
- Não reabrir UI de legado sem ligar o gate
- Manter Wow/epílogo de fim de campanha

## Testes

`MetaService.test.ts` — criar ou atualizar; não executar automaticamente.

## Workflow do agente

- **Não** propor novas features de temporada/legado sem pedido explícito
- Preferir conclusão de campanha e retenção early→late
- **Não** executar `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`
