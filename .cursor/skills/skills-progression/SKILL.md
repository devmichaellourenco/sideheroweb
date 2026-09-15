---
name: skills-progression
description: Skills, ranks, slots de batalha e ascensão de classe no Side Hero. Use para skill tree, allocate, ascension, skill slot, cooldown ou SkillService.
---

# Skills e Progressão

## Spec

`specs/skills-progression.spec.md`

## Fluxo

1. Nova skill → `SkillCatalog` + `HeroCombatSkillCatalog` (combate)
2. Lógica → `SkillService`, `ClassAscensionService`
3. UI → `SkillCardPresentation`, `HeroSkillsTabRenderer`
4. Mensagens → `GET_HERO_SKILL_TREE`, `SPEND_IMPROVEMENT_POINT`

## Padrões

- Poder de combate (herói): `Base × (powerPerRank × nível) × (atributo × fator)` — sem multiplicador global; níveis começam com `powerPerRank` no rank 1; skills com CD têm `powerPerRank` 3× o legado no catálogo (BAL-015)
- Calibração no Balance Lab: aba **Personagens** (`hero-combat-overrides.json`) — skills, identidade, passivas e evoluções (`pointsGranted`/requisitos); não editar números só na UI do jogo
- Recarga: `cooldownTurns × skillCooldownTurnSeconds` do herói − `cooldownSecondsPerRank` da skill — `SkillCooldownTiming.ts`
- Recovery: `actionRecoverySeconds` por skill; CDR teto/piso por skill
- Ataque básico: `ATK × basicAttackDamageRatio` da identidade do herói; TTA = `1/ASPD` por combatente (DEX)
- Slot 0 = Ataque Básico (fixo)
- Slots extras = `getUnlockedBattleSkillSlotCount(upgradeLevels)`
- Investir Aprimoramento em skill de classe/evolução exige ao menos 1 slot extra (`battle_skill_slots >= 1`); só o slot fixo do Ataque Básico mantém `canAllocateRank=false` e o use case bloqueia chamadas diretas
- Scroll ao `+1 level`: `pinScrollBeforeMutation` em `HeroDetailModalRenderer` + `HeroDetailScrollPresentation`
- Aba Skills: carregar `GET_HERO_SKILL_TREE` **e** `GET_HERO_ASCENSION_TREE` (skills de evolução vivem aqui)
- Aba Skills: sem hints de texto; slots interativos + highlight no tap-to-assign; tooltip no ícone (detalhes) e nos círculos (ganho do level)
- Lista de skills: linha com nome, ícone à esquerda e círculos de level à direita; equipada = fundo verde; próximo level = círculo tracejado clicável; hover em **qualquer** círculo mostra o ganho daquele ponto (mesmo futuro/bloqueado)
- Passivas **sempre ativas** de classe/ascensão/gear: ver skill `passives` / `specs/passives.spec.md` (não ocupam slot; skills só-passivas não existem no catálogo)
- Cards de ascensão: requisitos/CTA no tooltip; clique no card disponível abre confirmação; `+N Aprim.` (não pool separado)
- Ascensão libera skills/passivas do caminho e concede Aprimoramento (`pointsGranted`); skills `pointType: 'ascension'` gastam o mesmo saldo até rank 3
- Aba Classe: sem retrato/classe atual (vai no header); banner + cards temáticos (`HeroClassAscensionPresentation`) — sem lista de skills
- Testes: `HeroDetailFlow.test.ts` — aba Skills dispara load de ascensão
- Reset de pontos (− e massa; skills improvement **e** evolução → mesmo pool): `specs/improvement-reset.spec.md` + skill `improvement-reset`

## Testes

`SkillService.allocate.test.ts`, `SkillService.ascension.test.ts`, `SkillBattleSlots.test.ts`, `HeroDetailScrollPresentation.test.ts`, `SkillRankPreviewMapper.test.ts`, `HeroSkillsTabRenderer.test.ts` — criar ou atualizar; não executar automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`; fonte de verdade = specs, agents, skills, rules e testes
