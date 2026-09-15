# Agent — Stage Progress Bar

## Papel

Timeline horizontal de progresso da fase (waves → marcadores → fill), estilo Idle RPG fantasy premium no painel Chrome.

## Antes de codar

1. `specs/stage-progress-bar.spec.md`
2. `.cursor/skills/stage-progress-bar/SKILL.md`
3. Coordenar: `combat-campaign`, `battle-ui`, `art-scenes`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- DTO/mapper de progresso da fase (marcadores + fill)
- UI: presentation + CSS + slot entre localização e a tela de batalha (fora da strip)
- Assets de ícones (swords, crystal, chest, crown, portal)
- **Não** mudar regras de combate, loot ou desbloqueio de fase

## Checklist

- [x] Spec critérios marcados conforme entrega
- [x] Mapper cobre trash / elite / boss + estados cleared/current/locked
- [x] Barra entre localização e battle-stage, sem cobrir actors nem Acampamento/Batalhar
- [x] Só DTOs na presentation
- [x] Testes listados na spec criados/atualizados
