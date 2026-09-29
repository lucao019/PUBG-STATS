require("dotenv").config();

const API_KEY = process.env.PUBG_API_KEY;
const PLAYER_ID = "account.7641e5c08a8a4a9bbc8c67b2faaf208f";

async function main() {
    const url =
        `https://api.pubg.com/shards/steam/players/${PLAYER_ID}/seasons/lifetime`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            Accept: "application/vnd.api+json"
        }
    });

    console.log("HTTP:", response.status);

    if (!response.ok) {
        console.log(await response.text());
        return;
    }

    const json = await response.json();

    console.log("\n============================");
    console.log("   PUBG LIFETIME COMPLETO");
    console.log("============================\n");

    console.dir(json, {
        depth: null,
        colors: true
    });
}

main().catch(console.error);