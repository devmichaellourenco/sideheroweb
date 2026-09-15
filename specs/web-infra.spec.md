# Spec — Infraestrutura itch.io (HTML5)

## Status

**Aceite:** 8/8 (100%) · 2026-09-14  
**Testes obrigatórios:** 3/3 presentes na suite

## Objetivo

**Único runtime do projeto:** página HTML5 estática para itch.io. Sem extensão Chrome, side panel, service worker, `manifest.json` ou APIs `chrome.*`.

## Critérios de aceite

- [x] `InProcessGameClient` é o único `IGameClient` — despacha `GameMessage` no mesmo JS (`handleGameMessage` + `SerialTaskRunner`)
- [x] Save em `localStorage` (`side_hero_game_state`, `side_hero_achievements`, `side_hero_meta_progress`); migração legado `taskbar_hero_game_state`
- [x] Assets via URLs relativas `./assets/...`
- [x] `npm run build` gera `dist/` com `index.html` na raiz + JS/CSS/assets — sem manifest nem service worker
- [x] Zip itch.io via `npm run release` (conteúdo de `dist/`, sem `.map`) — **só quando o usuário pedir**
- [x] Sem janelas destacadas / pin; menus abrem na própria página
- [x] Layout jogável em iframe itch: shell **960×740**, combate, rail de menus na **base**, sistemas em overlay central
- [x] Backup export/import (`.sidehero`) via `ISaveBackupStore` + Web Crypto

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Application | `IGameClient`, `GameClientTypes` |
| Infrastructure | `handleGameMessage`, `InProcessGameClient`, `LocalStorageKeyValueStore`, `createGameApplication`, `boot.ts` |
| Presentation | `panel.ts` / `panel.html` → `dist/index.html` |
| Build | `scripts/build.mjs`, `scripts/pack-release.mjs` |

## Invariantes

- Use cases não chamam `chrome.*` nem `localStorage` diretamente
- `presentation/` não importa entidades de domínio
- Novas ações = use case + case em `handleGameMessage.ts`
- Sem adapters Chrome; `domain/` e `application/` não conhecem o browser storage

## Fora de escopo

- Extensão Chrome / dual-target
- Polish responsivo mobile / landscape
- Cloud sync
- PWA / service worker web
- IndexedDB (localStorage basta enquanto o save continuar podado)

## Publicação itch.io

1. `npm run build` (e `npm run release` só sob pedido)
2. Kind of project: **HTML**
3. Zip com `index.html` na raiz
4. Viewport: **960×740**
5. Embed in page; Fullscreen button off; Mobile friendly off; SharedArrayBuffer off; scrollbars off; Click to play on

## Testes obrigatórios

- [x] `LocalStorageKeyValueStore.test.ts` — roundtrip JSON e quota
- [x] `InProcessGameClient.test.ts` — `GET_STATE` in-process com store em memória
- [x] `GameStateRepository.test.ts` — roundtrip + migração legado
