require("dotenv").config();

const API_KEY = process.env.PUBG_API_KEY;

// Coloque exatamente seu nome dentro do PUBG
const PLAYER_NAME = "lucao99999999999";

async function testarAPI() {
    console.log("=== TESTE PUBG API ===");
    console.log(`Procurando jogador: ${PLAYER_NAME}`);

    try {
        const url =
            `https://api.pubg.com/shards/steam/players?filter[playerNames]=${encodeURIComponent(PLAYER_NAME)}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                Accept: "application/vnd.api+json"
            }
        });

        console.log(`HTTP: ${response.status}`);

        if (!response.ok) {
            const erro = await response.text();
            console.log("Resposta da API:");
            console.log(erro);
            return;
        }

        const json = await response.json();

        if (!json.data || json.data.length === 0) {
            console.log("Jogador não encontrado.");
            return;
        }

        const player = json.data[0];

        console.log("\n=== JOGADOR ENCONTRADO ===");
        console.log("Nome:", player.attributes.name);
        console.log("Player ID:", player.id);
        console.log("Shard:", player.attributes.shardId);
        console.log("Partidas disponíveis:", player.relationships.matches.data.length);

    } catch (erro) {
        console.error("ERRO:", erro.message);
    }
}

testarAPI();