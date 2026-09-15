# Inventário de mecânicas — Side Hero

Inventário das **mecânicas presentes** no produto canônico (campanha base até Morthaven).  
Fontes: `specs/*.spec.md`, `src/domain/**`, `docs/game-design/GDD.md` / `PITCH.md`.

Útil como mapa para balancear flow, builds e desafios por fase.

**Excluído deste inventário:** Balance Lab, wishlist, e sistemas com código mas fora do canônico (listados no final).

---

## Loop principal

| Mecânica | Descrição |
|----------|-----------|
| Acampamento → mapa → missão → batalha → camp | Sem auto-avançar missões pós-vitória |
| Missão principal (`main`) | Marcos `x-1`…`x-50` sequenciais; não repetível; derrota mantém no board e zera a tentativa |
| Missão secundária (`side`) | História paralela + recompensa exclusiva; várias ativas; expiração ao concluir main posterior |
| Missão normal (`normal`) | Farm repetível (2–4 na oferta); some da oferta na vitória/derrota; refresh por visitas ao camp |
| Estrelas 1–5 | Indicam dificuldade/template das missões |
| Capítulos por main | Oferta normal/side limitada à faixa da main incompleta (ex.: Cap. 10 → fases 2–10) |
| Preview pré-batalha | Waves, monstros e stats antes de iniciar |
| 4 regiões base (200 fases) | Stendra → Gruftall → Valdris → Morthaven |
| Vitória / derrota → camp | Outcome não inicia próxima missão; ouro nos kills; XP só na vitória (`targetXp`) |

Specs: `camp-missions`, `combat-campaign`.

---

## Combate (tempo real)

| Mecânica | Descrição |
|----------|-----------|
| Tick de combate | Avança quando não pausado; respeita intermissão, loadout e `battlePaused` |
| TTA / ASPD | Tempo até ação = `1/ASPD`; ASPD por classe/tier + STR/DEX |
| Ataque básico | `ATK × basicAttackDamageRatio` da identidade do combatente |
| Skills automáticas | Seletor escolhe skill disponível por CD/slot |
| Cooldown de skill | `cooldownTurns × s/turno − cooldownSecondsPerRank`; CDR de gear com teto/piso |
| Recovery pós-skill | `actionRecoverySeconds / castSpeed` por skill |
| Elementos | `physical`, `fire`, `cold`, `lightning`, `air` |
| Pipeline de dano | Poder → crítico → DEF (físico) / resist (elemental) → esquiva → block → DR |
| Crítico | `critChance` + `critDamage` antes do split de componentes |
| Resistências | Gear + inato + bias de mapa |
| Esquiva / bloqueio / DR | Após soma dos componentes; caps no domínio |
| DOT | `onHitDot` ticka e passa pelo pipeline de mitigação |
| Status / buffs / debuffs | Tracker de status; curas; efeitos de skill e unique |
| Waves | Até 3 inimigos/wave; roles trash / elite / boss; intermissões CLEAR/WARNING |
| Scaling inimigo | Level/tier + attrs + role |
| Micro-desafios de fase | race / sustain / spike / warded / armored (hint na UI) |
| Identidade por mapa | Bias de pool de inimigos + resists temáticos |
| Recompensas de kill | Ouro e baús por kill; XP lump sum só na vitória da fase |
| Loot de boss nomeado | Garantido na 1ª vitória do template (Ignus Ix, Vorpal, Soler, Selo) |
| Pausa de batalha | Congela combate sem editar party |

Specs: `combat-campaign`, `game-balance`, `stage-progress-bar`.

---

## Stage Progress Bar

| Mecânica | Descrição |
|----------|-----------|
| Timeline de waves | Marcadores trash/elite/boss com fill proporcional ao progresso da fase ativa |

---

## Heróis e party

| Mecânica | Descrição |
|----------|-----------|
| Party ativa (até 3 slots) | Edição só no acampamento (`canEditParty`); mínimo 1 herói |
| Reserva (bench) | Drag reserva ↔ equipe; XP parcial |
| Elenco / unlocks | New game: só Nix; depois Galneon → Elara → Berserker → Rain → Paladino (gates de main + runas) |
| Formação | Reordenar slots por drag-and-drop no acampamento |
| Níveis / XP | XP de vitória de fase; curva em `HeroLevelXpCatalog` |
| Atributos STR / DEX / INT | Pontos de aprimoramento alocáveis; afetam combate/ASPD/crit conforme perfil |
| Detalhe do herói | Abas Loadout / Status / Skills / Classe |

Spec: `heroes-party`.

---

## Skills e ascensão

| Mecânica | Descrição |
|----------|-----------|
| Pool único de aprimoramento | Gasta em atributos, ranks de skill e skills de evolução |
| Ranks / levels de skill | `+1` com pré-requisitos e `maxRank`; poder escala por rank/attr |
| Slots de batalha | Slot 0 = Ataque Básico fixo; extras via runa `battle_skill_slots` |
| Gate de investimento em skills | Sem slot extra, só atributos; skills de classe bloqueadas |
| Equipar skills | Clique/drag para barra; CD na strip |
| Ascensão de classe | Caminhos ramificados irreversíveis; concede pontos e skills de evolução |
| Skills de evolução | `pointType: 'ascension'`, maxRank 3, mesmo pool de aprimoramento |

Spec: `skills-progression`.

---

## Passivas sempre ativas

| Mecânica | Descrição |
|----------|-----------|
| Passivas de classe | Saúde de Titã, Afinidade Mágica, Elo com a Vida, Sede de Sangue, Olhar de Kontempler, Égide Sagrada |
| Passivas de ascensão | Cumulativas na cadeia; stacking aditivo |
| Hooks em fórmulas | max HP, DEF, ATK, dano de skill, cura/buff de aliado |

Spec: `passives`.

---

## Gear, loot e baús

| Mecânica | Descrição |
|----------|-----------|
| Loot via baú | Combate não injeta gear direto; abrir 1 ou Abrir todos (se runa) |
| 6 raridades | common → mythic |
| Loot procedural | Template + raridade + itemLevel |
| Slots ativos | Arma / armadura / acessório |
| Requisitos de equip | Slot, nível e classe |
| Inventário 30 slots | Baús ficam pendentes se não houver espaço |
| Mythic gated | Só após Ato 3 Valdris / tier ≥ 121 |
| Comparação de gear | Deltas ▲/▼ em inventário/loja |
| Unique / named legendary | Vorpal (`heal_block`), Ignus Ix (fogo + pen.), Soler (cleanse), Selo (pen. raio) |
| `basePrice` fixo | Preço no catálogo; loja aplica multiplicadores explícitos |

Specs: `gear-loot`, `unique-effects`.

---

## Stash e Forja

| Mecânica | Descrição |
|----------|-----------|
| Baú de itens (stash) | 24 / 36 / 48 slots via `item_stash` |
| Mover inventário ↔ stash | Drag ou ação |
| Fundir (Forja Divina) | 9 itens mesma raridade → 1 superior; chance de named legendary |
| Salvage | Destruir gear por ouro; bloqueado em unique/named |

Spec: `stash-forge`.

---

## Loja e economia

| Mecânica | Descrição |
|----------|-----------|
| Ouro | Principalmente kills + salvage; gasto em loja/runas |
| Orçamento por fase | `PhaseGoldBudget` / `PhaseXpBudget` limitam renda ao tier |
| Lojas configuráveis | Pool explícito, unlock por main, só a mais recente ativa |
| Cap de raridade na loja | Progressão por mains (até mythic em Valdris Ato 3) |
| Renovar loja | Cota por loja via `shop_refresh`; epic+ comprados não voltam |
| Compra + equipar | Drag da oferta para slot do herói |

Spec: `shop-economy`.

---

## Árvore de melhorias / runas

| Mecânica | Descrição |
|----------|-----------|
| Grafo com parents | Compra bloqueada sem pais |
| Features presentes | Velocidade auto-batalha, abrir todos baús, auto-equip loot, stash, forja, slots de skill, refresh loja, unlocks de herói, log filter, reset de aprimoramento |
| Gates de conteúdo | Ex.: heróis exigem main concluída + nó da árvore |

Spec: `upgrade-tree`.

---

## Reset de aprimoramento

| Mecânica | Descrição |
|----------|-----------|
| Reset unitário (−) | Devolve 1 ponto de atributo ou 1 rank |
| Reset em massa | Zera skills até piso da ascensão; attrs até mínimo; **não** desfaz `ascensionId` |

Spec: `improvement-reset`.

---

## Achievements

| Mecânica | Descrição |
|----------|-----------|
| Conquistas persistentes | Fora do `GameState` (sobrevivem a Novo Jogo) |
| Marcos binários | Clear `1-1`, `1-50`, `2-50`, `3-50`, `4-50`; lista + Wow; sem recompensa material |

Spec: `achievements`.

---

## Cenas narrativas

| Mecânica | Descrição |
|----------|-----------|
| Cenas por ato | Cards na trilha; 1ª visão pausa ticks; releitura no mapa |
| Cenas de side | Gatilhos/recompensas via catálogo de missões/cenas |

Spec: `story-scenes`.

---

## UX / apresentação (relevantes ao jogo)

| Sistema | Mecânicas |
|---------|-----------|
| Battle UI | Strip sempre visível; Wow; onboarding; Stats; baú flutuante; overlays; splash |
| Arte de região | Cenários + banners das 4 regiões base |
| Áudio | BGM camp/batalha + SFX de UI; preferências mute/volume |
| Tema | Pergaminho/tinta/selo; tema claro/escuro (batalha isolada) |

---

## Eixos para balance (builds × desafios)

Para **builds diferentes** e **desafios por fase**, os eixos que mais importam:

1. Elementos / resists + micro-desafios de fase  
2. Skills / ascensão / passivas  
3. Gear unique vs procedural  
4. Composição de party (até 3 slots + bench)  
5. Curva main vs farm (normal / side)

---

## Explicitamente fora do produto canônico

Código existe, mas **não** tratar como core jogável / balance alvo:

- Meta / legado (`META_LEGACY_ENABLED = false`)
- Tick em background / progressão com a página fechada
- Auto-abrir baús e Otimizar equipe (desativados na UI)
