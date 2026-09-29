require("dotenv").config();

const API_KEY = process.env.PUBG_API_KEY;
const PLAYER_NAME = "lucao99999999999";

const headers = {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "application/vnd.api+json"
};

// Retorna YYYY-MM-DD no horário de Brasília
function dataBrasil(data) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(data));
}

async function main() {
    console.log("============================");
    console.log("     LUCAO PUBG - HOJE");
    console.log("============================\n");

    // 1. Busca o jogador
    const playerResponse = await fetch(
        `https://api.pubg.com/shards/steam/players?filter[playerNames]=${encodeURIComponent(PLAYER_NAME)}`,
        { headers }
    );

    if (!playerResponse.ok) {
        throw new Error(
            `Erro buscando jogador: HTTP ${playerResponse.status}`
        );
    }

    const playerJson = await playerResponse.json();
    const player = playerJson.data[0];

    if (!player) {
        throw new Error("Jogador não encontrado.");
    }

    const matchIds = player.relationships.matches.data.map(
        match => match.id
    );

    const hoje = dataBrasil(new Date());

    console.log("Jogador:", PLAYER_NAME);
    console.log("Data:", hoje);
    console.log("Partidas recentes disponíveis:", matchIds.length);
    console.log("\nProcurando partidas de hoje...\n");

    let partidas = 0;
    let kills = 0;
    let damage = 0;
    let wins = 0;
    let dbnos = 0;
    let tempo = 0;

    // 2. Abre cada partida recente
    for (const matchId of matchIds) {
        const response = await fetch(
            `https://api.pubg.com/shards/steam/matches/${matchId}`,
            {
                headers: {
                    Accept: "application/vnd.api+json"
                }
            }
        );

        if (!response.ok) {
            console.log(
                `Ignorando ${matchId}: HTTP ${response.status}`
            );
            continue;
        }

        const match = await response.json();

        const createdAt = match.data.attributes.createdAt;

        // Só queremos partidas de hoje
        if (dataBrasil(createdAt) !== hoje) {
            continue;
        }

        // Procura nosso jogador dentro da partida
        const participant = match.included.find(
            item =>
                item.type === "participant" &&
                item.attributes.stats.name === PLAYER_NAME
        );

        if (!participant) {
            continue;
        }

        const stats = participant.attributes.stats;

        partidas++;
        kills += stats.kills || 0;
        damage += stats.damageDealt || 0;
        dbnos += stats.DBNOs || 0;
        tempo += stats.timeSurvived || 0;

        if (stats.winPlace === 1) {
            wins++;
        }

        console.log(
            `#${partidas}`,
            `Kills: ${stats.kills}`,
            `Damage: ${Math.round(stats.damageDealt)}`,
            `Place: ${stats.winPlace}`
        );
    }

    // 3. Calcula médias
    const killsPorPartida =
        partidas > 0 ? kills / partidas : 0;

    const damageMedio =
        partidas > 0 ? damage / partidas : 0;

    // 4. Resultado
    console.log("\n============================");
    console.log("       RESUMO DE HOJE");
    console.log("============================");

    console.log("Partidas:", partidas);
    console.log("Kills:", kills);
    console.log("Damage:", Math.round(damage));
    console.log("WWCD:", wins);
    console.log("DBNOs:", dbnos);

    console.log(
        "Kills/partida:",
        killsPorPartida.toFixed(2)
    );

    console.log(
        "Damage médio:",
        damageMedio.toFixed(0)
    );

    console.log(
        "Tempo em partida:",
        `${Math.floor(tempo / 3600)}h ${Math.floor((tempo % 3600) / 60)}min`
    );

    console.log("============================");
}

main().catch(error => {
    console.error("\nERRO:", error.message);
});