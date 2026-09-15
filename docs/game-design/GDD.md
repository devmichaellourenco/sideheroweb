# Side Hero — Game Design Document

**Produto:** Side Hero — Idle RPG  
**Plataforma:** HTML5 no itch.io (coluna compacta ~420px)  
**Versão de referência:** 0.8.7  
**Propósito:** visão de produto para investidores, desenvolvimento e colaboradores

## 1. Resumo executivo

Side Hero é um RPG idle jogável no navegador. Uma party de heróis enfrenta waves, derrota chefes, coleta baús e avança por uma campanha medieval numa interface compacta, pensada para sessões curtas e acompanhamento contínuo.

O diferencial é a baixa exigência de atenção com profundidade de construção de equipe: a batalha permanece visível numa faixa compacta, enquanto decisões de formação, equipamento, skills e progressão acontecem no acampamento.

O jogador pode acompanhar a ação continuamente ou intervir apenas quando deseja abrir baús, otimizar o grupo, escolher uma fase ou investir recursos.

## 2. Visão do produto

### Promessa

“Uma aventura idle compacta, com campanha completa e decisões de RPG quando você quiser.”

### Fantasia do jogador

Liderar uma pequena companhia de aventureiros que cresce de aprendizes a campeões, atravessa regiões hostis, adapta builds aos inimigos e conclui uma jornada com começo, meio e fim.

### Experiência-alvo

- Presença contínua sem interrupção constante.
- Progresso perceptível em sessões curtas.
- Decisões relevantes quando o jogador decide interagir.
- Clareza sobre a próxima melhoria, fase ou recompensa.
- Satisfação visual ao vencer chefes, obter gear raro e completar marcos.

## 3. Público e posicionamento

### Público principal — hipótese a validar

- Jogadores de idle RPG, incremental e auto-battler.
- Pessoas que jogam no navegador (itch.io) e gostam de progressão de longo prazo, builds e coleta, sem alta demanda mecânica.

### Necessidade atendida

Jogos tradicionais competem pela tela e atenção total. Side Hero oferece companhia, progressão e decisões de RPG numa coluna compacta, sem exigir sessão de ação contínua.

### Posicionamento

Um idle RPG HTML5 no itch.io, com campanha finita, party, builds e progressão até o final, numa interface vertical compacta.

## 4. Pilares de design

### 4.1 A aventura cabe numa coluna

A battle strip permanece visível no topo da coluna de jogo. O jogo deve comunicar estado, progresso e perigo em pouco espaço.

### 4.2 Automação conquistada

Automação não elimina o jogo; ela é parte da progressão. Velocidade de batalha, abertura de baús e otimização são desbloqueados por uma árvore de melhorias.

### 4.3 Decisões compactas, impacto duradouro

Formação, atributos, skills, ascensões, gear e resistências criam rotas de evolução. As decisões acontecem em interfaces rápidas, mas afetam muitas fases.

### 4.4 Recompensa com expectativa

Loot de combate chega em baús. Abrir, comparar, equipar, guardar, fundir ou destruir itens cria um ciclo de antecipação e gestão sem ultrapassar a capacidade do inventário.

### 4.5 Começo, meio e fim

A campanha base é uma história finita: Stendra → Gruftall → Valdris → Morthaven. Derrotar o Duque encerra a jornada. Não há temporada, selos de legado nem reinício com bônus permanentes no escopo de produto atual.

## 5. Loops de jogo

### Core loop

1. A party enfrenta automaticamente uma wave.
2. Inimigos concedem ouro, experiência e possíveis baús.
3. O grupo avança até uma intermissão, derrota ou conclusão da fase.
4. No acampamento, o jogador abre recompensas e ajusta formação, gear e skills.
5. Ouro compra melhorias, ofertas e novas automações.
6. O jogador seleciona ou retoma uma fase mais desafiadora.

### Loop de sessão curta

Abrir o painel, observar o estado da batalha, resolver recompensas pendentes, aplicar uma melhoria e retornar à navegação.

### Loop de região

Completar cinco atos, enfrentar o chefe regional, assistir às cenas de marco e liberar a região seguinte.

### Loop de conclusão

Avançar pelas quatro regiões do jogo base e derrotar o Duque de Morthaven. A vitória final é o fechamento da experiência — não o início de uma nova run meta.

## 6. Campanha e estrutura de conteúdo

A campanha “Ascensão de Nix” possui, no jogo base, 200 fases distribuídas em quatro regiões de 50 fases. Cada região contém cinco atos e culmina em um confronto de marco.

- **Stendra — tiers 1–50:** planícies verdes ameaçadas por goblins, bandoleiros e forças elementais. O Saci testa se o grupo merece avançar.
- **Gruftall — tiers 51–100:** terra de cinzas, ruínas e crateras sob a sombra de Gonodor. O arco termina diante de uma centelha de seu poder.
- **Valdris — tiers 101–150:** vale espectral de tumbas abertas, mortos-vivos e rituais corrompidos. O Espectro de Valdris guarda a passagem.
- **Morthaven — tiers 151–200:** castelo decadente dominado por cultistas, criaturas e lordes sombrios. O Duque de Morthaven encerra a campanha.

O catálogo reserva seis regiões adicionais até o tier 500. Esse conteúdo representa capacidade de expansão, não uma promessa de data, formato comercial ou disponibilidade.

## 7. Narrativa

Galneon, Nix e Elara deixam o acampamento rumo a Stendra quando relatos de saques e desaparecimentos se multiplicam. A jornada revela ameaças cada vez maiores: guardiões elementais, terras devastadas, espectros e uma conspiração conduzida a partir de Morthaven.

A narrativa é entregue em cenas por ato, com imagem, retrospectiva e antecipação do próximo desafio. Na primeira visualização, a cena pausa o avanço; depois, permanece disponível para releitura no mapa.

O tom combina aventura medieval, ameaça crescente e formação de uma companhia heroica. A história apoia a progressão sem interromper por longos períodos o ritmo idle.

## 8. Heróis, party e classes

O grupo inicial reúne:

- **Galneon, Knight:** linha de frente e resistência; caminhos Militar ou Marcial.
- **Nix, Sorcerer:** poder arcano e dano elemental; caminhos Arcano ou Inato.
- **Elara, Priest:** sustentação e cura; caminhos Sagrado ou Vida.

A party ativa comporta até três heróis e pode ser reorganizada no acampamento por clique ou drag-and-drop. A reserva recebe experiência parcial. Heróis adicionais — **Torius, Berserker** e **Valerius, Paladino** — entram pela árvore de melhorias e ampliam as opções de formação.

Cada herói evolui por:

- Experiência e níveis.
- Pontos de aprimoramento aplicados em atributos e skills.
- Skills de batalha equipadas em slots desbloqueáveis.
- Ascensões de classe em caminhos ramificados e irreversíveis.
- Gear com requisitos, raridades, bônus e efeitos únicos.

O ataque básico ocupa um slot fixo. As demais skills são selecionadas automaticamente durante o combate conforme disponibilidade e cooldown.

## 9. Combate

O combate acontece em tempo real por ticks e é resolvido automaticamente. Heróis e inimigos possuem temporizadores de ação, velocidades, skills, cooldowns e efeitos de status.

O sistema contempla:

- Dano físico mitigado por defesa.
- Dano elemental de fogo, gelo, raio e ar, mitigado por resistências.
- Crítico, esquiva, bloqueio e redução de dano.
- Cura, dano ao longo do tempo, buffs e debuffs.
- Waves com inimigos comuns, elites e chefes.
- Feedback por barras, números flutuantes, efeitos e log de batalha.

Uma derrota cura a party e devolve o grupo a um ponto seguro da progressão, preservando a run. O objetivo é permitir ajuste de build e retomada, sem transformar o wipe em perda definitiva.

## 10. Gear, loot e armazenamento

Todo gear obtido em combate chega por baús. Drops comuns são sorteados na abertura; itens únicos de chefe podem permanecer reservados como loot garantido.

O gear possui seis níveis de raridade: common, uncommon, rare, epic, legendary e mythic. Itens podem alterar atributos primários, resistências, velocidade, cooldown e efeitos especiais.

Cada herói equipa arma, armadura e acessório. O inventário comporta 30 itens; quando não há espaço, baús permanecem fechados. Um baú de itens desbloqueável amplia o armazenamento para 24, 36 ou 48 slots.

A Forja Divina permite:

- Fundir nove itens da mesma raridade em um item de raridade superior.
- Destruir gear em troca de ouro.
- Utilizar itens tanto do inventário quanto do armazenamento.

## 11. Economia e progressão sistêmica

### Ouro

É obtido principalmente em combate e destruição de gear. É gasto na loja, na árvore de melhorias e em sistemas de progressão. O balanceamento usa referências por tier para evitar escassez prolongada ou trivialização.

### Loja

Oferece gear determinado por tier e seed. A renovação é limitada por stage e ampliada por melhorias. Não há moeda premium ou compra dentro do jogo definida no escopo atual.

### Árvore de melhorias

Uma árvore única desbloqueia qualidade de vida e automação:

- Velocidades de auto-batalha.
- Abertura automática ou em lote de baús.
- Otimização e autoequipamento.
- Armazenamento, forja, slots de skills, loja e novos heróis.

### Conquistas

Conquistas celebram marcos da jornada (desbloqueios, chefes, builds). São objetivos opcionais dentro da campanha finita, não um ciclo pós-game obrigatório.

## 12. Mapa de retenção por estágio

Objetivo de retenção: o jogador quer **continuar até o fim** (Morthaven), não “resetar para forever”.

| Estágio | Faixa | O que prende | Mecânicas-âncora | Risco de abandono | Prioridade de design |
|---------|-------|--------------|------------------|-------------------|----------------------|
| **Early** | Tiers ~1–20 · Atos iniciais de Stendra | “Já estou avançando sem esforço” + primeira decisão que importa | Idle na strip, onboarding, baú, 1º gear, primeiros aprimoramentos, primeiras runas de QoL | Passividade sem recompensa; complexidade cedo demais | Clareza do próximo passo; celebração de marcos pequenos |
| **Mid early** | ~21–50 · resto de Stendra + Saci | “Minha build está nascendo” | Party/formação, skills em slots, loja, resistências leves, árvore de runas | Wall sem ferramenta clara; loot irrelevante | Walls com contramedida óbvia (resist, cura, formação) |
| **Mid** | ~51–100 · Gruftall | “Preciso adaptar para passar” | Elementos/resist, forja, stash, otimizar equipe, ascensão de classe | Estagnação longa; inventário cheio | Feedback de poder; gestão de inventário fluida |
| **Late mid** | ~101–150 · Valdris | “Estou no arco difícil da história” | Builds especializadas, skills de evolução, automações mid/late, cenas de ato | Fadiga de grind; sensação de platô | Ritmo de marcos (atos/boss); variedade de inimigos |
| **Late / fim** | ~151–200 · Morthaven | “Quero ver o final” | Pico de desafio, Duque, fechamento narrativo, conquistas finais | Sensação de “ainda falta grind sem payoff”; expectativa de NG+ | Final cinematográfico/Wow; créditos de conclusão; sem obrigar nova temporada |

### Âncoras transversais (todas as faixas)

1. **Poder perceptível** — level, aprimoramento, gear, skills.
2. **Expectativa de baú** — abrir, comparar, equipar.
3. **Build de party** — formação, atributos, skills, ascensão.
4. **Runas / automação** — cada compra melhora a vida idle.
5. **Marcos de campanha** — atos, cenas, bosses regionais.
6. **Conquistas** — marcos opcionais, sem exigir pós-game.

### Fora do mapa (neste momento)

- Selos de legado, árvore meta e nova run pós-Morthaven — **fora do produto canônico**. Código legado pode existir; a visão de produto não depende deles.

## 13. UX e apresentação

A interface é organizada em três níveis:

- **Battle strip:** combate e progresso sempre visíveis.
- **Acampamento:** acesso seguro à formação, heróis, inventário, loja, baús e melhorias.
- **Modais e drawers:** decisões detalhadas sem encobrir permanentemente a batalha.

Interações principais usam clique, hover, tooltips e drag-and-drop. Ações imediatas, como abrir baú e otimizar equipe, são visualmente separadas de botões que abrem telas.

O onboarding é contextual e pausa entre dicas. Celebrações “Wow” destacam conquistas, desbloqueios e marcos sem se repetirem indevidamente.

## 14. Direção visual e sonora

### Visual

A identidade combina pergaminho, tinta, madeira, ouro de selo e acentos de floresta. O tema escuro é padrão e o tema claro permanece disponível. Regiões têm banners e acentos próprios; raridades mantêm linguagem cromática consistente.

Sprites 2D, retratos, ícones e cenas reforçam leitura rápida no espaço vertical. A battle strip conserva tratamento visual próprio para garantir legibilidade durante a ação.

### Som — direção a validar

O projeto ainda não define um sistema sonoro canônico. A direção recomendada é discreta e opcional: impactos curtos, alertas de recompensa e ambiências regionais leves, com mute imediato para respeitar o contexto de trabalho e estudo.

## 15. Plataforma e tecnologia

Side Hero é um jogo HTML5 estático publicado no itch.io. A página executa regras, persistência e interface no mesmo JavaScript; o save permanece no navegador.

Características técnicas:

- TypeScript, esbuild e Vitest.
- Persistência local via `localStorage`, sem conta ou servidor obrigatório.
- Mensagens tipadas despachadas in-process (`InProcessGameClient`).
- Domínio independente de browser e DOM.
- Estado imutável e catálogos declarativos.
- Saves de run e conquistas separados (legado/meta fora do produto canônico atual).
- Migrações tolerantes para evolução do produto.
- Sem telemetria.

A arquitetura em camadas reduz acoplamento entre regras, infraestrutura e apresentação, facilitando balanceamento, testes e expansão de conteúdo.

## 16. Modelo de produto e distribuição

O jogo é apresentado como gratuito no itch.io. A interface inclui apoio voluntário por link externo, sem bloquear conteúdo ou vender poder.

Qualquer monetização adicional — expansões pagas, cosméticos, assinatura ou patrocínio — permanece uma hipótese e exige validação de público, política da plataforma e impacto na confiança do jogador.

O itch.io (HTML, zip com `index.html` na raiz) é a plataforma de distribuição confirmada. Outros canais permanecem oportunidades a avaliar, não compromissos atuais.

## 17. Estratégia de conteúdo

O jogo base **termina** em Morthaven. A estrutura de mapas, atos, catálogos e tiers permite expandir conteúdo no futuro, mas o produto atual é uma campanha completa com final — não um serviço de temporadas.

Prioridades de conteúdo:

1. Consolidar qualidade e balanceamento dos tiers 1–200.
2. Completar arte dedicada, feedback e variedade das quatro regiões.
3. Expandir conquistas e marcos **dentro** da jornada.
4. Validar retenção early → mid → late até a conclusão.
5. Tratar novas regiões só como hipótese de expansão, após validar o jogo base.

## 18. Indicadores a validar

Nenhuma meta quantitativa é assumida neste documento. Os indicadores recomendados para instrumentação e playtest são:

- Conclusão do onboarding e da fase 1-1.
- Retorno após primeira sessão e recorrência semanal.
- Tempo e tentativas por região, ato e chefe.
- Pontos de abandono ou estagnação por faixa (early / mid / late).
- Frequência de abertura do jogo e duração das sessões.
- Uso de formação, skills, gear, forja e árvore de melhorias.
- Taxa de conclusão da campanha (vitória em Morthaven).
- Interesse em apoio voluntário e conteúdo futuro.

## 19. Riscos e respostas de design

- **Descoberta no itch.io:** comunicar claramente a campanha compacta e demonstrá-la em vídeos.
- **Excesso de passividade:** garantir decisões periódicas de build, capacidade e progressão.
- **Complexidade em espaço estreito:** manter hierarquia visual, tooltips e ações contextuais.
- **Curva longa de 200 tiers:** usar auditorias e playtests por faixas early, mid e late.
- **Save só no navegador:** persistência robusta, migrações e backup export/import.
- **Custo de conteúdo:** reutilizar estruturas declarativas e priorizar identidade forte por região.

## 20. Marcos recomendados

Sem datas ou orçamento aprovados, os próximos marcos de produto são:

1. Vertical slice externo com onboarding, primeira região e ciclo completo de loot.
2. Playtest fechado da campanha base até a conclusão em Morthaven.
3. Instrumentação dos indicadores de comportamento e balanceamento por faixa.
4. Polish audiovisual e materiais de loja/apresentação.
5. Validação pública do produto gratuito e do apoio voluntário.
6. Decisão baseada em dados sobre expansão de conteúdo e novas plataformas.

## 21. Fontes canônicas

Este documento resume `specs/*.spec.md`, catálogos em `src/domain/**`, `package.json` e os testes do projeto. Detalhes de regra devem ser alterados primeiro na spec da feature correspondente e depois refletidos aqui.
