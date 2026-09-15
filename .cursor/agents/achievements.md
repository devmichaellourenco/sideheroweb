# Agent — Achievements

## Papel

Conquistas persistentes: catálogo, progresso por eventos, Wow de avanço/unlock.

## Antes de codar

1. `specs/achievements.spec.md`
2. `.cursor/skills/achievements/SKILL.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `src/domain/achievements/**`
- `IAchievementProgressRepository` / storage `side_hero_achievements`
- Hook em `TickGameUseCase` (fases limpas) e Wow de achievement
- UI: botão + `GET_ACHIEVEMENTS` + `AchievementsModalRenderer`

## Checklist

- [x] Catálogo + service imutável
- [x] Persistência fora do game state
- [x] `AchievementService.test.ts` / catalog / Wow
- [x] Sem re-unlock de achievement completo
- [x] Botão + modal de lista
