# Spec — Heróis e Party

## Status

**Aceite:** 12/12 (100%)  
**Testes obrigatórios:** 15/15 presentes na suite

## Objetivo

O jogador gerencia **equipe ativa** (até 3 slots) e **reserva**, desbloqueia classes (Galneon, Elara, Berserker, Arqueira Rain, Paladino) e edita formação apenas na pausa de loadout. New game: **só Nix** na party até comprar unlocks na árvore.

## Critérios de aceite

- [x] Party editável só quando `canEditParty` (pausa loadout / acampamento)
- [x] Botões Heróis e Formação do footer só visíveis no acampamento (`canEditParty`)
- [x] Drag-and-drop: reserva ↔ equipe, reordenar slots
- [x] Unlock de herói via melhoria (`hero_unlock_*`) adiciona à reserva; gates `main_mission_completed`
- [x] Cadeia da árvore: Galneon (`1-1`) → Elara (`1-5`) → Berserker (`1-15`) → Arqueira Rain (`1-25`) → Paladino (`1-40`)
- [x] New game: roster/party ativa só com Nix (`sorcerer`)
- [x] Rain recebe **Arco de Kontempler** exclusivo ao desbloquear
- [x] XP de batalha para party ativa; bench segue `BenchXpPolicy`
- [x] Detalhe do herói: modal com abas Loadout / Status / Skills / Classe
- [x] Aba Status lista skills de batalha equipadas (efeitos + DPS estimado) e bônus/únicos do equipamento
- [x] Aba Inventário do herói **sem** hint estático de equipamento; slots clicáveis e picker inline comunicam a ação
- [x] Aba Inventário: **sem** abas texto Todos/Armas/Armaduras/Acessórios; categoria só via ícones do loadout; grid único com ordenação compartilhada; slot ativo filtra o mesmo grid in-place
- [x] Header do modal exibe level destacado + título atual (ex.: `Lv.25` + `Arquimaga`); aba Classe **sem** retrato/classe atual — só próxima(s) ascensão(ões) e skills de evolução
- [x] Aba Classe apresenta título compacto **Escolha seu destino** + cards temáticos; detalhes do momento de ascensão ficam no tooltip do título; requisitos e CTA dos cards ficam no tooltip do card
- [x] Ícones padronizados de estatística (`StatIconCatalog`, assets em `ui/stats/*`): chips STR/DEX/INT, linhas da ficha de combate (rows + título do tooltip) e linhas de bônus de gear em cards/tooltips; tingidos por tema via `--stat-icon-filter`

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `src/domain/party/*`, `src/domain/entities/Hero.ts`, `HeroUnlockService` |
| Application | `AddToPartyUseCase`, `RemoveFromPartyUseCase`, `MovePartyMemberUseCase`, `SetPartySlotUseCase` |
| Presentation | `HeroesPanelPresentation`, `PartyDragDrop*`, `hero-detail/*`, `GameViewController` |

## Invariantes

- `PartyValidator` é autoridade para composição válida
- Mínimo 1 herói na party em combate
- Estado imutável: `GameState.with*` / `Hero` props

## Fora de escopo

- Sinergia automática de composição
- Substituto automático ao cair em combate
- Reset de atributos alocados (ver [`improvement-reset.spec.md`](improvement-reset.spec.md))

## Relacionado

- [`improvement-reset.spec.md`](improvement-reset.spec.md) — (−) de atributo (level ≥1) e reset em massa (level ≥2) no detalhe do herói

## Testes obrigatórios

- [x] `PartyService.test.ts`, `PartyEditPolicy.test.ts`, `PartyValidator.test.ts`
- [x] `HeroUnlockService.test.ts`, `PartyDragDropPresentation.test.ts`
- [x] `HeroDetailModalRenderer.test.ts` — aba Inventário sem parágrafo “Toque em um slot de equipamento…”; slot ativo destacado no loadout
- [x] `InventoryModalRenderer.test.ts` — embedded sem filtros texto de categoria; modo slot ativo filtra grid in-place
- [x] `HeroDetailHeaderRenderer.test.ts` — level destacado + título atual no topo
- [x] `HeroClassTabRenderer.test.ts` — aba Classe sem retrato/classe atual; só ascensões disponíveis
- [x] `HeroClassLinePresentation.test.ts` — formatação da linha level + título atual
- [x] `HeroClassAscensionPresentation.test.ts` — cards com requisitos/CTA só no tooltip; seleção por clique quando disponível
- [x] `AscendClassConfirmPresentation.test.ts` — modal de confirmação com preview e aviso permanente
- [x] `HeroAttributesTabRenderer.test.ts` / `HeroStatusSkillsPresentation.test.ts` — Status com skills + equipamento
- [x] `SkillBattleStatsMapper.test.ts` — DPS estimado por skill
- [x] `StatIconCatalog.test.ts` — mapeamento estatística → ícone cobre toda a ficha de combate
