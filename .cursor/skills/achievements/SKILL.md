---
name: achievements
description: Achievements persistentes do Side Hero — catálogo, progresso por eventos, unlock e Wow. Use para achievement, conquista, Hero Out of the Side ou AchievementService.
---

# Achievements

## Spec

`specs/achievements.spec.md`

## Fluxo

1. Definição → `AchievementCatalog`
2. Evento de jogo → `AchievementService.record…`
3. Persistência → `IAchievementProgressRepository` (`side_hero_achievements`)
4. Updates → Tick result → Wow (`achievement_progress` / `achievement_unlocked`)
5. Lista → `GET_ACHIEVEMENTS` → modal `AchievementsModalRenderer`

## Padrões

- Progresso **não** vive no `GameState` (sobrevive Novo Jogo)
- Catálogo declarativo; service só avança entradas elegíveis ao evento
- Completos não re-incrementam nem re-disparram Wow
- Presentation só vê DTOs (`AchievementUpdateDto` / `AchievementListEntryDto`)
- Botão do menu: ícone `ui/book-open.png` (`icon_itemicon_book_open`)

## Achievement v1+

| ID | Título | Condição |
|----|--------|----------|
| `hero_out_of_the_side` | Hero - Out of the Side | Clear stage `1-1` first time |
| `stendra_guardian` | Guardião de Stendra | Clear `1-50` |
| `gruftall_ember` | Centelha de Gruftall | Clear `2-50` |
| `valdris_shadow` | Sombra de Valdris | Clear `3-50` |
| `morthaven_finale` | Queda de Morthaven | Clear `4-50` |

## Testes

`AchievementService.test.ts`, `AchievementCatalog.test.ts`, momentos em `RewardMomentDetector.test.ts`, `AchievementsModalRenderer.test.ts` — criar/atualizar; **não** executar automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
