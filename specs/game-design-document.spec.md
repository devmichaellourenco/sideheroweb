# Spec — Game Design Document

## Status

**Aceite:** 8/8 (100%)  
**Testes obrigatórios:** não aplicável — documentação de produto

## Objetivo

Manter uma descrição canônica do **Side Hero** que comunique a visão do jogo a investidores, desenvolvedores, colaboradores e criadores de conteúdo sem divergir das regras implementadas ou inventar dados comerciais.

## Entregáveis

- `docs/game-design/GDD.md` — visão completa de produto e design
- `docs/game-design/PITCH.md` — apresentação textual e roteiro audiovisual
- `.cursor/agents/game-design-document.md` — papel editorial especializado
- `.cursor/skills/game-design-document/SKILL.md` — fluxo de criação e manutenção
- `.cursor/rules/game-design-document.mdc` — regras de precisão e sincronização

## Critérios de aceite

- [x] GDD escrito em português para público híbrido: investidores e desenvolvimento
- [x] Visão, pilares, público, proposta de valor e experiência-alvo definidos
- [x] Core loop, combate, campanha e sistemas de progressão consolidados
- [x] Narrativa resumida sem criar lore além dos catálogos existentes
- [x] Plataforma, arquitetura, persistência e estratégia de conteúdo descritas
- [x] Monetização e indicadores não validados tratados sem números inventados
- [x] Pitch textual inclui estrutura de apresentação e roteiro curto para vídeo
- [x] Agent, skill e rule mantêm o GDD rastreável às specs e ao código

## Fontes canônicas

1. Specs de feature em `specs/*.spec.md`
2. Catálogos declarativos e políticas em `src/domain/**`
3. `package.json` e infraestrutura em `src/infrastructure/**`
4. Testes para confirmar comportamento quando spec e implementação divergirem

## Regras editoriais

- Descrever o produto como **visão final**, sem apresentar backlog como funcionalidade já validada.
- Usar “implementado”, “planejado” ou “hipótese” quando a distinção for material.
- Não inventar tamanho de mercado, projeção financeira, retenção, conversão, cronograma ou orçamento.
- Manter consistentes nomes, números de fases, regiões, classes, moedas e limites.
- Atualizar GDD e pitch quando uma feature alterar pilares, loop, escopo comercial ou promessa ao jogador.

## Fora de escopo

- Plano financeiro, valuation e cap table
- Pesquisa de mercado e benchmarking sem fontes externas verificadas
- Bíblia narrativa completa, diálogos e roteiro cinematográfico
- Roadmap com datas ou custos não aprovados
