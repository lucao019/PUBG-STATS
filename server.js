require("dotenv").config();

const express = require("express");

const app = express();
const PORT = 5051;

const API_KEY = process.env.PUBG_API_KEY;
const PLAYER_NAME = "lucao99999999999";

/* =========================================================
   CACHE
========================================================= */

let cacheHoje = null;
let cacheAtualizando = false;
const partidasProcessadas = new Map();
let dataCache = null;
let jogadoresOnline = 0;
let ultimaAtualizacaoSteam = 0;

const CACHE_STEAM_TEMPO = 5 * 60 * 1000;
const CACHE_TEMPO = 60 * 1000; // 60 segundos
const INTERVALO_ATUALIZACAO = 60 * 1000; // 60 segundos
const pubgHeaders = {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "application/vnd.api+json"
};


/* =========================================================
   NOMES DAS ARMAS
========================================================= */

const nomesArmas = {
    "WeapHK416_C": "M416",
    "WeapMini14_C": "Mini14",
    "WeapM249_C": "M249",
    "WeapBerylM762_C": "Beryl M762",
    "WeapAK47_C": "AKM",
    "WeapSCAR-L_C": "SCAR-L",
    "WeapACE32_C": "ACE32",
    "WeapAUG_C": "AUG",
    "WeapGroza_C": "Groza",
    "WeapG36C_C": "G36C",
    "WeapQBZ95_C": "QBZ",
    "WeapK2_C": "K2",

    "WeapSKS_C": "SKS",
    "WeapFNFal_C": "SLR",
    "WeapMk12_C": "Mk12",
    "WeapQBU88_C": "QBU",
    "WeapVSS_C": "VSS",

    "WeapKar98k_C": "Kar98k",
    "WeapM24_C": "M24",
    "WeapAWM_C": "AWM",
    "WeapMosinNagant_C": "Mosin",
    "WeapL6_C": "Lynx AMR",

    "WeapVector_C": "Vector",
    "WeapUMP_C": "UMP45",
    "WeapMP5K_C": "MP5K",
    "WeapMP9_C": "MP9",
    "WeapThompson_C": "Tommy Gun",
    "WeapBizonPP19_C": "Bizon",
    "WeapJS9_C": "JS9",

    "WeapDP28_C": "DP-28",
    "WeapMG3_C": "MG3"
};


function nomeBonitoArma(nomeInterno) {

    return nomesArmas[nomeInterno]
        || nomeInterno
            .replace("Weap", "")
            .replace("_C", "");

}


/* =========================================================
   DATA BRASIL
========================================================= */

function dataBrasil(data) {

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(data));

}

/* =========================================================
   JOGADORES ONLINE - STEAM
========================================================= */

async function atualizarJogadoresSteam() {

    const agora = Date.now();

    const cacheSteamValido =
        jogadoresOnline > 0 &&
        (agora - ultimaAtualizacaoSteam) < CACHE_STEAM_TEMPO;

    if (cacheSteamValido) {
        console.log(
            "STEAM CACHE:",
            jogadoresOnline,
            "jogadores"
        );

        return jogadoresOnline;
    }

    try {

        console.log("STEAM - consultando jogadores online");

        const response = await fetch(
            "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=578080"
        );

        if (!response.ok) {
            throw new Error(
                `Steam API HTTP ${response.status}`
            );
        }

        const json = await response.json();

        const quantidade =
            Number(json.response?.player_count);

        if (!Number.isFinite(quantidade)) {
            throw new Error(
                "Steam retornou player_count invalido"
            );
        }

        jogadoresOnline = quantidade;
        ultimaAtualizacaoSteam = agora;

        console.log(
            "STEAM ONLINE:",
            jogadoresOnline
        );

        return jogadoresOnline;

    } catch (error) {

        console.error(
            "STEAM ERRO:",
            error.message
        );

        // Se a Steam falhar, mantém o último valor conhecido.
        return jogadoresOnline;
    }
}

/* =========================================================
   FRONT-END
========================================================= */

app.use(express.static("public"));


/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {

    res.send(`
        <h1>LUCAO PUBG STATS</h1>

        <p>Servidor ONLINE</p>

        <p>
            <a href="/api/hoje">
                API de hoje
            </a>
        </p>

        <p>
            <a href="/overlay.html">
                Overlay
            </a>
        </p>
    `);

});


/* =========================================================
   API DE HOJE
========================================================= */

async function atualizarCache() {

    try {

        console.log("");
        console.log("============================");
        console.log("ATUALIZANDO PUBG STATS");
        console.log("============================");


        /* =================================================
           1. JOGADOR
        ================================================= */

        const playerResponse = await fetch(
            `https://api.pubg.com/shards/steam/players?filter[playerNames]=${encodeURIComponent(PLAYER_NAME)}`,
            {
                headers: pubgHeaders
            }
        );


        if (!playerResponse.ok) {

            throw new Error(
                `PUBG Player API HTTP ${playerResponse.status}`
            );

        }


        const playerJson =
            await playerResponse.json();


        const player =
            playerJson.data[0];


        if (!player) {

            throw new Error(
                "Jogador não encontrado."
            );

        }


        const matchIds =
            player.relationships.matches.data.map(
                match => match.id
            );


        const hoje =
            dataBrasil(new Date());

                    /* =================================================
           RESET DIARIO
        ================================================= */

        if (dataCache !== hoje) {

            console.log(
                "NOVO DIA - limpando cache de partidas"
            );

            partidasProcessadas.clear();
            cacheHoje = null;
            dataCache = hoje;
        }
        


        /* =================================================
           2. CONTADORES
        ================================================= */

        let partidas = 0;
        let kills = 0;
        let damage = 0;
        let dbnos = 0;
        let tempo = 0;

        const armas = {};


        /* =================================================
           3. PARTIDAS DE HOJE
        ================================================= */

        for (const matchId of matchIds) {

    if (partidasProcessadas.has(matchId)) {

        console.log(
            "Partida em cache:",
            matchId
        );

        continue;
    }

    const matchResponse = await fetch(
                `https://api.pubg.com/shards/steam/matches/${matchId}`,
                {
                    headers: {
                        Accept: "application/vnd.api+json"
                    }
                }
            );


            if (!matchResponse.ok) {

                console.log(
                    "Erro lendo partida:",
                    matchId
                );

                continue;

            }


            const match =
                await matchResponse.json();


            const createdAt =
                match.data.attributes.createdAt;


            const dataPartida =
                dataBrasil(createdAt);


            /*
                Como as partidas vêm da mais
                recente para a mais antiga,
                ao chegar em outro dia paramos.
            */

            if (dataPartida !== hoje) {
                break;
            }


            console.log(
                "Partida:",
                matchId
            );


            /* =================================================
               4. STATS DA PARTIDA
            ================================================= */

            const dadosPartida = {
                kills: 0,
                damage: 0,
                dbnos: 0,
                tempo: 0,
                armas: {}
            };


            const participant =
                match.included.find(
                    item =>
                        item.type === "participant" &&
                        item.attributes?.stats?.name === PLAYER_NAME
                );


            if (participant) {

                const stats =
                    participant.attributes.stats;


                                dadosPartida.kills = stats.kills || 0;
                dadosPartida.damage = stats.damageDealt || 0;
                dadosPartida.dbnos = stats.DBNOs || 0;
                dadosPartida.tempo = stats.timeSurvived || 0;

            }


            /* =================================================
               5. TELEMETRIA
            ================================================= */

            const telemetry =
                match.included.find(
                    item =>
                        item.type === "asset" &&
                        item.attributes?.URL
                );


            if (!telemetry) {

                console.log(
                    "Sem telemetria."
                );

                continue;

            }


            const telemetryResponse =
                await fetch(
                    telemetry.attributes.URL
                );


            if (!telemetryResponse.ok) {

                console.log(
                    "Erro lendo telemetria."
                );

                continue;

            }


            const eventos =
                await telemetryResponse.json();


            /* =================================================
               6. KILLS POR ARMA
            ================================================= */

            for (const evento of eventos) {

                if (
                    evento._T !== "LogPlayerKillV2"
                ) {
                    continue;
                }


                if (
                    evento.killer?.name !== PLAYER_NAME
                ) {
                    continue;
                }


                const arma =
                    evento.killerDamageInfo?.damageCauserName
                    ||
                    evento.damageCauserName
                    ||
                    "DESCONHECIDA";


                /*
                    Dacia, queda, explosão etc.
                    não entram como ARMA.
                */

                if (!arma.startsWith("Weap")) {

                    console.log(
                        "Kill especial:",
                        arma
                    );

                    continue;

                }


                if (!armas[arma]) {
                    armas[arma] = 0;
                }


                armas[arma]++;

                                if (!dadosPartida.armas[arma]) {
                    dadosPartida.armas[arma] = 0;
                }

                dadosPartida.armas[arma]++;

            }

            partidasProcessadas.set(
    matchId,
    dadosPartida
);

console.log(
    "Partida salva no cache:",
    matchId
);

        }


               /* =================================================
           6.5 RECONSTRUIR TOTAIS PELO CACHE
        ================================================= */

        partidas = 0;
        kills = 0;
        damage = 0;
        dbnos = 0;
        tempo = 0;

        // Limpa contagem global de armas
        for (const arma of Object.keys(armas)) {
            delete armas[arma];
        }

        for (const dados of partidasProcessadas.values()) {

            partidas++;

            kills += dados.kills;
            damage += dados.damage;
            dbnos += dados.dbnos;
            tempo += dados.tempo;

            for (const [arma, quantidade] of Object.entries(dados.armas)) {

                if (!armas[arma]) {
                    armas[arma] = 0;
                }

                armas[arma] += quantidade;
            }
        } 

        /* =================================================
           7. ARMA PREFERIDA
        ================================================= */

        const rankingArmas =
            Object.entries(armas)
                .sort(
                    (a, b) =>
                        b[1] - a[1]
                );


        let armaPreferida = "-";
        let killsArmaPreferida = 0;


        if (rankingArmas.length > 0) {

            const [
                armaInterna,
                quantidade
            ] = rankingArmas[0];


            armaPreferida =
                nomeBonitoArma(
                    armaInterna
                );


            killsArmaPreferida =
                quantidade;

        }


        /* =================================================
           8. RESULTADO
        ================================================= */

        const resultado = {

    data:
        hoje,

    partidas,

    kills,

    jogadoresOnline,

    damage:
        Math.round(damage),

            dbnos,

            killsPorPartida:
                partidas > 0
                    ? Number(
                        (kills / partidas)
                            .toFixed(2)
                    )
                    : 0,

            damageMedio:
                partidas > 0
                    ? Math.round(
                        damage / partidas
                    )
                    : 0,

            tempoSegundos:
                Math.round(tempo),

            armaPreferida,

            killsArmaPreferida,

            atualizadoEm:
                new Date().toISOString()

        };


        console.log("");
        console.log("RESUMO");

        console.log(
            "Partidas:",
            resultado.partidas
        );

        console.log(
            "Kills:",
            resultado.kills
        );

        console.log(
            "Damage:",
            resultado.damage
        );

        console.log(
            "Arma:",
            resultado.armaPreferida
        );

        console.log(
            "Kills com arma:",
            resultado.killsArmaPreferida
        );


                cacheHoje = resultado;

        return resultado;

    }

    catch (error) {

        console.error(
            "ERRO:",
            error.message
        );


        throw error;

    }

}

/* =========================================================
   API DE HOJE - CACHE
========================================================= */

app.get("/api/hoje", async (req, res) => {

    try {

        const agora = Date.now();

        const cacheValido =
            cacheHoje &&
            (agora - new Date(cacheHoje.atualizadoEm).getTime()) < CACHE_TEMPO;

        // Cache ainda é recente
        if (cacheValido) {

            console.log("CACHE HIT");

            return res.json(cacheHoje);
        }

        // Impede duas atualizações simultâneas
        if (cacheAtualizando) {

            console.log("CACHE ATUALIZANDO");

            if (cacheHoje) {
                return res.json(cacheHoje);
            }

            return res.status(503).json({
                erro: "Estatisticas sendo carregadas."
            });
        }

        cacheAtualizando = true;

        try {

            console.log("CACHE MISS - consultando PUBG API");

            const resultado = await atualizarCache();

            return res.json(resultado);

        } finally {

            cacheAtualizando = false;

        }

    } catch (error) {

        console.error(
            "ERRO API:",
            error.message
        );

        // Se a PUBG API falhar, ainda podemos entregar
        // o último resultado conhecido.
        if (cacheHoje) {

            console.log("USANDO CACHE ANTERIOR");

            return res.json(cacheHoje);
        }

        return res.status(500).json({
            erro: error.message
        });

    }

});


/* =========================================================
   MOTOR DE ATUALIZACAO AUTOMATICA
========================================================= */

async function atualizarAutomaticamente() {

    if (cacheAtualizando) {
        console.log("ATUALIZACAO IGNORADA - ja existe uma em andamento");
        return;
    }

    cacheAtualizando = true;

    try {

        console.log("");
        console.log("AUTO UPDATE - verificando PUBG");

        await atualizarJogadoresSteam();

await atualizarCache();



console.log("AUTO UPDATE - concluido");

    } catch (error) {

        console.error(
            "AUTO UPDATE ERRO:",
            error.message
        );

    } finally {

        cacheAtualizando = false;

    }

}

/* =========================================================
   SERVIDOR
========================================================= */

app.listen(PORT, () => {

    console.log("============================");
    console.log("     LUCAO PUBG STATS");
    console.log("============================");

    console.log("Servidor ONLINE");

    console.log(
        `http://localhost:${PORT}`
    );

    console.log(
        `API: http://localhost:${PORT}/api/hoje`
    );

    console.log("============================");

        // Primeira atualização assim que o servidor iniciar
    atualizarAutomaticamente();

    // Depois atualiza sozinho
    setInterval(
        atualizarAutomaticamente,
        INTERVALO_ATUALIZACAO
    );

});