---
name: game-audio
description: Música e SFX do Side Hero — trilhas, preferências e GameMusicController. Use para áudio, música, BGM, som, sfx ou musicEnabled.
---

# Game Audio

## Spec

`specs/game-audio.spec.md`

## Trilhas (fase 1)

| ID | Momento | Arquivo |
|----|---------|---------|
| `camp` | Acampamento, menus, hub | `public/audio/music/camp.wav` |
| `battle` | Missão ativa (`phaseRun`) | `public/audio/music/battle.wav` |

Build copia `public/audio/` → `dist/panel/assets/audio/`.

## Créditos

`GameMusicCredits.ts` · `public/audio/music/CREDITS.md` · seção em `specs/game-audio.spec.md`

- **camp** — [Medieval: Minstrel Dance](https://opengameart.org/content/medieval-minstrel-dance) (RandomMind, CC0)
- **battle** — [Medieval: Battle](https://opengameart.org/content/medieval-battle) (RandomMind, CC0)

## SFX de UI (cliques)

`GameSfxCatalog.ts` · `GameSfxCredits.ts` · `GameSfxController.ts` · `public/audio/sfx/CREDITS.md`

- **menu** → `ui_click_menu.ogg` (qubodup `select`)
- **confirm** → `ui_click_confirm.ogg` (`yes`)
- **back** → `ui_click_back.ogg` (`no`)

Pack: [Click UI Menu SFX](https://opengameart.org/content/click-ui-menu-sfx-yesnoselect) (qubodup, CC0)

Biblioteca OGA completa e atribuições obrigatórias: `GameAudioAttribution.ts` · `public/audio/OPENGAMEART_CREDITS.md`

## Fluxo

```
GameViewController.render → resolveGameMusicTrack(state) → GameMusicController.sync(track)
Cliques → resolveUiClickSfx(target) → GameSfxController.play(id)
```

- Splash ativa: sem música
- `document.hidden`: pausa
- Primeiro `pointerdown`: desbloqueia autoplay

## Preferências

`GamePreferences`: `musicEnabled`, `musicVolume`, `sfxEnabled`, `sfxVolume` (0–1) — sessionStorage/localStorage via `GamePreferences.ts`.

## Testes

`resolveGameMusicTrack.test.ts`, `GameMusicController.test.ts` — criar/atualizar; não executar automaticamente.
