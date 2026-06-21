/************************************************
 * CACHE GLOBAL
 ************************************************/

export const cache = {

    loaded: false,

    data: {
        sanes: [],
        pagos: [],
        ofertas: []
    },

    sanesMap: {},

    pagosPorSan: {},

    rondasPorSan: {},

    clientes: [],

    clientesMap: {}

};

/************************************************
 * CONSTRUIR CACHE
 ************************************************/

export function buildCache(data) {

    cache.data = data;

    cache.sanesMap = {};

    cache.pagosPorSan = {};

    cache.rondasPorSan = {};

    cache.clientesMap = {};

    const clientesSet = new Set();

    /********************************************
     * SANES
     ********************************************/

    data.sanes.forEach(san => {

        const id =
            san.id_san ||
            san.id;

        cache.sanesMap[id] = san;

    });

    /********************************************
     * PAGOS
     ********************************************/

    data.pagos.forEach(pago => {

        const id =
            pago.id_san ||
            pago.id;

        if (!cache.pagosPorSan[id]) {

            cache.pagosPorSan[id] = [];

        }

        cache.pagosPorSan[id].push(
            pago
        );

        const ronda =
            Number(
                pago.ronda
            );

        if (
            !cache.rondasPorSan[id]
        ) {

            cache.rondasPorSan[id] = {};

        }

        if (
            !cache.rondasPorSan[id][ronda]
        ) {

            cache.rondasPorSan[id][ronda] = [];

        }

        cache.rondasPorSan[id][ronda]
            .push(pago);

        const cliente =
            String(
                pago.cliente || ""
            ).trim();

        if (
            cliente &&
            !cliente.startsWith("Cliente ")
        ) {

            clientesSet.add(
                cliente
            );

            if (
                !cache.clientesMap[
                    cliente
                ]
            ) {

                cache.clientesMap[
                    cliente
                ] = [];

            }

            cache.clientesMap[
                cliente
            ].push(pago);

        }

    });

    cache.clientes =
        [...clientesSet]
        .sort((a, b) =>
            a.localeCompare(b)
        );

    cache.loaded = true;

    return cache;
}

/************************************************
 * GET SAN
 ************************************************/

export function getSan(idSan) {

    return (
        cache.sanesMap[idSan] ||
        null
    );

}

/************************************************
 * PAGOS DE UN SAN
 ************************************************/

export function getPagosSan(idSan) {

    return (
        cache.pagosPorSan[idSan] ||
        []
    );

}

/************************************************
 * RONDAS DE UN SAN
 ************************************************/

export function getRondasSan(idSan) {

    return (
        cache.rondasPorSan[idSan] ||
        {}
    );

}

/************************************************
 * HISTORIAL CLIENTE
 ************************************************/

export function getClienteHistorial(
    nombre
) {

    return (
        cache.clientesMap[nombre] ||
        []
    );

}