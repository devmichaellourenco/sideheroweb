# Spec — Tema medieval (paleta do painel)

## Status

**Aceite:** 9/9 (100%)  
**Testes obrigatórios:** 1/1 presentes na suite

## Objetivo

Aplicar no painel Side Hero o padrão visual do **tutorial/onboarding**: fundo **pergaminho claro**, tipografia **tinta escura**, bordas em **ouro de selo** e CTAs em **verde floresta**.

**Exceção:** a **battle strip** (arte cênica) e a **Stage Progress Bar** (waves) permanecem no tratamento visual próprio — não forçar pergaminho nelas. A barra **Acampamento** (e demais CTAs da combat bar) segue o chrome pergaminho.

Referência canônica: card `.onboarding-card`.

## Critérios de aceite

- [x] Tokens em `:root` + `MedievalThemeTokens.ts` — chrome claro (pergaminho) + texto tinta + semântica (dano/cura/elementos)
- [x] `#app`, header, trilha/campanha, footer de ações, modais e cards usam fundo claro e texto escuro
- [x] Onboarding consome as mesmas CSS vars
- [x] `.battle-stage` (strip + combat bar) **não** herda o pergaminho como fundo de combate; hub `.battle-stage--camp-map` segue o tema do painel (mapa = modal)
- [x] `.stage-progress-*` (waves) **não** é recolorido para pergaminho
- [x] Temas por mapa (`data-campaign-theme`) e raridades (`--rarity-*`) preservados
- [x] Accent selo (`#8b3a2f`) no lugar do rosa neon; sem azul cyber como default de chrome
- [x] Contraste legível: tinta em pergaminho no chrome; legibilidade na strip de batalha intacta
- [x] Tema escuro opcional via Config (`ui-theme.spec.md`) — chrome só; batalha isolada

## Tokens canônicos (tutorial → chrome)

| Token | Hex | Uso |
|-------|-----|-----|
| `--parchment-0` | `#fff9ed` | Superfície principal / cards |
| `--parchment-1` | `#f3e4bc` | Fundo do app / meio do gradiente |
| `--parchment-2` | `#e8d4a0` | Base / sombra do pergaminho |
| `--icon-well` | `#e8d4a0` | Poço de item/skill — extremo creme do gradiente |
| `--icon-well-deep` | `#c9a050` | Poço — extremo dourado (gradiente dourado → creme) |
| `--icon-well-border` | `#c9a227` | Filete dourado discreto do poço |
| `--ink` / `--text` | `#1f1710` | Texto principal no chrome |
| `--ink-muted` / `--muted` | `#3d3428` | Texto secundário |
| `--seal-gold` | `#c9a227` | Bordas |
| `--seal-gold-dark` / `--gold` | `#8a6510` | Ênfase legível no claro |
| `--forest` / `--forest-hi` | `#2f6b38` / `#3f8a49` | CTA positivo |
| `--accent` | `#8b3a2f` | Selo / perigo |
| `--bg` | `#f3e4bc` | Fundo do painel (`--parchment-1`) |
| `--surface` | `#fff9ed` | Superfície elevada (`--parchment-0`) |

### Semântica no pergaminho (fonte única para trocar tema)

| Token | Hex / alias | Uso |
|-------|-------------|-----|
| `--danger` | `#8a2828` | Dano, delta negativo, requisito falho |
| `--info` | `#1a5a8a` | Mitigação / info / azul de equipamento |
| `--crit` | `var(--seal-gold-dark)` | Crítico |
| `--stat-better` | `var(--forest)` | Delta positivo |
| `--stat-worse` | `var(--danger)` | Delta negativo |
| `--log-damage` / `--log-heal` / `--log-crit` / `--log-mitigation` | aliases | Log de batalha |
| `--element-fire` | `#b85a10` | Elemento fogo (claro) |
| `--element-cold` | `#156a8a` | Elemento gelo |
| `--element-lightning` | `#8a7010` | Elemento raio |
| `--element-air` | `#3f7f73` | Elemento ar |
| `--legend-heroes` | `#6a3a8a` | Legenda Heróis na árvore (não acoplar a `--element-air`) |
| `--ascension-arcane` | `#6a3a8a` | Título do caminho arcano (não acoplar a `--element-air`) |

Canônico TS: `MedievalThemeTokens.ts` (`MEDIEVAL_THEME` + `MEDIEVAL_THEME_SEMANTICS`). Ao mudar tema, alterar tokens → espelhar `:root` → UI via `var(--*)`.

**Contexto ≠ hex:** mesmo valor em usos diferentes → variáveis distintas (ex. `--float-lightning` e `--float-crit-heal`; `--badge-downgrade-fill` e `--map-crimson-abyss`; `--xp-fill-end` e `--wave-marker-gold-label`). Componentes fora de `:root` não usam hex literal — só `var(--*)`.

Battle/waves usam tokens de contexto próprios (não `--bg`/`--surface` do chrome).

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Presentation | `panel.css` (`:root` + chrome), `MedievalThemeTokens.ts` |
| Coordenação | `battle-ui`, `stage-progress-bar`, `art-scenes` |

## Invariantes

- Não alterar lógica de jogo / DTOs / combate
- Não recolorir assets de cenário por região
- Chrome = claro; batalha + waves = exceção visual

## Fora de escopo

- Redesign de sprites/ícones
- WCAG AAA
- Recolorir banners de campanha

## Testes obrigatórios

- [x] `MedievalThemeTokens.test.ts` — tokens batem com a tabela canônica do tutorial

## Relacionado

- [`battle-ui.spec.md`](battle-ui.spec.md)
- [`stage-progress-bar.spec.md`](stage-progress-bar.spec.md)
- [`art-scenes.spec.md`](art-scenes.spec.md)
