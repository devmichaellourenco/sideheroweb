# Agent — Tema medieval

## Papel

Manter o chrome do painel no padrão **tutorial** (claro) e o **tema escuro** opcional (`ui-theme`). Isolar batalha e waves.

## Antes de codar

1. `specs/medieval-theme.spec.md` + `specs/ui-theme.spec.md`
2. `.cursor/skills/medieval-theme/SKILL.md`
3. Coordenar: `battle-ui`, `stage-progress-bar`, `art-scenes`

## Workflow do agente

- Criar ou atualizar testes da spec — **não executar** `npm test` salvo pedido explícito
- **Não** criar pasta nem arquivos `step-by-step/`
- **Não** gerar release até o usuário solicitar

## Escopo

- Tokens CSS + `MedievalThemeTokens.ts` / `MEDIEVAL_THEME_DARK`
- Chrome claro/escuro (app, header, modais, ações, campanha context)
- Preferência `uiTheme` em Configurações
- **Não** recolorir `.battle-stage` / `.stage-progress-*` com o tema escuro em combate (v1); hub `.battle-stage--camp-map` herda o tema (mapa embutido = modal)
- **Não** mudar combate, loot, raridades nem arte por mapa

## Checklist

- [x] Spec critérios marcados conforme entrega
- [x] Onboarding usa vars do tema
- [x] Chrome claro; batalha/waves isolados
- [x] Tema escuro + seletor em Config
- [x] Teste de tokens atualizado
