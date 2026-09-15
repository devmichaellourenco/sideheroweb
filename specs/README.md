# Spec-Driven Development — Side Hero

Este diretório é a **fonte de verdade** para features do jogo. Todo trabalho novo começa pela spec; implementação e testes devem rastrear critérios de aceite aqui.

## Painel de status (auditoria 2026-08-11)

| Feature | Aceite | Testes spec | Pendências |
|---------|--------|-------------|------------|
| [camp-missions](camp-missions.spec.md) | 22/22 | 11/11 | — |
| [combat-campaign](combat-campaign.spec.md) | 20/20 | 12/12 | — |
| [heroes-party](heroes-party.spec.md) | 9/9 | 10/10 | — |
| [skills-progression](skills-progression.spec.md) | 9/9 | 10/10 | — |
| [gear-loot](gear-loot.spec.md) | 8/8 | 8/8 | — |
| [unique-effects](unique-effects.spec.md) | 8/8 | 5/5 | — |
| [stash-forge](stash-forge.spec.md) | 8/8 | 7/7 | — |
| [shop-economy](shop-economy.spec.md) | 10/10 | 3/3 | — |
| [upgrade-tree](upgrade-tree.spec.md) | 9/9 | 8/8 | — |
| [meta-legacy](meta-legacy.spec.md) | 6/6 | 1/1 | — |
| [battle-ui](battle-ui.spec.md) | 26/26 | 19/19 | — |
| [art-scenes](art-scenes.spec.md) | 5/10 | 2/2 | strip layout / fallback / DLC |
| [web-infra](web-infra.spec.md) | 8/8 | 3/3 | Única plataforma: HTML5 itch.io |
| [game-balance](game-balance.spec.md) | 11/11 | 12/12 | — |
| [story-scenes](story-scenes.spec.md) | 9/10 | 5/5 | copy DLC placeholder |
| [achievements](achievements.spec.md) | 7/7 | 4/4 | — |
| [improvement-reset](improvement-reset.spec.md) | 16/16 | 12/12 | Unitário + massa entregues |
| [stage-progress-bar](stage-progress-bar.spec.md) | 14/14 | 5/5 | Timeline entre localização e batalha |
| [medieval-theme](medieval-theme.spec.md) | 9/9 | 1/1 | Paleta medieval (tutorial) |
| [ui-theme](ui-theme.spec.md) | 7/7 | 2/2 | Claro/escuro (batalha isolada) |
| [passives](passives.spec.md) | 10/14 | 4/8 | Fase A–B; gear/inimigo pendentes |
| [game-audio](game-audio.spec.md) | 7/8 | 2/2 | SFX pendentes |

**Total aceite (features):** ~227/243 · *passives / art-scenes / story-scenes / game-audio com pendências*  
**Balanceamento transversal:** 11/11  
**Total testes listados nas specs:** ver specs individuais

## Documentação de produto

- [Game Design Document](game-design-document.spec.md) — 8/8 critérios editoriais; GDD completo + pitch e roteiro audiovisual

## Escopo do jogo (v1)

Campanha jogável até **Morthaven** (`4-50`, tier 200). Regiões 5–10 (DLC) permanecem no código mas ocultas — ver [`combat-campaign.spec.md`](combat-campaign.spec.md) (seção Escopo do jogo base).

**Próxima feature sugerida**

**Passivas** — [`passives.spec.md`](passives.spec.md). Polish de arte: layout strip / fallback — [`art-scenes.spec.md`](art-scenes.spec.md).

Secundário: calibração Balance Lab (aba Missões) — [`game-balance.spec.md`](game-balance.spec.md).

## Regras de workflow do agente

1. **Fonte de verdade** — specs, agents, skills, rules e testes. Não criar pasta/`step-by-step/` nem diários de alteração do agente.
2. **Não rodar testes automaticamente** — não execute `npm test` nem suites individuais a menos que o usuário peça explicitamente. Crie ou atualize arquivos de teste; a execução é manual pelo desenvolvedor.
3. **Release só sob pedido** — não execute `npm run release`, não gere zip em `releases/` e não faça bump de versão até o usuário solicitar.

## Fluxo SDD

```
1. Ler spec da feature (specs/<feature>.spec.md)
2. Atualizar spec se o escopo mudar (antes de codar)
3. Implementar nas camadas corretas (domain → application → presentation)
4. Criar ou atualizar testes listados na spec (não executar npm test)
5. Marcar [x] nos critérios entregues
```

## Mapa de features

| Spec | Domínio | Agent | Skill |
|------|---------|-------|-------|
| [camp-missions](camp-missions.spec.md) | Acampamento, board, missões main/side/normal | `.cursor/agents/camp-missions.md` | `.cursor/skills/camp-missions/` |
| [combat-campaign](combat-campaign.spec.md) | Combate, waves, campanha, tick | `.cursor/agents/combat-campaign.md` | `.cursor/skills/combat-campaign/` |
| [heroes-party](heroes-party.spec.md) | Heróis, party, reserva, unlock | `.cursor/agents/heroes-party.md` | `.cursor/skills/heroes-party/` |
| [skills-progression](skills-progression.spec.md) | Skills, ascensão, pontos | `.cursor/agents/skills-progression.md` | `.cursor/skills/skills-progression/` |
| [gear-loot](gear-loot.spec.md) | Gear, inventário, baús, loot | `.cursor/agents/gear-loot.md` | `.cursor/skills/gear-loot/` |
| [unique-effects](unique-effects.spec.md) | Efeitos únicos de gear/skills | `.cursor/agents/gear-loot.md` | `.cursor/skills/gear-loot/` + `combat-campaign/` |
| [stash-forge](stash-forge.spec.md) | Baú de itens, Forja Divina | `.cursor/agents/stash-forge.md` | `.cursor/skills/stash-forge/` |
| [shop-economy](shop-economy.spec.md) | Loja, ouro, renovar | `.cursor/agents/shop-economy.md` | `.cursor/skills/shop-economy/` |
| [upgrade-tree](upgrade-tree.spec.md) | Árvore de melhorias | `.cursor/agents/upgrade-tree.md` | `.cursor/skills/upgrade-tree/` |
| [meta-legacy](meta-legacy.spec.md) | Meta entre temporadas — **fora do produto canônico** (campanha finita) | `.cursor/agents/meta-legacy.md` | `.cursor/skills/meta-legacy/` |
| [battle-ui](battle-ui.spec.md) | Battle strip, modais, Wow, UX | `.cursor/agents/battle-ui.md` | `.cursor/skills/battle-ui/` |
| [art-scenes](art-scenes.spec.md) | Cenários de batalha e banners por região | — | `.cursor/skills/battle-ui/` |
| [web-infra](web-infra.spec.md) | HTML5 itch.io, dist/, localStorage | `.cursor/agents/web-infra.md` | `.cursor/skills/web-infra/` |
| [game-balance](game-balance.spec.md) | Curva, fórmulas, auditoria transversal | `.cursor/agents/game-balance.md` | `.cursor/skills/game-balance/` |
| [story-scenes](story-scenes.spec.md) | Cenas narrativas por ato, overlay com pausa | `.cursor/agents/story-scenes.md` | `.cursor/skills/story-scenes/` |
| [achievements](achievements.spec.md) | Conquistas persistentes, progresso por evento, Wow | `.cursor/agents/achievements.md` | `.cursor/skills/achievements/` |
| [improvement-reset](improvement-reset.spec.md) | Reset unitário + em massa (Runas; Status/Skills) | `.cursor/agents/improvement-reset.md` | `.cursor/skills/improvement-reset/` |
| [stage-progress-bar](stage-progress-bar.spec.md) | Timeline de waves da fase (Idle RPG) | `.cursor/agents/stage-progress-bar.md` | `.cursor/skills/stage-progress-bar/` |
| [medieval-theme](medieval-theme.spec.md) | Paleta medieval do painel (tutorial) | `.cursor/agents/medieval-theme.md` | `.cursor/skills/medieval-theme/` |
| [ui-theme](ui-theme.spec.md) | Tema claro/escuro do painel (preferência) | `.cursor/agents/medieval-theme.md` | `.cursor/skills/medieval-theme/` |
| [passives](passives.spec.md) | Passivas sempre ativas (classe, ascensão, gear, inimigos) | `.cursor/agents/passives.md` | `.cursor/skills/passives/` |
| [game-audio](game-audio.spec.md) | Música de fundo e SFX | — | `.cursor/skills/game-audio/` |
| [game-design-document](game-design-document.spec.md) | Visão do produto, GDD, pitch e apresentação | `.cursor/agents/game-design-document.md` | `.cursor/skills/game-design-document/` |

## Arquitetura global

```
domain/       → regras puras, sem browser/UI
application/  → use cases, DTOs, mappers
infrastructure/ → localStorage, messaging in-process, DI
presentation/ → página HTML5, renderers, controllers
```

Regra: `presentation` não importa `domain` diretamente — use DTOs e flags em `GameStateDto`.

## Balanceamento transversal

Mudanças numéricas ou de curva devem consultar [`game-balance.spec.md`](game-balance.spec.md) em conjunto com a spec da feature. Ver backlog `BAL-*`.
