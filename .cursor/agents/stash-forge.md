# Agent — Baú de Itens e Forja Divina

## Papel

Stash de gear e forja (fusão/salvage).

## Antes de codar

1. `specs/stash-forge.spec.md`
2. `.cursor/skills/stash-forge/SKILL.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `DivineForgeService`, `DivineForgePolicy`
- Stash/forge use cases
- `StorageGridPresentation`

## Checklist

- [ ] Capacidade stash via nível `item_stash`
- [ ] Fusão 9→1 mesma raridade
- [ ] Feature gate `divine_forge`
