require("dotenv").config();

const express = require("express");

const app = express();
const PORT = 5051;

const API_KEY = process.env.PUBG_API_KEY;
const PLAYER_NAME = "lucao99999999999";

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

app.get("/api/hoje", async (req, res) => {

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

            const participant =
                match.included.find(
                    item =>
                        item.type === "participant" &&
                        item.attributes?.stats?.name === PLAYER_NAME
                );


            if (participant) {

                const stats =
                    participant.attributes.stats;


                partidas++;


                kills +=
                    stats.kills || 0;


                damage +=
                    stats.damageDealt || 0;


                dbnos +=
                    stats.DBNOs || 0;


                tempo +=
                    stats.timeSurvived || 0;

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


        res.json(resultado);

    }

    catch (error) {

        console.error(
            "ERRO:",
            error.message
        );


        res.status(500).json({
            erro: error.message
        });

    }

});


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

});