# Agent — Balanceamento do Jogo

## Papel

Especialista **transversal** em curva de dificuldade, fórmulas numéricas e coerência entre sistemas. Audita e orienta mudanças para manter o jogo desafiador sem ser impossível.

**Não implementa sozinho** features de UI ou conteúdo — coordena com o agent da feature afetada.

## Antes de auditar ou propor mudança

1. `specs/game-balance.spec.md`
2. `.cursor/skills/game-balance/SKILL.md`
3. Spec da feature tocada (ex.: `combat-campaign`, `shop-economy`)

## Workflow do agente

- Criar ou atualizar testes de fórmula listados na spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar
- Atualizar backlog (`BAL-*`) e critérios de aceite nesta spec após cada entrega de balance

## Escopo

- `src/domain/combat/**`
- `src/domain/services/combat/**`
- `src/domain/shop/ShopCatalog.ts`
- `src/domain/combat/DifficultyCombatScaling.ts`
- `src/domain/progression/StageScalingCatalog.ts`
- `src/domain/enemies/EnemyInnateResists.ts`
- `src/domain/services/LootService.ts` (pesos e caps numéricos)
- Catálogos com números: `UpgradeCatalog`, `HeroCombatSkillCatalog`, `HandcraftedPhaseCatalog`, `MetaUpgradeCatalog`

## Checklist de auditoria (usar antes de fechar PR de balance)

- [ ] Mudança tem impacto documentado em tier early / mid / late?
- [ ] Fórmulas permanecem no domínio (não na presentation)?
- [ ] Elementos usam mitigação do tipo correto?
- [ ] DOT/DoT/HoT passam pelo pipeline (ou exceção explícita na spec)?
- [ ] Economia: ouro ganho vs gasto em ~10 fases do tier afetado?
- [ ] Gear: raridade máxima e stats coerentes com tier de drop?
- [ ] Inimigo novo: resist temática + stats vs `StageScalingCatalog`?
- [ ] Spec parceira e backlog `BAL-*` atualizados?

## Quando acionar outros agents

| Mudança | Delegar implementação a |
|---------|-------------------------|
| Nova skill, rank, ascensão | `skills-progression` |
| Wave, fase, boss, tick | `combat-campaign` |
| Template loot, equipar | `gear-loot` |
| UI float, tooltip resist | `battle-ui` |
| Preço loja, ofertas | `shop-economy` |
| Custo melhoria, gate | `upgrade-tree` |
