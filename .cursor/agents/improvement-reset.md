# Agent — Reset de Pontos de Aprimoramento

## Papel

Desbloqueio na árvore de Runas (níveis I e II) e refund seguro: ponto a ponto e **em massa**, com toasts de bloqueio/parcial.

## Antes de codar

1. `specs/improvement-reset.spec.md`
2. `.cursor/skills/improvement-reset/SKILL.md`
3. Coordenar: `upgrade-tree`, `skills-progression`, `heroes-party`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `FeatureKey` `improvement_reset` levels 1–2 + flags DTO
- Nós `improvement_reset_1` / `_2` no catálogo + layout
- Domínio unitário + massa (`ImprovementResetService`)
- Use cases + SW
- UI (−) + botão massa + toasts

## Checklist

- [x] Spec critérios/testes marcados conforme entrega
- [x] Nó I: 5000, Forja + herói 12+
- [x] Nó II: 10000, após I + herói 22+
- [x] Unitário: bloqueios skill equipada / attr / skill_rank
- [x] Massa: zera skills improvement + limpa slots; attrs até piso ascensão/itens
- [x] Toasts parciais (ascensão / desequipar item)
- [x] Sem refund de ascensão
