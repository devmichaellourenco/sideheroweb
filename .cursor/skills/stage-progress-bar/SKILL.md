---
name: stage-progress-bar
description: Stage Progress Bar / timeline de waves da fase no Side Hero. Use para barra de progresso da fase, checkpoints, elite, boss crown, fill de wave, StageProgressDto ou adventure path da fase.
---

# Stage Progress Bar

## Spec

`specs/stage-progress-bar.spec.md`

## Coordenação SDD

```
@.cursor/skills/stage-progress-bar/SKILL.md
+ @.cursor/skills/combat-campaign/SKILL.md
+ @.cursor/skills/battle-ui/SKILL.md
```

## Fluxo

1. Fase ativa → waves + `waveIndex` / `waveCount` / roles (`trash` | `elite` | `boss`)
2. Mapper → `StageProgressDto` (marcadores ordenados + `fillRatio` + estado por nó)
3. UI → `StageProgressBarPresentation` + renderer no chrome da batalha
4. Tick / clear / wipe / Batalhar → re-render do fill e estados

## Marcadores

| Evento | Visual |
|--------|--------|
| Wave comum | círculo + ⚔️ |
| Elite | ◆ cristal roxo |
| Boss | 👑 coroa (fim) |
| Baú (opcional) | 📦 antes do boss |
| Portal (opcional) | portal / próximo mapa |

Estados: **concluído** · **atual** (glow) · **futuro** (locked)  
UI: **sem texto** sob os ícones — só espadas / cristal / coroa. Boss ancorado no fim da trilha; fill para na wave atual.

## Direção de arte (v1)

Moldura em ouro envelhecido com detalhes rúnicos; trilho central formado por energia mágica azul, em vez de uma simples barra sólida; checkpoints em formato de medalhões iluminados; elites marcadas por um cristal roxo; baús lendários como checkpoints opcionais; boss representado por uma coroa ou portal monumental na extremidade; contornos grossos e brilho intenso para manter excelente legibilidade em telas pequenas.

Referências de qualidade: AFK Arena, Mobile Legends Adventure, Legend of Mushroom — Idle RPG fantasy AAA mobile; aspect ~6:1; PNG transparente só do componente.

## Layout no painel

- No topo de `.battle-stage`, **colada** à battle strip (sem gap de altura)
- Abaixo de `campaign-context-bar` no fluxo do painel; fora do interior da strip (não cobre actors)
- Não cobrir Acampamento / Batalhar
- `pointer-events: none` no root
- v1 = trilha **reta**; Adventure Path curvo = backlog

## Arquivos planejados

- `application/dto/StageProgressDto.ts` + mapper
- `presentation/components/StageProgressBar*.ts`
- `panel.html` / `panel.css` — slot + estilos
- `public/.../ui/stage-progress/` + `AssetCatalog`

## Testes

Listados na spec — criar/atualizar; **não** executar `npm test` automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
