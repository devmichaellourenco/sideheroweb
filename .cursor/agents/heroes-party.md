# Agent — Heróis e Party

## Papel

Formação, reserva, unlock de classes e edição de party na pausa.

## Antes de codar

1. `specs/heroes-party.spec.md`
2. `.cursor/skills/heroes-party/SKILL.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `src/domain/party/**`
- `src/domain/entities/Hero.ts`
- `src/presentation/components/hero-detail/**`
- Party use cases

## Checklist

- [ ] `canEditParty` respeitado na UI e no servidor
- [ ] `PartyValidator` para toda mudança de roster
- [ ] Testes `PartyService`, `PartyDragDropPresentation`
