# Agent — Passivas

## Papel

Passivas sempre ativas (classe, ascensão, gear, inimigos): catálogo, resolver, hooks de combate e UI de listagem.

## Antes de codar

1. `specs/passives.spec.md` — decidir **Decisões abertas** com o usuário se ainda pendentes
2. `.cursor/skills/passives/SKILL.md`
3. Não misturar com `unique-effects`; skills só-passivas equipáveis não existem (passivas = sempre ativas)

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `src/domain/passives/**`
- Hooks: `Hero.ts`, `SkillPowerCalculator.ts`, `HeroDefensiveStatsProvider.ts`
- Catálogos: `ClassAscensionCatalog`, `GearTemplateCatalog`, `EnemyRosterCatalog`
- Application: `HeroDtoMapper`, DTOs de passiva ativa
- Presentation: Status/Classe do herói, tooltips de gear

## Checklist

- [ ] Effect tipado no catálogo (sem DSL JSON)
- [ ] Resolver cumula classe + cadeia de ascensão + gear
- [ ] Testes das 3 passivas iniciais + stacking
- [ ] UI lista valor efetivo (não só texto estático)
- [ ] Cruzar `game-balance` se mudar coeficientes
