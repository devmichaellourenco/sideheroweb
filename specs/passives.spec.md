# Spec — Passivas (classe, ascensão, gear e inimigos)

## Status

**Aceite:** 10/14 (71%) · implementação Fase A–B 2026-07-26  
**Testes obrigatórios:** 8/8 presentes (criar/atualizar — execução manual)  
**Fase ativa:** A–B entregues (fundação + classes + 18 ascensões); C gear piloto vazio; D inimigos só campo opcional

## Objetivo

Heróis e inimigos podem ter **passivas sempre ativas** (traits), **cumulativas**. Fontes: classe base, cadeia de ascensão, gear e roster de inimigos.

**Não confundir** com `unique-effects`. Skills só-passivas equipáveis **não existem** — passivas são sempre ativas via este sistema.

## Vocabulário

| Termo | Significado |
|-------|-------------|
| **Passiva** (`PassiveId`) | Trait sempre ativo, declarativo + handler tipado |
| **Efeito único** | Comportamento especial de item (`unique-effects`) |

## Critérios de aceite

### Infraestrutura

- [x] `PassiveId` + `PassiveCatalog` (nome, descrição, fonte, stacking, efeitos tipados)
- [x] `PassiveResolver` agrega passivas ativas de um herói
- [x] Fontes: `heroClass` base, cadeia de `ascensionId` (pré-requisitos), gear equipado (`passiveIds`), `EnemyRosterEntry.passiveIds?`
- [x] Hooks em fórmulas: max HP / defense / attack / skill damage / heal+buff aliado
- [x] DTO: lista de passivas ativas no herói (`HeroDto.activePassives`)
- [x] UI: seção **Passivas** na aba Status

### Conteúdo v1 — classes iniciais

- [x] **Saúde de Titã** (Galneon / `knight`): +1% vida máx. por ponto de `defense` total
- [x] **Afinidade Mágica** (Nix / `sorcerer`): +1% dano skills da árvore por nível (exclui básico)
- [x] **Elo com a Vida** (Elara / `priest`): +1% curas e buffs de aliado por INT
- [x] **Sede de Sangue** (Berserker): +1% dano skills da árvore por FOR
- [x] **Olhar de Kontempler** (Arqueira / Rain): +1% dano skills da árvore por DEX
- [x] **Égide Sagrada** (Paladino): +1,5% vida máx. por nível

### Ascensão

- [x] Ao ascender, passiva(s) anteriores permanecem; nova do degrau entra
- [x] Cadeia = classe base + walk de `prerequisiteAscensionId`
- [x] Passiva definida para os 18 degraus (`ASCENSION_PASSIVE_IDS`)

### Gear

- [x] `GearTemplateDefinition.passiveIds?` (mapa piloto vazio — pronto para itens)
- [ ] Tooltip do item lista passivas concedidas (quando houver item piloto)

### Inimigos

- [x] `EnemyRosterEntry.passiveIds?`
- [ ] Resolver aplica passivas de inimigo no poder/mitigação
- [ ] Tooltip inimigo exibe passivas


## Decisões fechadas (2026-07-26)

1. **Saúde de Titã:** `defense` **total** (inclui gear, nível e atributos).
2. **Afinidade Mágica:** só skills da **árvore** (`kind: 'damage'`, exclui `basic_attack`).
3. **Elo com a Vida:** curas **e** buffs de aliado (`heal_ally` + `buff_attack`).
4. **Ascensão v1:** definir e aplicar passiva em **todos** os degraus dos 6 caminhos (ajustável depois).
5. **Berserker / Paladin:** passam a ter passiva base na v1.
6. **Mesma `PassiveId` de fontes distintas:** permitida; coeficientes **somam** (`stacking: 'additive'`).

## Decisões abertas (bloquear implementação até responder)

_(nenhuma — implementação liberada)_

## Princípio de design

| Abordagem | Quando usar |
|-----------|-------------|
| **Passiva declarativa** + handler tipado | Scaling contínuo (%, por nível, por atributo) |
| **Efeito único** (`unique-effects`) | Comportamento exclusivo (heal_block, cleanse 1×) |

**Não** misturar passivas cumulativas de classe com unique effects.  
**Não** exigir slot para passivas desta spec (skills só-passivas equipáveis foram removidas).

## Modelo de domínio (proposta)

```
PassiveDefinition {
  id: PassiveId
  name: string
  description: string          // texto com placeholders opcionais
  iconPath?: string
  stacking: 'additive' | 'unique'
  effect: PassiveEffect           // união discriminada tipada
}

PassiveEffect =
  | { kind: 'max_health_per_defense'; percentPerPoint: number }
  | { kind: 'skill_damage_per_hero_level'; percentPerLevel: number }
  | { kind: 'ally_support_power_per_int'; percentPerPoint: number }
  | …extensível

PassiveSource =
  | { type: 'hero_class'; heroClass }
  | { type: 'ascension'; ascensionId }
  | { type: 'gear'; templateId }
  | { type: 'enemy'; enemyType }
```

`PassiveResolver.resolveForHero(hero)` → `ActivePassive[]` (defs + valor efetivo computado para UI).  
`PassiveModifierService` aplica nos hooks de combate (immutável / puro).

## Hooks de combate (integração)

| Hook | Arquivo atual | Passivas v1 |
|------|---------------|-------------|
| `Hero.maxHealth` | `Hero.ts` | Saúde de Titã |
| Poder ofensivo de skill | `SkillPowerCalculator.ts` | Afinidade Mágica |
| Poder de heal / support | `SkillPowerCalculator` / `CombatActionExecutor` | Elo com a Vida |
| Defesa / DR (futuro) | `HeroDefensiveStatsProvider.ts` | Ascensão / gear |
| Inimigo | `EnemyCombatBalance` / skill power | `passiveIds` no roster |

## UI / UX

| Superfície | Comportamento |
|------------|---------------|
| Aba **Status** do herói | Lista de passivas ativas (nome + descrição com valor atual, ex. “+24% vida”) |
| Aba **Classe** | Preview da próxima passiva de ascensão no card/tooltip |
| Tooltip de **gear** | Linha “✧ Passiva: …” por id |
| Battle strip / tooltip inimigo | Fase 2 — ícone ou texto curto se boss tiver passiva |
| Combat stat sheet | Linhas que citam contribuição de passiva (como passives equipadas hoje) |

Visual: reutilizar poço `--icon-well*` e tipografia medieval; sem cards desnecessários — lista compacta.

## Plano de implementação (fases)

### Fase A — Fundação (sem conteúdo completo de ascensão)

1. Spec/agent/skill/rule (este pacote) ✔
2. `domain/passives/*`: Catalog, types, Resolver, Modifier hooks
3. Ligar 3 passivas base knight/sorcerer/priest
4. DTO + UI Status
5. Testes de catálogo + resolver + 3 fórmulas

### Fase B — Ascensão cumulativa

1. `passiveId` (ou lista) em `ClassAscension`
2. Walk da cadeia de pré-requisitos
3. UI na aba Classe (passiva ganha / próxima)
4. Placeholders balanceados por degrau **ou** conteúdo aprovado em GDD

### Fase C — Gear

1. Campo `passiveIds` em templates + mapper tooltip
2. 1–2 itens piloto (pode reusar lendário existente ou novo)
3. Testes de stacking gear + classe

### Fase D — Inimigos

1. `passiveIds` no roster
2. Aplicação em poder/mitigação
3. UI tooltip inimigo (opcional na mesma PR)

### Fase E — Conteúdo & balance

1. Passivas de todos os degraus de ascensão
2. Berserker/Paladin
3. Auditoria `game-balance` (BAL-passives)

## Camadas e arquivos-chave (alvo)

| Camada | Paths |
|--------|-------|
| Domain | `src/domain/passives/*`, `ClassAscensionCatalog`, `GearTemplateCatalog`, `EnemyRosterCatalog`, `Hero.ts`, `SkillPowerCalculator.ts` |
| Application | `HeroDtoMapper`, DTOs `ActivePassiveDto`, mappers de tooltip |
| Presentation | `HeroStatus*`, `HeroClassAscensionPresentation`, `GearPresentation`, CSS status |
| Specs cruzadas | `skills-progression`, `unique-effects`, `gear-loot`, `heroes-party`, `game-balance` |

## Invariantes

- `domain/` não importa presentation/application
- Presentation só via DTO
- Passivas de classe/ascensão **não** gastam slot de skill
- Ascensão **não remove** passivas anteriores do caminho
- Unique effects continuam no pipeline próprio
- Skills passivas equipáveis **não** são migradas nesta feature (a menos que decisão explícita)

## Fora de escopo (v1)

- DSL genérica JSON de efeitos
- Passivas ativadas por chance/proc (usar unique-effect ou status)
- Remoção de passiva por respec (ascensão é permanente)
- UI completa de inimigos se lógica já estiver coberta por testes

## Testes obrigatórios (a criar)

- [x] `PassiveCatalog.test.ts`
- [x] `PassiveResolver.test.ts` — classe + cadeia de ascensão
- [x] `PassiveModifiers.test.ts` — Saúde de Titã / Afinidade / Elo
- [x] `HeroStatusSkillsPresentation.test.ts` — seção Passivas
- [x] `HeroCombatStatSheetMapper.test.ts` — tooltip de vida com contribuição de passiva
- [ ] Gear `passiveIds` no tooltip mapper (quando houver item piloto)
- [ ] Passivas de inimigo (fase D)

## Relacionado

- [`skills-progression.spec.md`](skills-progression.spec.md) — ascensão / skills passivas equipáveis
- [`unique-effects.spec.md`](unique-effects.spec.md) — efeitos únicos de item (não scaling)
- [`gear-loot.spec.md`](gear-loot.spec.md) — templates
- [`heroes-party.spec.md`](heroes-party.spec.md) — classes base
- [`game-balance.spec.md`](game-balance.spec.md) — auditoria numérica
- [`combat-campaign.spec.md`](combat-campaign.spec.md) — executor / skill power
