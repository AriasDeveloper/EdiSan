/************************************************
 * API
 ************************************************/

import { CONFIG } from "./config.js";

/************************************************
 * TIMEOUT
 ************************************************/

const REQUEST_TIMEOUT = 15000;

/************************************************
 * FETCH CON TIMEOUT
 ************************************************/

async function fetchWithTimeout(
    url,
    options = {}
) {

    const controller =
        new AbortController();

    const timer =
        setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT
        );

    try {

        const response =
            await fetch(
                url,
                {
                    ...options,
                    signal:
                        controller.signal
                }
            );

        clearTimeout(timer);

        return response;

    } catch (error) {

        clearTimeout(timer);

        throw error;

    }
}

/************************************************
 * GET DATA
 ************************************************/

export async function getData() {

    try {

        const response =
            await fetchWithTimeout(
                CONFIG.API_URL
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data =
            await response.json();

        return data;

    } catch (error) {

        console.error(
            "GET ERROR:",
            error
        );

        throw new Error(
            "No fue posible cargar la información."
        );

    }
}

/************************************************
 * POST
 ************************************************/

export async function postAction(
    payload
) {

    try {

        const response =
            await fetchWithTimeout(
                CONFIG.API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const result =
            await response.json();

        if (
            result.status === false
        ) {

            throw new Error(
                result.error ||
                "Error desconocido"
            );

        }

        return result;

    } catch (error) {

        console.error(
            "POST ERROR:",
            error
        );

        throw error;

    }
}

/************************************************
 * SANES
 ************************************************/

export async function addSan(
    data
) {

    return postAction({

        action: "addSan",

        ...data

    });

}

/************************************************
 * PAGOS
 ************************************************/

export async function updateCuota(
    data
) {

    return postAction({

        action:
            "updateCuota",

        ...data

    });

}

/************************************************
 * CLIENTE
 ************************************************/

export async function updateClienteNombre(
    data
) {

    return postAction({

        action:
            "updateClienteNombre",

        ...data

    });

}

/************************************************
 * BENEFICIARIO
 ************************************************/

export async function updateBeneficiario(
    data
) {

    return postAction({

        action:
            "updateBeneficiario",

        ...data

    });

}

/************************************************
 * ENTREGA
 ************************************************/

export async function updateEstadoEntrega(
    data
) {

    return postAction({

        action:
            "updateEstadoEntrega",

        ...data

    });

}

/************************************************
 * ELIMINAR SAN
 ************************************************/

export async function deleteSan(
    id_san
) {

    return postAction({

        action:
            "deleteSan",

        id_san

    });

}

/************************************************
 * RECALCULAR FECHAS
 ************************************************/

export async function recascadeFechas(
    data
) {

    return postAction({

        action:
            "recascadeFechas",

        ...data

    });

}

/************************************************
 * OFERTAS
 ************************************************/

export async function addOferta(
    data
) {

    return postAction({

        action:
            "addOferta",

        ...data

    });

}