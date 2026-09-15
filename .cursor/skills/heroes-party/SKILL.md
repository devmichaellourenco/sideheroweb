---
name: heroes-party
description: Gerencia heróis, party ativa, reserva, unlock e formação no Side Hero. Use para party, reserva, bench, formação, hero unlock, berserker, arqueira, Rain, paladino ou abas do herói.
---

# Heróis e Party

## Spec

`specs/heroes-party.spec.md`

## Fluxo

1. Regra de roster → `PartyService` + `PartyValidator`
2. Unlock → `HeroUnlockService` + entrada em `UpgradeCatalog` (gates `main_mission_completed`)
3. UI → `hero-detail/*`, `PartyDragDropBinder`

## Padrões

- New game: **só Nix** ativa; cadeia Galneon → Elara → Torius → Rain → Valerius
- Edição só com pausa loadout (`PauseForLoadoutUseCase`)
- Herói imutável: `Hero` com `toProps()` / métodos que retornam novo `Hero`
- Modal de herói via pilha de modais (`GameViewController`)
- Aba Status: chips STR/DEX/INT + ficha de combate + skills de batalha (`activeSkills`/`battleStats`) + equipamento/únicos
- Aba Inventário: sem hint de texto nos slots; equipar via clique no slot + picker inline
- Header do modal: level destacado (`Lv.{n}`) + título atual via `HeroClassLinePresentation` / `getHeroEvolutionLabel`
- Aba Classe: título compacto + tooltip (`HeroAscensionMomentTooltipBinder`) + cards temáticos (`HeroClassAscensionPresentation`)
- Reset de atributos (− e massa): `specs/improvement-reset.spec.md` + skill `improvement-reset`

## Testes

`PartyService.test.ts`, `PartyDragDropPresentation.test.ts`, `HeroUnlockService.test.ts`, `HeroDetailModalRenderer.test.ts` — criar ou atualizar; não executar automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
