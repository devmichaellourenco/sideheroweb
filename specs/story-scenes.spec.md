# Spec — Cenas narrativas por Ato

## Status

**Aceite:** 9/10 (90%)  
**Testes obrigatórios:** 5/5

## Objetivo

Cada **ato** de cada **região** (mapa) da campanha exibe uma **cena narrativa**: imagem + texto com o que acontece, o que passou e o que espera o grupo. A cena aparece como **card na trilha da campanha** e, na **primeira vez** que o ato é desbloqueado, abre em overlay **pausando o jogo** até o jogador dispensar.

## Escopo v1

- Jogo base: mapas `stendra`, `gruftall`, `valdris`, `morthaven` (5 atos × 4 regiões = 20 cenas)
- Catálogo declarativo em domínio (`ActSceneCatalog`)
- Imagem: banner da região (`CampaignSceneCatalog`) até arte dedicada por ato existir
- Textos em português; identificadores em inglês

## Critérios de aceite

- [x] Catálogo `ActSceneCatalog` com id estável `{mapId}-act-{n}` e copy recap/preview
- [x] `CampaignProgress.viewedActSceneIds` persiste cenas já vistas
- [x] Card de cena em cada seção de ato na trilha (`CampaignMapPresentation`)
- [x] Primeira liberação do ato dispara overlay de cena e **bloqueia ticks** até dispensar
- [x] `MARK_ACT_SCENE_VIEWED` marca cena vista no save
- [x] Celebrações Wow (macro) e overlay de vitória de marco **bloqueiam ticks** enquanto visíveis
- [x] Presentation não importa entidades de domínio — só DTOs
- [ ] Cenas DLC (mapas 5–10) podem existir no catálogo mas ficam fora do escopo v1 de copy
- [x] Releitura manual no modal de campanha (botão no card) sem exigir nova marcação
- [x] "Ver cena" no modal unpin (janela destacada) retransmite o overlay para o painel principal
- [x] Testes listados abaixo criados/atualizados

## Gatilhos

| Evento | Comportamento |
|--------|----------------|
| Primeira fase do ato desbloqueada | Overlay automático + pausa |
| Primeira sessão com `1-1` desbloqueada e cena do Ato I não vista | Overlay do Ato I de Stendra |
| Boss X-50 / finale | Overlay de vitória existente + Wow de marco (já pausam com esta feature) |
| Conclusão de missão principal/secundária (`camp-missions`) | Pode disparar cena dedicada ou reutilizar ato — ver [`camp-missions.spec.md`](camp-missions.spec.md) |
| Card "Ver cena" no mapa | Overlay somente leitura; não re-marca se já vista |
| Card "Ver cena" com campanha unpin | Relay via storage → overlay no painel principal |

## Critérios — camp-missions (novos)

- [ ] Cena narrativa pode ser recompensa exclusiva de quest secundária (id estável no catálogo)
- [ ] Cards/overlay de cena adaptados ao mapa de locais (não só trilha linear de fases)

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `ActSceneCatalog.ts`, `ActScenePolicy.ts`, `CampaignProgress` |
| Application | `MarkActSceneViewedUseCase`, `ActSceneDtoMapper`, `GetCampaignOverviewUseCase` |
| Presentation | `ActSceneCardPresentation.ts`, `ActSceneOverlayPresentation.ts`, `ActSceneFlow.ts`, `GameViewController`, `CampaignMapPresentation` |
| Infra | `handleGameMessage.ts` (`MARK_ACT_SCENE_VIEWED`) |

## Invariantes

- Uma cena automática por vez (fila implícita: próxima só após dispensar a atual)
- `viewedActSceneIds` não remove entradas ao liberar DLC futura
- Domínio não conhece DOM nem browser

## Fora de escopo

- Voz/narração, vídeo, escolhas ramificadas
- Arte única por ato (usa banner da região no v1)

## Testes obrigatórios

- [x] `ActScenePolicy.test.ts` — desbloqueio, detecção de cena nova
- [x] `ActScenePresentation.test.ts` — markup do card na trilha
- [x] `ActScenePresentation.test.ts` — overlay com recap/preview
- [x] `MarkActSceneViewedUseCase.test.ts` — persistência
- [x] `WowCelebrationController.test.ts` — `isBlockingAdvance` durante celebração
- [x] `ActSceneViewRelay.test.ts` — pedido de overlay da janela unpin para o painel principal
