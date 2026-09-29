require("dotenv").config();

const API_KEY = process.env.PUBG_API_KEY;
const PLAYER_NAME = "lucao99999999999";

const headers = {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "application/vnd.api+json"
};


/* ========================================
   NOMES DAS ARMAS
======================================== */

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


/* ========================================
   DATA BRASIL
======================================== */

function dataBrasil(data) {

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(data));

}


/* ========================================
   PROGRAMA
======================================== */

async function main() {

    console.log("============================");
    console.log("      ARMA DO DIA");
    console.log("============================");


    /* 1. BUSCAR JOGADOR */

    const playerResponse = await fetch(
        `https://api.pubg.com/shards/steam/players?filter[playerNames]=${encodeURIComponent(PLAYER_NAME)}`,
        {
            headers
        }
    );


    if (!playerResponse.ok) {

        throw new Error(
            `Player API HTTP ${playerResponse.status}`
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


    console.log("Jogador:", PLAYER_NAME);
    console.log("Data:", hoje);
    console.log("");


    const armas = {};


    /* ========================================
       2. PARTIDAS DE HOJE
    ======================================== */

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
            continue;
        }


        const match =
            await matchResponse.json();


        const createdAt =
            match.data.attributes.createdAt;


        const dataPartida =
            dataBrasil(createdAt);


        // chegou nas partidas de ontem
        if (dataPartida !== hoje) {
            break;
        }


        console.log(
            "Analisando partida:",
            matchId
        );


        /* ========================================
           3. LOCALIZAR TELEMETRIA
        ======================================== */

        const telemetry =
            match.included.find(
                item =>
                    item.type === "asset" &&
                    item.attributes?.URL
            );


        if (!telemetry) {

            console.log(
                "Telemetria não encontrada."
            );

            continue;

        }


        /* ========================================
           4. BAIXAR TELEMETRIA
        ======================================== */

        const telemetryResponse =
            await fetch(
                telemetry.attributes.URL
            );


        if (!telemetryResponse.ok) {

            console.log(
                "Erro buscando telemetria."
            );

            continue;

        }


        const eventos =
            await telemetryResponse.json();


        /* ========================================
           5. PROCURAR KILLS
        ======================================== */

        for (const evento of eventos) {

            if (
                evento._T !== "LogPlayerKillV2"
            ) {
                continue;
            }


            const killerName =
                evento.killer?.name;


            if (
                killerName !== PLAYER_NAME
            ) {
                continue;
            }


            const arma =
                evento.killerDamageInfo?.damageCauserName
                ||
                evento.damageCauserName
                ||
                "DESCONHECIDA";


            /* =====================================
               IGNORAR VEÍCULOS / OUTRAS CAUSAS
            ===================================== */

            if (!arma.startsWith("Weap")) {

                console.log(
                    "KILL ESPECIAL:",
                    arma
                );

                continue;

            }


            /* =====================================
               CONTAR ARMA
            ===================================== */

            if (!armas[arma]) {
                armas[arma] = 0;
            }


            armas[arma]++;


            console.log(
                "KILL:",
                nomeBonitoArma(arma)
            );

        }

    }


    /* ========================================
       6. RANKING
    ======================================== */

    console.log("");
    console.log("============================");
    console.log("      KILLS POR ARMA");
    console.log("============================");


    const ranking =
        Object.entries(armas)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    for (const [arma, kills] of ranking) {

        console.log(
            `${nomeBonitoArma(arma)}: ${kills}`
        );

    }


    /* ========================================
       7. ARMA DO DIA
    ======================================== */

    if (ranking.length === 0) {

        console.log("");
        console.log(
            "Nenhuma kill com arma encontrada."
        );

        return;

    }


    const [
        armaPreferida,
        kills
    ] = ranking[0];


    console.log("");
    console.log("============================");
    console.log("       ARMA DO DIA");
    console.log("============================");

    console.log(
        `${nomeBonitoArma(armaPreferida)} - ${kills} KILLS`
    );

}


/* ========================================
   EXECUTAR
======================================== */

main().catch(error => {

    console.error(
        "ERRO:",
        error.message
    );

});