---
name: improvement-reset
description: Reset/refund de pontos de aprimoramento (unitário e em massa) no Side Hero. Use para respec, devolver pontos, improvement_reset, reset em massa, refund attribute/skill ou botão menos na Status/Skills.
---

# Reset de Pontos de Aprimoramento

## Spec

`specs/improvement-reset.spec.md`

## Fluxo

1. Runas → `improvement_reset_1` (unitário) e `improvement_reset_2` (massa)
2. Flag → `FeatureKey` `improvement_reset` level 1 / 2 → `featureFlags`
3. Domínio → `ImprovementResetService`: refund unitário **ou** massa
4. Application → use cases + SW
5. UI → (−) Status/Skills (level≥1); botão **Reset em massa** (level≥2) + toasts

## Coordenação SDD

```
@.cursor/skills/improvement-reset/SKILL.md
+ @.cursor/skills/upgrade-tree/SKILL.md
+ @.cursor/skills/skills-progression/SKILL.md
+ @.cursor/skills/heroes-party/SKILL.md
```

## Dois níveis

| Level | Nó | Custo | Extra req | Capacidade |
|-------|-----|-------|-----------|------------|
| 1 | `improvement_reset_1` | 5000 | Forja + herói 12+ | (−) ponto a ponto |
| 2 | `improvement_reset_2` | 10000 | pai = `_1` + herói 22+ | (−) + **massa** |

## Reset em massa (resumo)

1. `PREVIEW_MASS_REFUND_IMPROVEMENT_POINTS` → modal com prévia (aprimoramento, evolução, attrs, avisos)
2. Confirmação → zera skills improvement + evolução até o piso da ascensão atual; desequipa as que forem a 0
3. **Não** desfaz a classe (`ascensionId`)
4. Reduz atributos alocados até o máximo seguro (pisos de **ascensão** + **itens equipados**)
5. Toast parcial se sobrar allocated/ranks por ascensão e/ou itens

## Bloqueios unitários

| Ação | Bloquear quando | UX |
|------|-----------------|----|
| − rank → 0 | Skill equipada | Toast desequipar |
| − atributo | Skill/item/ascensão exige mínimo | Toast; ascensão irreversível |
| − rank | Outra skill exige `skill_rank` | Bloquear |
| − rank | Ascensão atual exige esse `skill_rank` | Toast; não desfaz classe |

## Mensagens

- Domínio: `ImprovementResetMessages`
- UI: `ImprovementResetUiCopy` + preview em `ImprovementResetConfirmPresentation`

## Testes

Listados na spec — criar/atualizar; **não** executar `npm test` automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
