# Spec — Meta e Legado entre Temporadas

## Status

**Produto canônico:** **fora de escopo neste momento**  
**Gate de código:** `META_LEGACY_ENABLED = false` em `src/application/ProductGates.ts`  
**Código domain:** permanece; presentation/application/SW respeitam o gate  
**Aceite histórico (implementação):** 6/6 · **Testes:** 1/1

## Decisão de produto (atual)

Side Hero é um jogo de **começo, meio e fim**. A vitória em `4-50` (Duque de Morthaven) **encerra a jornada**.

Com o gate desligado:

- Settings **não** expõe “Abrir legado”
- Tick **não** concede selos nem aplica `MetaBonusScope`
- SW rejeita `GET_META_TREE`, `PURCHASE_META_UPGRADE` e `NEW_GAME`
- Celebração de fim (Wow `season_complete` + epílogo/créditos) **permanece**

Ver `docs/game-design/GDD.md` (pilares + mapa de retenção) e `docs/game-design/PITCH.md`.

## Objetivo legado (somente histórico de implementação)

Após concluir temporada, o jogador ganhava **selos** persistentes e comprava bônus permanentes na árvore meta para acelerar a próxima run.

## Critérios de aceite (implementação existente — não expandir)

- [x] Progresso meta em repositório separado (`IMetaProgressRepository`)
- [x] Selos concedidos ao finalizar temporada (`MetaService`) — **desligado por gate**
- [x] Árvore meta com upgrades permanentes (`MetaUpgradeCatalog`)
- [x] Bônus aplicados em nova run (`MetaBonuses`, escopo por feature) — **desligado por gate**
- [x] Modal de legado no código (`MetaLegacyModalRenderer`) — **sem entry point de UI**
- [x] Temporada/campanha conclui ao vencer `4-50` (Duque de Morthaven) no perfil `base`

## Escopo v1 (congelado)

Não evoluir esta feature até decisão explícita de produto (`META_LEGACY_ENABLED = true`). Preferir polish de conclusão de campanha.

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Gate | `src/application/ProductGates.ts` |
| Domain | `src/domain/meta/*` |
| Application | `GetMetaTreeUseCase`, `PurchaseMetaUpgradeUseCase`, `NewGameUseCase`, `TickGameUseCase` |
| Presentation | `MetaLegacyModalRenderer` (órfão), Wow/epílogo de fim |

## Invariantes

- Save de jogo (`side_hero_game_state`) separado do meta progress
- Documentação de produto **não** deve prometer legado/temporadas
- Com gate off, nenhum selo novo é concedido

## Fora de escopo

- Leaderboards online
- Expansão da árvore meta
- Qualquer retenção baseada em NG+
