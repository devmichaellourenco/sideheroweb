# Side Hero

Idle RPG HTML5 para **itch.io**.

## Pré-requisito

```bash
npm install --cache ./.npm-cache
```

## Jogo (local)

O build gera `dist/`. Não abra `index.html` pelo explorador — o jogo usa módulos ES e falha em `file://`.

```bash
npm run build
cd dist && python3 -m http.server 8080
```

Abra **http://127.0.0.1:8080/**

Para rebuild contínuo enquanto edita o código (em outro terminal):

```bash
npm run watch
```

Depois dê refresh no navegador. O save fica no `localStorage` desse origin.

## Balance Lab (local)

Ferramenta de calibração **fora** do produto jogável (simulador, missões, XP, itens, lojas, personagens, inimigos, melhorias).

```bash
npm run balance-lab
```

Abra **http://127.0.0.1:5179/**

Após salvar no lab, rode `npm run build` de novo para o jogo embutir os JSON de override.

Porta alternativa: `BALANCE_LAB_PORT=5180 npm run balance-lab`

## Publicação

`npm run release` gera o zip em `releases/` — só quando for publicar no itch.

## Fonte de verdade

- `specs/` — specs SDD por feature
- `.cursor/AGENTS.md` — agents, skills e rules do projeto
- `releases/` — zips gerados sob pedido
