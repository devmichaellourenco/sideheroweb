---
name: web-infra
description: Infraestrutura HTML5 do Side Hero para itch.io — build dist/, InProcessGameClient, localStorage, assets relativos e zip. Use para itch.io, HTML5, build, release, InProcessGameClient, localStorage ou persistência.
---

# Infra itch.io (HTML5)

## Spec

`specs/web-infra.spec.md`

Este repositório **só** publica no itch.io. Não há extensão Chrome.

## Fluxo

```
UI → InProcessGameClient.send → SerialTaskRunner → handleGameMessage → UseCase → DTO
```

Novas ações = use case + case em `handleGameMessage.ts`.

## Storage

- Port: `IKeyValueStore` → `LocalStorageKeyValueStore`
- Chaves: `side_hero_game_state`, `side_hero_achievements`, `side_hero_meta_progress`
- Repositórios recebem o KV store (memória nos testes)

## Assets

`getAssetUrl` → `./assets/…`. HTML/CSS usam paths relativos; `index.html` e `panel.css` no mesmo nível que `assets/`.

## Build

```bash
npm run build      # dist/index.html + game.js + assets
npm run release    # zip itch.io → releases/ — só quando o usuário pedir
```

## Layout

Coluna centrada (~420px). Sem pin/janelas destacadas.

## Testes

`LocalStorageKeyValueStore.test.ts`, `InProcessGameClient.test.ts`, `GameStateRepository.test.ts` — criar ou atualizar; não executar automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar zip (`release`) até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`
