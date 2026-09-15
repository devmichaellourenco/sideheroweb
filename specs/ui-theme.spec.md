# Spec — Tema de UI (claro / escuro)

## Status

**Aceite:** 8/8 (100%)  
**Testes obrigatórios:** 2/2 presentes na suite

## Objetivo

Permitir escolher o **tema de UI** do painel Side Hero entre **claro** (pergaminho medieval) e **escuro** (inversão harmônica; **default**).

**Exceção (v1):** `.battle-stage` em combate (strip, floats, waves / stage-progress) **não** muda visualmente com o tema escuro — permanece no tratamento canônico claro. **Hub com mapa embutido** (`.battle-stage--camp-map`) herda o tema do painel, igual ao modal Mapa.

## Critérios de aceite

- [x] Tokens do tema escuro em `MedievalThemeTokens.ts` (`MEDIEVAL_THEME_DARK`) espelhados em `panel.css` via `html[data-ui-theme='dark']`
- [x] Tema escuro é o default (`data-ui-theme='dark'` / preferência inicial); claro disponível em Config
- [x] Preferência `uiTheme` em Configurações (select Claro / Escuro), persistida (localStorage)
- [x] Ao mudar o tema, `document.documentElement` recebe `data-ui-theme` imediatamente
- [x] `.battle-stage:not(.battle-stage--camp-map)` sob tema escuro restaura tokens canônicos claros (batalha inalterada); mapa embutido no hub segue o tema do painel/modal
- [x] Raridades (`--rarity-*`) e acentos de mapa (`--map-*` / `data-campaign-theme`) preservados no escuro (podem herdar; não forçar recolor)
- [x] Poço de ícone (`--icon-well*`) permanece creme/ouro nos dois temas — contraste para sprites com linha escura
- [x] Testes de tokens dark + preferência/aplicação de tema
- [x] Superfícies chrome usam `var(--parchment-*)` / `color-mix` (sem `rgba` de pergaminho fixo)
- [x] Rótulos em painéis sempre-escuros usam `--on-dark-panel-*` / `--forest-cta-label` (não invertem)

## Paleta escura (princípio)

| Papel | Claro | Escuro (diretriz) |
|-------|-------|-------------------|
| Fundo / `--bg` | pergaminho `#f3e4bc` | tinta `#1f1710` |
| Superfície | `#fff9ed` | madeira escura `#2a2118` |
| Texto | tinta `#1f1710` | pergaminho `#fff9ed` |
| Texto secundário | `#3d3428` | pergaminho médio `#d4c4a0` |
| Ouro / floresta / perigo / info | tons densos no claro | versões mais claras/saturadas para contraste no escuro |

Canônico: `MEDIEVAL_THEME` (light) + `MEDIEVAL_THEME_DARK`. Aplicação: `applyUiTheme()`.

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Presentation | `MedievalThemeTokens.ts`, `applyUiTheme.ts`, `panel.css`, `GamePreferences.ts`, `SettingsModalRenderer.ts`, `GamePreferencesController.ts`, `GameViewController.ts` |
| Spec/skill | esta spec, `medieval-theme.spec.md`, skill `medieval-theme` |

## Invariantes

- Não alterar lógica de combate / DTOs / use cases
- Não recolorir arte de cenário de batalha
- Tema é preferência de presentation (não game state)

## Fora de escopo (v1)

- Tema automático (system preference)
- Recolorir battle strip / floats / stage-progress
- Temas além de light/dark

## Testes obrigatórios

- [x] `MedievalThemeTokens.test.ts` — dark inverte bg/texto; chaves alinhadas ao light
- [x] `applyUiTheme.test.ts` + `GamePreferencesController.test.ts` — aplica `data-ui-theme` e persiste `uiTheme`

## Relacionado

- [`medieval-theme.spec.md`](medieval-theme.spec.md)
- [`battle-ui.spec.md`](battle-ui.spec.md)
- [`stage-progress-bar.spec.md`](stage-progress-bar.spec.md)
