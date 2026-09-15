# Agent — Infra itch.io (HTML5)

## Papel

Runtime HTML5: build `dist/`, cliente in-process, localStorage, assets relativos, zip itch.io.

## Antes de codar

1. `specs/web-infra.spec.md`
2. `.cursor/skills/web-infra/SKILL.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`
- **Não** gerar zip (`npm run release`) até o usuário solicitar

## Escopo

- `src/infrastructure/**` (sem APIs Chrome)
- `src/presentation/panel/**` (entry HTML5)
- `scripts/build.mjs`, `scripts/pack-release.mjs`

Fora: lógica de combate/campanha (outros agents); polish mobile.

## Checklist

- [ ] `dist/index.html` na raiz, sem manifest/SW
- [ ] Save só em localStorage
- [ ] Sem `chrome.*`
- [ ] Testes da spec criados/atualizados (não executar automaticamente)
