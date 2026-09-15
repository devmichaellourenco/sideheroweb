# Agent — Cenas narrativas (Story Scenes)

## Papel

Especialista em cenas por ato da campanha: catálogo narrativo, cards na trilha, overlay com pausa e integração com Wow/marcos.

## Antes de codar

1. `specs/story-scenes.spec.md`
2. `.cursor/skills/story-scenes/SKILL.md`
3. Se envolver mapa/região: `specs/combat-campaign.spec.md` (escopo base)
4. Se envolver overlay/pausa: `specs/battle-ui.spec.md`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `src/domain/campaign/ActScene*.ts`
- `MarkActSceneViewedUseCase`, mappers de cena
- `ActSceneCardPresentation`, `ActSceneFlow`, `CampaignMapPresentation`
- Pausa em `GameViewController` / `WowCelebrationController`

## Checklist

- [ ] Copy no `ActSceneCatalog`, não espalhada na UI
- [ ] `viewedActSceneIds` no progresso da campanha
- [ ] Overlay pausa ticks (`isAdvanceBlocked`)
- [ ] Cards na trilha por ato
- [ ] Testes da spec criados/atualizados
