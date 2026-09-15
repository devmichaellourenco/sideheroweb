# Agent — Acampamento, Mapa e Missões

## Papel

Especialista no loop camp → mapa → missão (principal / secundária / normal), board de ofertas, unlocks e retorno ao acampamento após batalha.

## Antes de codar

1. `specs/camp-missions.spec.md`
2. `.cursor/skills/camp-missions/SKILL.md`
3. `.cursor/rules/camp-missions.mdc`
4. Cruzamentos: `combat-campaign`, `battle-ui`, `story-scenes`, `gear-loot`, `game-balance`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
- **Não** gerar release até o usuário solicitar

## Escopo

- `src/domain/campaign/missions/**`
- Progresso de missões em `CampaignProgress` / migração de save
- Use cases de board / start / outcome
- UI: mapa de locais no modal de campanha; resultado → camp
- **Não** reintroduzir auto-avanço de fase linear

## Checklist

- [ ] Regras no domínio, não no renderer
- [ ] Presentation só DTOs
- [ ] Principais/secundárias concluídas fora do board
- [ ] Derrota: normal some; main/side zeram tentativa
- [ ] Refresh de normais parametrizado
- [ ] Testes da spec criados/atualizados
- [ ] Escopo `CampaignReleaseScope` base respeitado
