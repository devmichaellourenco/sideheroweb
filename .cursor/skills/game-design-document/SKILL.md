---
name: game-design-document
description: Cria e mantém o GDD, pitch e materiais de apresentação do Side Hero com rastreabilidade às specs e ao código. Use para GDD, game design document, pitch, investidores, apresentação do jogo, roteiro de vídeo, visão de produto ou documentação de mecânicas.
---

# Game Design Document

## Spec

`specs/game-design-document.spec.md`

## Fontes

Leia somente o necessário, nesta ordem:

1. Spec do GDD
2. Specs das features envolvidas
3. Catálogos e políticas do domínio
4. Manifest, package e infraestrutura para plataforma
5. Testes quando houver divergência

## Fluxo

1. Defina público, objetivo e formato do material.
2. Liste afirmações que precisam de confirmação.
3. Mapeie cada afirmação para uma fonte canônica.
4. Escreva primeiro a visão e os pilares; depois sistemas e detalhes.
5. Marque explicitamente hipótese, plano ou dado pendente.
6. Sincronize `GDD.md` e `PITCH.md`.
7. Revise nomes, números, escopo de release e termos.

## Estrutura do GDD

- Resumo executivo e conceito
- Público e proposta de valor
- Pilares e experiência-alvo
- Core loop e loops de sessão/temporada
- Combate, campanha e progressão
- Economia, loot, melhorias e meta
- Narrativa e direção audiovisual
- UX, plataforma e tecnologia
- Conteúdo, distribuição e monetização
- Indicadores a validar, riscos e próximos marcos

## Estrutura do pitch

- Problema/oportunidade
- Solução e diferencial
- Experiência do jogador
- Sistemas e profundidade
- Plataforma e capacidade de expansão
- Modelo sustentável sem métricas inventadas
- Estado do produto e próximos marcos
- Pedido ao público da apresentação
- Roteiro audiovisual curto

## Regras

- Português claro, adequado a leitores não técnicos.
- Não afirmar métricas, mercado, receita, orçamento ou prazo sem fonte.
- Não criar lore canônica além dos catálogos.
- “Implementado”, “planejado” e “hipótese” não são intercambiáveis.
- Não duplicar especificações de baixo nível; resumir e apontar a fonte.
- Não transformar detalhes arquiteturais em promessa comercial.

## Coordenação

Consulte os skills de `combat-campaign`, `story-scenes`, `game-balance`, `web-infra`, `battle-ui` e da feature detalhada.
