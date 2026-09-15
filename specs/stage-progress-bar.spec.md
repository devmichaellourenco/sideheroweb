# Spec — Stage Progress Bar (barra de progresso da fase)

## Status

**Aceite:** 14/14 (100%)  
**Testes obrigatórios:** 5/5 presentes na suite

## Objetivo

Exibir uma **timeline horizontal** (Stage Progress Bar) durante a **missão/fase ativa**, para o jogador ver em que wave/evento está — padrão de Idle RPG / AFK (AFK Arena, MLA, Legend of Mushroom).

> Com [`camp-missions`](camp-missions.spec.md), a barra só aparece **dentro** de uma missão em andamento (não no hub do mapa).
Cada marcador é um evento da fase; a barra preenche conforme o avanço.

```
Início    W5      W10      Elite      Boss
⚔️──────●──────●──────◆────────👑
```

## Critérios de aceite

### Dados e modelo

- [x] View model deriva dos waves da fase atual (`phaseRun` + definição da fase): roles `trash` | `elite` | `boss`
- [x] Marcadores na ordem das waves; wave atual destacada; waves anteriores = concluídas; posteriores = futuras
- [x] Fill da trilha proporcional ao progresso (`waveIndex` / `waveCount−1` ou equivalente estável)
- [x] Presentation consome **apenas DTO** (ex.: `StageProgressDto`) — sem entidades de domínio

### Marcadores (ícones)

| Tipo | Forma / ícone | Origem |
|------|---------------|--------|
| Wave comum (`trash`) | círculo + espadas cruzadas | role trash |
| Elite | losango / cristal roxo | role elite (wave com elite dominante ou meta) |
| Boss | coroa (ou portal monumental) | última wave / `isBossWave` |
| Baú *(opcional)* | baú lendário | checkpoint antes do boss quando houver recompensa de fase/marco |
| Portal *(opcional)* | portal | fim de mapa / unlock da próxima região (ex.: `X-50`) |

- [x] Estados visuais por marcador: **concluído** (✔), **atual** (✨ glow), **futuro** (🔒 / esmaecido)
- [x] Empty vs filled da trilha claramente distintos

### Layout e UX (painel Chrome)

- [x] Barra horizontal no topo de `.battle-stage`, **colada** à battle strip (sem gap); abaixo da localização no fluxo — sem cobrir combate nem Acampamento/Batalhar
- [x] Altura alvo ~40px na coluna do jogo (legível; arte base pode ser 64–128px e escalar)
- [x] Aspecto aproximado **6:1**; moldura ornamental sem “chrome” extra ao redor do componente
- [x] Visível com fase ativa (`phaseRun`); oculta no mapa-mundo sem combate / fora de fase
- [x] Entre fases (intermissão), mantém a última barra e **reserva altura** para não saltar a strip/combat bar
- [x] Atualiza no tick / clear de wave / wipe (volta wave 1) / Batalhar após acampamento
- [x] Não bloqueia cliques da combat bar nem dos actors da strip (`pointer-events: none` no root)

### Direção de arte (v1)

- [x] Moldura ouro envelhecido + detalhes rúnicos; trilho de energia mágica azul (não barra sólida flat)
- [x] Checkpoints em medalhões; elite = cristal roxo; boss = coroa; baú opcional lendário (kind preparado; marcadores v1 = waves)
- [x] Contornos grossos, highlights fortes, glow sutil — legível em tela estreita
- [x] Assets via `AssetCatalog` (`stageSwords` / `stageChest`); elite/boss com glifo estilizado no medalhão

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `src/domain/campaign/StageProgress.ts` |
| Application | `StageProgressDto`, `StageProgressMapper`, `phaseRun.stageProgress` no presenter |
| Presentation | `StageProgressBar*`, `#stage-progress-root` entre localização e `.battle-stage`, `panel.css` |
| Assets | `ASSETS.ui.stageSwords`, `ASSETS.ui.stageChest` |

Coordenar com: `combat-campaign` (waves/roles), `battle-ui` (chrome/strip), `art-scenes` (tom visual).

## Invariantes

- Não alterar lógica de combate/loot — só leitura de progresso
- Wipe reinicia marcadores/fill para o início da mesma fase
- Replay de fase já cleared usa a mesma timeline
- Domínio continua sem conhecer Chrome/DOM

## Fora de escopo (v1)

- Adventure Path curvo (path 2.5D) — backlog; v1 = trilha horizontal reta
- Editor de checkpoints custom por fase além dos roles de wave
- Mini-mapa mundial (já coberto por `CampaignMapPresentation`)

## Relacionado

- [`combat-campaign.spec.md`](combat-campaign.spec.md) — waves, elite, boss
- [`battle-ui.spec.md`](battle-ui.spec.md) — strip, combat bar, chrome
- [`art-scenes.spec.md`](art-scenes.spec.md) — atmosfera fantasy pintada

## Testes obrigatórios

- [x] `StageProgress.test.ts` — trash/elite/boss + índices concluído/atual/futuro (+ fill)
- [x] `StageProgressMapper.test.ts` — DTO a partir da fase
- [x] `StageProgressBarPresentation.test.ts` — markup dos estados e tipos
- [x] `StageProgressBarRenderer.test.ts` — hide sem `phaseRun`; update de fill
- [x] Classes CSS críticas (`--cleared`, `--current`, `--locked`) assertadas na presentation; wire em `GameViewController`

## Backlog

- Adventure Path com micro-animações por nó
- Marcador de baú atado a first-clear / chest pending
- Portal no finale de região (`X-50`)
- Ícones PNG dedicados (cristal / coroa / portal) além dos glifos atuais
