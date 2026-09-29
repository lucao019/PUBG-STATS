let statsAnteriores = null;


function impacto(elemento) {

    elemento.classList.remove("impact");

    void elemento.offsetWidth;

    elemento.classList.add("impact");

}


function atualizarElemento(
    id,
    novoValor,
    valorAnterior
) {

    const elemento =
        document.getElementById(id);


    elemento.textContent =
        novoValor;


    if (
        valorAnterior !== undefined &&
        novoValor !== valorAnterior
    ) {

        impacto(elemento);

    }

}


async function atualizarStats() {

    try {

        const response =
            await fetch(
                "/api/hoje",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const dados =
            await response.json();


        atualizarElemento(
            "kills",
            dados.kills,
            statsAnteriores?.kills
        );


        atualizarElemento(
            "damage",
            dados.damage,
            statsAnteriores?.damage
        );


        atualizarElemento(
            "partidas",
            dados.partidas,
            statsAnteriores?.partidas
        );

        const onlineAtual =
    Number(dados.jogadoresOnline || 0);

const onlineAnterior =
    statsAnteriores?.jogadoresOnline;

atualizarElemento(
    "online",
    onlineAtual.toLocaleString("pt-BR"),
    onlineAnterior !== undefined
        ? Number(onlineAnterior).toLocaleString("pt-BR")
        : undefined
);


        atualizarElemento(
            "arma",
            dados.armaPreferida,
            statsAnteriores?.armaPreferida
        );


        document
            .getElementById("killsArma")
            .textContent =
                dados.killsArmaPreferida;


        statsAnteriores = {

            kills:
                dados.kills,

            damage:
                dados.damage,

            jogadoresOnline:
                dados.jogadoresOnline,

            partidas:
                dados.partidas,

            armaPreferida:
                dados.armaPreferida
                



        };


        console.log(
            "Stats atualizados:",
            dados
        );

    }

    catch (error) {

        console.error(
            "Erro atualizando overlay:",
            error
        );

    }

}


/* PRIMEIRA LEITURA */

atualizarStats();


/* ATUALIZA A CADA 60 SEGUNDOS */

setInterval(
    atualizarStats,
    60000
);