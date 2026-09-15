# Spec — Áudio (música e SFX)

## Status

**Aceite:** 6/8 (75%) · fase 2 — cliques de UI  
**Testes obrigatórios:** 4/4 presentes na suite

## Objetivo

Sistema de áudio no painel Chrome: trilhas de fundo por contexto de jogo, com preferências locais e transição suave entre momentos.

## Critérios de aceite — fase 1 (música)

- [x] Catálogo declarativo com trilha **acampamento** (`camp`) e **batalha** (`battle`)
- [x] Assets em `public/audio/music/` copiados para `dist/panel/assets/audio/music/` no build
- [x] `GameMusicController` toca em loop com crossfade entre trilhas
- [x] Troca automática: `phaseRun` ativo → batalha; caso contrário → acampamento
- [x] Pausa com painel oculto (`document.hidden`); retoma ao voltar
- [x] Desbloqueio de autoplay no primeiro gesto do usuário (política do Chrome)
- [x] Preferências `musicEnabled` e `musicVolume` em Configurações
- [x] SFX de cliques de UI (`menu`, `confirm`, `back`) com `GameSfxController`
- [x] Preferências `sfxEnabled` e `sfxVolume` em Configurações
- [ ] SFX de combate e recompensas

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Presentation | `GameMusicCatalog.ts`, `resolveGameMusicTrack.ts`, `GameMusicController.ts` |
| Presentation | `GameSfxCatalog.ts`, `resolveUiClickSfx.ts`, `GameSfxController.ts` |
| Presentation | `GamePreferences.ts`, `SettingsModalRenderer.ts`, `GameViewController.ts` |
| Build | `scripts/copy-assets.mjs` — pasta `public/audio/` |
| Assets | `public/audio/music/camp.wav`, `public/audio/music/battle.wav` |
| Assets | `public/audio/sfx/ui_click_menu.ogg`, `ui_click_confirm.ogg`, `ui_click_back.ogg` |

## Créditos (música)

Registro canônico: `src/presentation/audio/GameMusicCredits.ts` · cópia junto aos assets: `public/audio/music/CREDITS.md`

| Trilha | Arquivo | Obra | Autor | Licença | Fonte |
|--------|---------|------|-------|---------|-------|
| `camp` | `camp.wav` | Medieval: Minstrel Dance | RandomMind | CC0 | https://opengameart.org/content/medieval-minstrel-dance |
| `battle` | `battle.wav` | Medieval: Battle | RandomMind | CC0 | https://opengameart.org/content/medieval-battle |

## SFX de UI (cliques)

Registro canônico: `GameSfxCredits.ts` · biblioteca OGA: `GameAudioAttribution.ts` · docs: `public/audio/OPENGAMEART_CREDITS.md`

| ID | Arquivo | Obra | Autor | Licença | Fonte |
|----|---------|------|-------|---------|-------|
| `menu` | `ui_click_menu.ogg` | Click UI Menu — select | qubodup | CC0 | https://opengameart.org/content/click-ui-menu-sfx-yesnoselect |
| `confirm` | `ui_click_confirm.ogg` | Click UI Menu — yes | qubodup | CC0 | https://opengameart.org/content/click-ui-menu-sfx-yesnoselect |
| `back` | `ui_click_back.ogg` | Click UI Menu — no | qubodup | CC0 | https://opengameart.org/content/click-ui-menu-sfx-yesnoselect |

**Atribuições obrigatórias** se outros SFX CC-BY do export OGA entrarem no jogo: ver `REQUIRED_AUDIO_ATTRIBUTION_LINES` em `GameAudioAttribution.ts` (ViRiX, Item Handling, eklee/qubodup, Gary, Triki Minut).

Implementação do player: `GameSfxController` — delegação de clique em `GameViewController` via `resolveUiClickSfx`.

## Fora de escopo (fase 2 parcial)

- SFX de combate, voz e recompensas

## Invariantes

- Presentation não importa domínio — decisão de trilha usa apenas campos do `GameStateDto`
- Música só inicia após splash (`bootReady`)
- SFX de clique funcionam nos controles da página
- Falha ao carregar arquivo não quebra o painel (fail silent)

## Fora de escopo (geral)

- SFX de combate/recompensa, voz, mixagem dinâmica por wave/boss
- Áudio com a página em segundo plano / fechada

## Testes obrigatórios

- [x] `resolveGameMusicTrack.test.ts` — mapeamento acampamento vs batalha
- [x] `GameMusicController.test.ts` — crossfade, mute, visibilidade
- [x] `GameMusicCredits.test.ts` — URLs e autores registrados
- [x] `GameSfxCredits.test.ts` — paths dos cliques de UI
- [x] `GameSfxController.test.ts` — unlock, mute e mapeamento
- [x] `GameAudioAttribution.test.ts` — linhas obrigatórias OGA
