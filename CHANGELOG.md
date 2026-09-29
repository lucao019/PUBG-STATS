# Changelog

Histórico de desenvolvimento do PUBG-STATS.

O projeto está em desenvolvimento e as versões abaixo representam as principais etapas da construção do sistema.

---

## [0.4.0] - 2026-09-29

### Overlay OBS

- Criado overlay próprio para utilização como Browser Source no OBS.
- Criados `overlay.html`, `overlay.css` e `overlay.js`.
- Implementada atualização automática das estatísticas.
- Atualização dos dados a cada 60 segundos.
- Implementada animação quando uma estatística é alterada.
- Criado visual minimalista inspirado em black metal.
- Fundo transparente para integração com gameplay.
- Criado efeito animado de sombra/fumaça atrás das estatísticas.

### Informações exibidas

- Kills do dia.
- Damage do dia.
- Número de partidas.
- Arma com mais kills.
- Quantidade de kills com a arma preferida.

---

## [0.3.0] - 2026-09-29

### Telemetria e armas

- Implementada leitura da telemetria das partidas.
- Implementada identificação de eventos `LogPlayerKillV2`.
- Criada contagem de kills por arma.
- Criado sistema para determinar a arma com mais kills no dia.
- Criado `arma-hoje.js` para testes da telemetria.
- Criado sistema de tradução dos nomes internos das armas.

Exemplo:

```text
WeapHK416_C
    ↓
M416