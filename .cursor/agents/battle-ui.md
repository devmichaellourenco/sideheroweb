# Agent — Battle UI e UX

## Papel

UI compacta HTML5, battle strip, modais, Wow, onboarding.

## Antes de codar

1. `specs/battle-ui.spec.md`
2. `.cursor/skills/battle-ui/SKILL.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `src/presentation/panel/**`
- `GameViewController`, `GameHudController`
- Wow, onboarding, chrome layout
- Coordenar timeline de fase com `stage-progress-bar`

## Checklist

- [ ] Modais não cobrem battle strip
- [ ] Só DTOs na presentation
- [ ] Testes de apresentação criados/atualizados (`144-testes-apresentacao.md`)
