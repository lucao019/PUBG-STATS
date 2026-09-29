require("dotenv").config();

const API_KEY = process.env.PUBG_API_KEY;
const PLAYER_NAME = "lucao99999999999";

async function main() {
    // 1. Busca seu jogador
    const playerResponse = await fetch(
        `https://api.pubg.com/shards/steam/players?filter[playerNames]=${PLAYER_NAME}`,
        {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                Accept: "application/vnd.api+json"
            }
        }
    );

    const playerData = await playerResponse.json();
    const player = playerData.data[0];

    console.log("Jogador:", player.attributes.name);

    // 2. Pega a partida mais recente
    const matchId = player.relationships.matches.data[0].id;

    console.log("Última partida:", matchId);

    // 3. Busca os dados dessa partida
    const matchResponse = await fetch(
        `https://api.pubg.com/shards/steam/matches/${matchId}`,
        {
            headers: {
                Accept: "application/vnd.api+json"
            }
        }
    );

    const matchData = await matchResponse.json();

    // 4. Procura você dentro da partida
    const participant = matchData.included.find(
        item =>
            item.type === "participant" &&
            item.attributes.stats.name === PLAYER_NAME
    );

    if (!participant) {
        console.log("Jogador não encontrado dentro da partida.");
        return;
    }

    const stats = participant.attributes.stats;

    console.log("\n=== ÚLTIMA PARTIDA ===");
    console.log("Kills:", stats.kills);
    console.log("Damage:", Math.round(stats.damageDealt));
    console.log("Colocação:", stats.winPlace);
    console.log("DBNOs:", stats.DBNOs);
    console.log("Tempo vivo:", Math.round(stats.timeSurvived / 60), "min");
}

main().catch(console.error);