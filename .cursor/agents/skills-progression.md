# Agent — Skills e Progressão

## Papel

Árvores de skill, ranks, slots de batalha e ascensão de classe.

## Antes de codar

1. `specs/skills-progression.spec.md`
2. `.cursor/skills/skills-progression/SKILL.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `src/domain/progression/**`
- Skill/ascension use cases
- `SkillCardPresentation`, `HeroSkillsTabRenderer`, `HeroDetailModalRenderer`, `HeroDetailScrollPresentation`

## Checklist

- [ ] Allocate no `SkillService`, gate no use case
- [ ] Catálogo em `SkillCatalog` / `HeroCombatSkillCatalog`
- [ ] Testes allocate + ascension + `SkillBattleSlots`
- [ ] Mudança na lista de skills: preservar scroll ao `+` rank
