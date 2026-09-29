# PUBG-STATS

Overlay local de estatísticas do PUBG para uso no OBS.

O projeto consulta dados da PUBG API e telemetria das partidas para gerar estatísticas do jogador e exibi-las em um overlay transparente no OBS.

## Objetivo

Criar um sistema próprio de estatísticas para transmissão de PUBG, sem depender de overlays de terceiros.

Atualmente o overlay exibe estatísticas acumuladas do dia:

- Kills
- Damage
- Partidas
- Arma com mais kills
- Quantidade de kills com essa arma

## Arquitetura

```text
PUBG
  │
  ▼
PUBG API
  │
  ├── jogador
  ├── partidas
  ├── estatísticas
  └── telemetria
        │
        ▼
Node.js / Express
        │
        ▼
GET /api/hoje
        │
        ▼
HTML + CSS + JavaScript
        │
        ▼
OBS Browser Source