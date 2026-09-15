---
name: medieval-theme
description: Paleta medieval do painel Side Hero (pergaminho claro, tinta, ouro de selo) e tema escuro (data-ui-theme). Use para tema, cores, :root, CSS vars, dark mode, uiTheme, onboarding palette, chrome ou MedievalThemeTokens. Exceto battle-stage e stage-progress.
---

# Tema medieval

## Spec

`specs/medieval-theme.spec.md` · `specs/ui-theme.spec.md`

## Coordenação SDD

```
@.cursor/skills/medieval-theme/SKILL.md
+ @.cursor/skills/battle-ui/SKILL.md
+ @.cursor/skills/stage-progress-bar/SKILL.md
```

## Referência

Card do tutorial (`.onboarding-card`): borda ouro `#c9a227`, fundo `#fff9ed → #f3e4bc → #e8d4a0`, tipografia tinta `#1f1710` / `#3d3428`, CTA floresta `#3f8a49 → #2f6b38`.

## Princípios

1. **Chrome do painel = pergaminho claro + texto tinta** (igual tutorial)
2. **Exceção:** `.battle-stage` (batalha + Acampamento/Batalhar) e `.stage-progress-*` (waves)
3. Ênfase = ouro de selo; CTA positivo = floresta; perigo = carmesim selo
4. Temas por mapa e raridades **não** são sobrescritos

## Tokens

`MedievalThemeTokens.ts` → `:root` (light) + `html[data-ui-theme='dark']` (dark)  
Preferência: `GamePreferences.uiTheme` → `applyUiTheme()` → `data-ui-theme`  
Batalha: `html[data-ui-theme='dark'] .battle-stage:not(.battle-stage--camp-map)` restaura tokens light. Hub com mapa embutido herda o tema do painel (como o modal Mapa).

Inclui base, **semântica**, **tokens por contexto** e `MEDIEVAL_THEME_DARK`.

## Fluxo ao alterar cor / tema

1. Spec (`medieval-theme` / `ui-theme`) + `MedievalThemeTokens.ts` (+ `MEDIEVAL_THEME_DARK`)
2. Espelhar light em `:root` e dark em `html[data-ui-theme='dark']`; manter reset de `.battle-stage`
3. Componentes só usam `var(--*)` — sem hex solto fora de `:root`
4. Teste de tokens + `applyUiTheme` / preferência
5. Marcar aceite

## Testes

`MedievalThemeTokens.test.ts`, `applyUiTheme.test.ts`, `GamePreferencesController.test.ts` — **não** executar `npm test` automaticamente.

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** gerar release até o usuário solicitar
- **Não** criar pasta nem arquivos `step-by-step/`
