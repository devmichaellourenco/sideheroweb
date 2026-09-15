# Spec — Cenários e arte de campanha

## Status

**Aceite:** 5/10 (50%) · v1 foca nas 4 regiões base (+ mapa de locais Stendra)  
**Testes obrigatórios:** 2/2 (Stendra)

## Objetivo

Cada região da campanha tem **cenário de batalha** (painéis L/R + céu elástico) e **banner ilustrado** no modal de campanha, reforçando imersão sem bloquear leitura do combate.

## Critérios de aceite

- [x] `stendra`: battle strip com fundo único `cenario_stendra.jpeg` (333×133) + banner
- [x] `stendra`: mapa de locais com arte de fundo `map_1.png` (pins de missão; ver `camp-missions`)
- [x] `gruftall`: battle strip com fundo único `cenario_grutfall.png` + banner
- [x] `valdris`: battle strip com fundo único `cenario_valdris.png` + banner
- [x] `morthaven`: battle strip com fundo único `cenario_morthaven.png` + banner
- [x] Battle strip com fundo único nas quatro regiões base
- [ ] Layout da strip escala de ~280px a ~900px sem cortar zona central de combate
- [ ] Fallback: gradiente genérico quando mapa não tem cena cadastrada
- [ ] Assets em `public/sprites/campaign/{mapId}/` copiados no build
- [ ] Catálogo em `CampaignSceneCatalog.ts` é fonte única de paths

### Backlog DLC (fora do escopo v1)

Mapas `broken_sky` … `void_throne` seguem o mesmo padrão de assets quando cada DLC for liberado.

## Convenção de arquivos

| Arquivo | Uso |
|---------|-----|
| `cenario_{mapId}.png` / `.jpeg` | *(preferencial)* Fundo único da battle strip (333×133) |
| `battle_{mapId}_left.png` | Painel esquerdo da battle strip (legado / mapas sem fundo único) |
| `battle_{mapId}_right.png` | Painel direito da battle strip |
| `battle_{mapId}_center.png` | *(opcional)* Faixa central (horizonte entre os painéis) |
| `battle_{mapId}_backdrop.png` | *(opcional)* Céu/horizonte em largura total (camada atrás) |
| `campaign_{mapId}_banner.png` | Banner ilustrado no card da região no **mapa-mundo** |
| `map_1.png` (Stendra+) | Arte de fundo do **mapa de locais** (pins de missão); path via `MissionMapLayoutCatalog` |
| `floor_{mapId}_tile.png` | Textura de chão com `repeat-x` na battle strip (28px de altura) |

## Camadas e arquivos-chave

| Camada | Paths |
|--------|-------|
| Assets | `public/sprites/campaign/{mapId}/` |
| Build | `scripts/copy-assets.mjs` → `dist/panel/assets/campaign/` |
| Presentation | `CampaignSceneCatalog.ts`, `BattleScenePresentation.ts`, `CampaignMapPresentation.ts` |

## Inventário de arte

| mapId | Battle L+R | Banner |
|-------|------------|--------|
| stendra | ✅ fundo único | ✅ |
| gruftall | ✅ fundo único | ✅ banner |
| valdris | ✅ fundo único | ✅ banner |
| morthaven | ✅ fundo único | ✅ banner |
| broken_sky | ☐ | ☐ |
| crimson_abyss | ☐ | ☐ |
| eternal_forge | ☐ | ☐ |
| ancient_grove | ☐ | ☐ |
| twilight_tower | ☐ | ☐ |
| void_throne | ☐ | ☐ |

## Testes obrigatórios

- [x] `BattleScenePresentation.test.ts` — catálogo Stendra + apply/remove scenic
- [x] `CampaignModalRenderer.test.ts` — banner Stendra no card do mapa-mundo

## Notas

- PNGs atuais de Stendra são alta resolução (~1.5k×1k); o CSS escala para 128px de altura. Otimizar tamanho de arquivo em release futura se necessário.
- O vão central aparece porque os painéis L/R cobrem ~52% cada; preencher com `battle_{mapId}_center.png` (~400–600×128) ou `battle_{mapId}_backdrop.png` (largura total ~900×128). Registrar paths opcionais em `CampaignSceneCatalog.ts`.
- Personagens ancorados no chão via `--strip-actors-bottom` (14px); HP e skills agrupados acima da faixa de piso.
