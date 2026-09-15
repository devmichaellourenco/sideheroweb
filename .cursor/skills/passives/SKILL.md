---
name: passives
description: Passivas sempre ativas do Side Hero — classe, ascensão cumulativa, gear e inimigos. Use para passive, passiva, Saúde de Titã, Afinidade Mágica, Elo com a Vida, PassiveCatalog ou PassiveResolver.
---

# Passivas (traits sempre ativos)

## Spec

`specs/passives.spec.md`

## Antes de implementar

Decisões da spec estão **fechadas** (ver `specs/passives.spec.md`). Implementar conforme fases A–E.

## Fluxo

1. Definição → `domain/passives/PassiveCatalog.ts` + `PassiveId` / effects tipados
2. Agregação → `PassiveResolver` (classe + walk `prerequisiteAscensionId` + gear + enemy)
3. Aplicação → hooks em `Hero` / `SkillPowerCalculator` / (inimigo) balance
4. DTO → `activePassives` no `HeroDto` + tooltip gear
5. UI → Status (lista) + Classe (preview) + GearPresentation

## Não confundir

| Sistema | Quando |
|---------|--------|
| **Passivas (esta skill)** | Sempre ativas; cumulativas; classe/ascensão/gear/inimigo |
| **Efeito único** | `unique-effects` — handlers especiais (heal_block, cleanse) |

Skills só-passivas equipáveis **não existem** no `SkillCatalog` (não ocupam slot).

## Conteúdo v1 (classes)

| Id sugerido | Nome | Herói | Efeito |
|-------------|------|-------|--------|
| `titan_health` | Saúde de Titã | Galneon (`knight`) | +1% max HP / ponto de `defense` |
| `magic_affinity` | Afinidade Mágica | Nix (`sorcerer`) | +1% dano de skill / nível |
| `life_bond` | Elo com a Vida | Elara (`priest`) | +1% poder de suporte aliado / INT |

## Padrões

- Catalog declarativo + handler tipado (espelhar espírito de `UniqueEffectCatalog`, não copiar on-hit)
- Ascensão: **não** apagar passiva anterior; somar cadeia
- `presentation` só DTO — nunca entity
- Coeficientes novos → anotar em `game-balance.spec.md` / BAL

## Testes

Listados em `specs/passives.spec.md` — criar/atualizar; **não** executar `npm test` automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`
