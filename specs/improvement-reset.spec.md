# Spec — Reset de Pontos de Aprimoramento

## Status

**Aceite:** 16/16 (100%)  
**Testes obrigatórios:** 12/12

## Objetivo

Permitir **devolver** pontos de aprimoramento já gastos em **atributos** (STR/DEX/INT) e **ranks de skills** (`pointType: 'improvement'`), devolvendo-os ao pool `unspentImprovementPoints` do herói.

Dois níveis na árvore de **Runas**:

| Nível | Nome | Modo |
|-------|------|------|
| I | Reset de pontos | Remoção **ponto a ponto** (−) |
| II | Reset de pontos em massa | Remoção **em massa** do herói (um clique) |

**Não** há refund de ascensão (classe/evolução) neste ponto do projeto.

## Critérios de aceite

### Desbloqueio — nível I (árvore de Runas)

- [x] Nó `improvement_reset_1` (feature `improvement_reset`, level **1**)
- [x] Custo: **5000** ouro
- [x] `parents`: `['divine_forge_1']`
- [x] Requisitos: Forja Divina ≥ 1 **e** `min_hero_level` ≥ **12**
- [x] Sem level ≥ 1: UI de remoção (−) **não** aparece; refund unitário rejeitado no domínio/use case

### Desbloqueio — nível II (massa)

- [x] Nó `improvement_reset_2` (feature `improvement_reset`, level **2**)
- [x] Custo: **10000** ouro
- [x] `parents`: `['improvement_reset_1']` (após Reset nível I)
- [x] Requisitos: `upgrade_level` `improvement_reset` ≥ 1 **e** `min_hero_level` ≥ **22**
- [x] Sem level ≥ 2: botão/ação de reset em massa **não** aparece / rejeitada

### Reset unitário (nível I+)

- [x] Remover **1 ponto** de atributo alocado ou **1 rank** de skill de aprimoramento por ação
- [x] Cada remoção bem-sucedida: `unspentImprovementPoints` += 1
- [x] Pontos voltam a ficar disponíveis para gastar de novo
- [x] Rank 0 = skill de aprimoramento não aprendida

### Bloqueios — skill (unitário)

- [x] Se a remoção reduzir o rank para **0** e a skill estiver **equipada** → **bloquear** + toast pedindo desequipar
- [x] Não reduzir rank se outra skill com rank > 0 exige esse `skill_rank` mínimo

### Bloqueios — atributo (unitário)

- [x] Se −1 atributo fizer o herói falhar requisito de skill (rank > 0), item equipado ou ascensão atual → **bloquear** + toast
- [x] Toast: skill/item podem ser desequipados/removidos; **ascensão não tem volta**

### Reset em massa (nível II+)

Aplica-se ao **herói selecionado** (modal do herói). Em uma única ação:

#### Skills de aprimoramento e evolução

- [x] Zera ranks `pointType: 'improvement'` até o piso exigido pela ascensão atual (ex.: `thrust` no Guerreiro)
- [x] Zera ranks `pointType: 'ascension'` até o piso exigido pela ascensão atual (ex.: `mil_guer_rally` no Capitão); pontos voltam a `unspentImprovementPoints`
- [x] Skills zeradas são **removidas dos slots**; slot 0 Ataque Básico intacto
- [x] **Não** altera `ascensionId` (classe/caminho permanece)

#### Atributos

- [x] Reduz `allocatedAttributes` o máximo possível **sem** violar mínimos ainda necessários
- [x] Após zerar skills de aprimoramento, os únicos pisos relevantes restantes são:
  - requisitos da **ascensão atual** (irreversível)
  - requisitos de **itens ainda equipados**
- [x] Para cada atributo: `allocated` fica no mínimo necessário para manter `totalAttributes` ≥ max(pisos de ascensão/itens); o restante é refundado
- [x] Se não foi possível zerar algum atributo por causa da **ascensão** → toast explicando que a ascensão exige o mínimo e não pode ser desfeita
- [x] Se não foi possível zerar algum atributo por causa de **item(ns) equipado(s)** → toast explicando o(s) item(ns) e pedindo **desequipar** se quiser recuperar o restante
- [x] Se ambos travarem, toasts cobrem os dois casos (ou um toast combinado claro)

#### Integridade

- [x] Mesmas regras de “não ficar abaixo do mínimo necessário” que o reset unitário, aplicadas ao resultado final em massa
- [x] Domínio rejeita massa sem feature level ≥ 2
- [x] Confirmação UX recomendada antes da massa (modal curto), para evitar clique acidental

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Domain | `FeatureKey` + `FeatureAccessPolicy`; `UpgradeCatalog` / `UpgradeTreeLayout`; `ImprovementResetService` (unitário + massa) |
| Application | `RefundImprovementPointUseCase`, `MassRefundImprovementPointsUseCase`; flags `improvementReset` (nível) |
| Infrastructure | SW: `REFUND_IMPROVEMENT_POINT` + `MASS_REFUND_IMPROVEMENT_POINTS` |
| Presentation | (−) Status/Skills; botão **Reset em massa**; `ImprovementResetConfirmDialog`; toasts |

Coordenar com: `upgrade-tree`, `skills-progression`, `heroes-party`, referência Forja em `stash-forge`.

## Invariantes

- Devolve aprimoramento (`pointType: 'improvement'` + `allocatedAttributes` + ranks `pointType: 'ascension'`) para `unspentImprovementPoints`
- **Não** desfaz a ascensão de classe (`ascensionId` permanece)
- Skills exigidas pela ascensão atual (`skill_rank` no catálogo) só descem até o piso
- Feature level 1 = unitário; level 2 = unitário + massa
- Presentation só DTOs/flags

## UX

| Feature level | Controles |
|---------------|-----------|
| 0 | Sem (−) e sem massa |
| ≥ 1 | (−) em attrs alocados, skills de aprimoramento **e** skills de evolução com rank > 0 |
| ≥ 2 | (+) botão **Reset em massa** no modal do herói (aba Status) |

- Erros / avisos parciais da massa → **toast**
- Sucesso → atualizar ficha; preservar scroll quando aplicável

## Mensagens de toast (orientação)

| Caso | Mensagem (pt-BR) |
|------|------------------|
| Skill rank→0 equipada (unitário) | Desequipe **{skill}** dos slots de batalha antes de remover o último ponto. |
| Atributo trava skill (unitário) | **{skill}** exige {ATTR} ≥ {n}. Remova pontos dessa skill ou desequipe-a antes de reduzir. |
| Atributo trava item (unitário) | **{item}** exige {ATTR} ≥ {n}. Desequipe o item antes de reduzir. |
| Atributo trava ascensão (unitário) | A ascensão **{nome}** exige {ATTR} ≥ {n} e **não pode ser desfeita**. |
| Massa — piso ascensão | Reset parcial: a ascensão **{nome}** exige {ATTR} ≥ {n} e não pode ser desfeita. Pontos acima desse mínimo foram devolvidos. |
| Massa — piso item | Reset parcial: **{item}** exige {ATTR} ≥ {n}. Desequipe o item se quiser recuperar o restante dos pontos. |
| Feature I bloqueada | Reset de pontos ainda bloqueado. Compre o nó na árvore de Runas. |
| Feature II bloqueada | Reset em massa ainda bloqueado. Compre o nó II na árvore de Runas. |

## Fora de escopo

- Desfazer caminho de classe / trocar evolução (`ascensionId`)
- Custo em ouro por ponto refundido (só os nós da árvore custam ouro)
- Reset em massa de **todos** os heróis de uma vez (apenas o herói do modal)

## Testes obrigatórios

- [x] `UpgradeCatalog` / `UpgradeTreeLayout` — nós `_1` e `_2`, parents, custos 5000/10000, requisitos nv. 12/22
- [x] Flags — level 1 vs 2 (`improvementReset` / nível da feature)
- [x] Refund unitário atributo OK + bloqueios skill/item/ascensão
- [x] Refund unitário skill OK + bloqueio rank→0 equipada + pré-requisito `skill_rank`
- [x] Massa: zera skills de aprimoramento e limpa slots dessas skills
- [x] Massa: não altera skills de ascensão
- [x] Massa: atributos descem até piso de ascensão/itens; refund do excedente
- [x] Massa: toast/resultado parcial quando ascensão e/ou itens travam
- [x] Use case rejeita unitário sem level 1; massa sem level 2
- [x] Presentation: (−) só level≥1; massa só level≥2
- [x] Após refund, `unspentImprovementPoints` coerente e allocate volta a funcionar
- [x] Confirmação de massa (se implementada) cancela sem alterar estado

## Notas de implementação (orientação)

1. `FEATURE_KEYS` += `'improvement_reset'` (níveis 1 e 2 no catálogo)
2. `improvement_reset_1`: parents Forja, 5000, herói 12+
3. `improvement_reset_2`: parents `_1`, 10000, herói 22+, `upgrade_level` reset ≥ 1
4. Massa: ordem — (1) zerar ranks improvement + limpar slots; (2) recalcular piso de attrs; (3) reduzir allocated; (4) devolver pontos; (5) avisos parciais
5. SW: `REFUND_IMPROVEMENT_POINT` + `MASS_REFUND_IMPROVEMENT_POINTS`
