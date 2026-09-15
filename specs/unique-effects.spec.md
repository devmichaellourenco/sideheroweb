# Spec — Efeitos únicos (gear e skills)

## Status

**Aceite:** 8/8 (100%)  
**Testes obrigatórios:** 5/5  
**Piloto:** `sword_vorpal_lupnus` — bloqueio de cura em inimigos atingidos

## Objetivo

Itens e skills podem ter **um efeito único** com comportamento de combate **real e programado** — não é affix numérico nem texto decorativo. Cada efeito é um `UniqueEffectId` registrado no domínio com handler próprio.

## Princípio de design

| Abordagem | Quando usar |
|-----------|-------------|
| **Declarativo** (`onHitDot`, buffs com duração) | Padrões repetíveis, mesma lógica para N skills |
| **Efeito único** (`uniqueEffectId` + handler) | Comportamento exclusivo, regras especiais, interações novas |

**Não** usar DSL/JSON genérico (“`on_hit: block_heal`”) sem tipos — cada efeito único é código TypeScript testável.

## Critérios de aceite

### Infraestrutura

- [x] `UniqueEffectId` + `UniqueEffectCatalog` (nome, descrição, ícone/badge de status)
- [x] `GearTemplateDefinition.uniqueEffectId?` + `unique?: true` (só uma cópia no save)
- [x] `CombatSkillDefinition.uniqueEffectId?` — reservado para skills (fase 2 da feature)
- [x] `CombatActionContext.attackerEquipment` no combate de heróis
- [x] `UniqueEffectOnHitResolver` — após acerto em inimigo, dispara handlers do equipamento
- [x] UI: tooltip do item com linha **✦ Efeito único** (via `GearDto`)

### Vorpal Lupnus (piloto)

- [x] Template `sword_vorpal_lupnus` + sprite `gear/items/sword_vorpal_lupnus.png`
- [x] **Aquisição principal:** espólio do **Gonodor** (boss fase **2-50**, mapa Gruftall) — garantido se o jogador ainda não possui
- [x] **Aquisição secundária:** Forja Divina ao fundir **9 épicos** → chance **0,5%** de Vorpal Lupnus lendária (só se ainda não possui)
- [x] **Unicidade:** no máximo **1 cópia** no save (inventário + baú + equipado); forja não rola Vorpal se já possui; salvage bloqueado
- [x] Acerto em inimigo com a arma aplica `heal_block` até o fim da batalha
- [x] Cura em inimigo com `heal_block` é anulada
- [x] Badge na battle strip + tooltip “Cura bloqueada”

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `src/domain/unique-effects/*`, `src/domain/gear/UniqueGearCatalog.ts`, `src/domain/campaign/UniqueGearLootService.ts` |
| Domain | `GearTemplateCatalog.ts`, `CombatActionExecutor.ts`, `CombatStatusEffect*.ts`, `DivineForgeService.ts` |
| Application | `GearDtoMapper.ts` |
| Presentation | `GearPresentation.ts`, `CombatStatusEffectPresentation.ts` |
| Build | `scripts/copy-assets.mjs` |

## Aquisição — Vorpal Lupnus

| Fonte | Regra |
|-------|--------|
| Boss **Gonodor** (fase 2-50) | Drop **garantido** no espólio se `playerOwnsUniqueGear` = false |
| Forja Divina (9× épico → lendário) | Chance `FORGE_VORPAL_LUPNUS_CHANCE` = **0,005** (0,5%) |
| Pool procedural / baús comuns | **Excluído** (`unique: true` fora de `listGearTemplatesForSlot`) |

## Unicidade lendária

- `playerOwnsUniqueGear(state, templateId)` varre inventário, baú e equipamento da roster
- Forja: `shouldRollForgeVorpalLupnus` retorna false se já possui
- Salvage na forja: erro para templates `unique: true`
- Nome exibido sem sufixo `(legendary)` — `formatUniqueGearName`

## Status `heal_block`

- `CombatStatusEffectKind`: `heal_block`
- Não decai em `tickOnTurnEnd`
- Reaplicar no mesmo alvo é idempotente (substitui entrada existente)

## Testes obrigatórios

- [x] `UniqueEffectCatalog.test.ts`
- [x] `UniqueEffectOnHitResolver.test.ts`
- [x] `UniqueGearCatalog.test.ts`
- [x] `UniqueGearLootService.test.ts`
- [x] `CombatActionExecutor.test.ts` — heal_block + cura bloqueada
- [x] `UniqueBattleEffectResolver.test.ts` — cleanse Soler Plégius
- [x] `MitigationPipeline.test.ts` — penetração de resistência de fogo
- [x] `LootService.test.ts` — bônus fixos Ignus Ix
- [x] `CombatStatusEffect.test.ts` — label heal_block
- [x] `DivineForgeService.test.ts` — forja épica + salvage bloqueado

## Inventário de efeitos únicos

| ID | Fonte | Efeito | Status |
|----|-------|--------|--------|
| `vorpal_lupnus_heal_block` | `sword_vorpal_lupnus` | Inimigo atingido não recebe cura na batalha | ✅ |
| `soler_plegius_cleanse` | `soler_plegius` | 1× por batalha: purifica aliado ao receber debuff | ✅ |

## Aquisição — lendários nomeados

| Item | Fonte principal | Forja (9× épico) | Requisitos especiais |
|------|-----------------|------------------|----------------------|
| Vorpal Lupnus | Gonodor (2-50) | 0,5% | — |
| Ignus Ix | Saci (1-50) | 0,5% | Lv. **30**, INT **28** |
| Soler Plégius | Chefe 3-50 | 0,5% | — |
| Selo de Morthaven | Duque (4-50) | 0,5% | Lv. **32**, INT **26** · pen. raio |

- `playerOwnsGearTemplate` impede drop/forja duplicado (inventário + baú + equipado)
- `resolveForgeNamedLegendaryTemplate` — pool cumulativo de chances por template ainda não possuído
- Salvage bloqueado para `unique` e `namedLegendary`

### Ignus Ix (lendário nomeado)

- [x] Template `ignus_ix` + sprite `gear/items/ignus_ix.png`
- [x] +30% dano de fogo (`fireDamageBonus`)
- [x] Ignora 30% da resistência de fogo do alvo (`fireResistPenetrationBonus` no pipeline de mitigação)
- [x] **Aquisição principal:** espólio do **Saci** (boss fase **1-50**, mapa Stendra) — garantido se ainda não possui
- [x] **Aquisição secundária:** Forja Divina (9× épico → lendário) — chance `FORGE_IGNUS_IX_CHANCE` = **0,005** (0,5%)
- [x] **Requisitos:** nível **30** + **INT 28** (recebido cedo, equipável só depois)

### Soler Plégius (lendário nomeado)

- [x] Template `soler_plegius` + sprite `gear/items/soler_plegius.png`
- [x] Efeito único `soler_plegius_cleanse` — 1× por batalha remove debuffs de aliado ao receber efeito negativo
- [x] `CombatState.spentBattleUniqueEffects` rastreia consumo na batalha
- [x] **Aquisição principal:** espólio do chefe da fase **3-50** (`bloody_orc_chief`) — garantido se ainda não possui
- [x] **Aquisição secundária:** Forja Divina — chance `FORGE_SOLER_PLEGIUS_CHANCE` = **0,005** (0,5%)

## Referências cruzadas

- [`gear-loot.spec.md`](gear-loot.spec.md) — templates e loot
- [`stash-forge.spec.md`](stash-forge.spec.md) — Forja Divina
- [`combat-campaign.spec.md`](combat-campaign.spec.md) — executor e status
- [`passives.spec.md`](passives.spec.md) — passivas cumulativas (scaling contínuo; não usar unique-effect para % por atributo)
