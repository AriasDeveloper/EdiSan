/************************************************
 * ADMIN
 ************************************************/

import {
    addSan,
    deleteSan,
    addOferta,
    updateCuota,
    updateClienteNombre,
    updateBeneficiario,
    updateEstadoEntrega,
    recascadeFechas
} from "./api.js";

import {
    cache,
    getSan,
    getPagosSan
} from "./cache.js";

import {
    showToast,
    showLoading,
    hideLoading,
    confirmAction,
    escapeHtml
} from "./ui.js";

/************************************************
 * INIT
 ************************************************/

export function initAdmin() {

    registerForms();

}

/************************************************
 * FORMULARIOS
 ************************************************/

function registerForms() {

    const formSan =
        document.getElementById(
            "form-add-san"
        );

    if (formSan) {

        formSan.addEventListener(
            "submit",
            handleCreateSan
        );

    }

    const formOferta =
        document.getElementById(
            "form-add-oferta"
        );

    if (formOferta) {

        formOferta.addEventListener(
            "submit",
            handleCreateOferta
        );

    }

}

/************************************************
 * CREAR SAN
 ************************************************/

async function handleCreateSan(
    e
) {

    e.preventDefault();

    try {

        showLoading();

        const form =
            e.target;

        const data =
            Object.fromEntries(
                new FormData(form)
            );

        await addSan(data);

        showToast(
            "SAN creado correctamente"
        );

        form.reset();

        window.location.reload();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    } finally {

        hideLoading();

    }

}

/************************************************
 * CREAR OFERTA
 ************************************************/

async function handleCreateOferta(
    e
) {

    e.preventDefault();

    try {

        showLoading();

        const form =
            e.target;

        const data =
            Object.fromEntries(
                new FormData(form)
            );

        await addOferta(data);

        showToast(
            "Oferta agregada"
        );

        form.reset();

        window.location.reload();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    } finally {

        hideLoading();

    }

}

/************************************************
 * ELIMINAR SAN
 ************************************************/

export async function removeSan(
    idSan
) {

    const san =
        getSan(idSan);

    if (!san) return;

    const ok =
        confirmAction(
            `Eliminar SAN "${san.nombre_san}" ?`
        );

    if (!ok) return;

    try {

        showLoading();

        await deleteSan(
            idSan
        );

        showToast(
            "SAN eliminado"
        );

        window.location.reload();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    } finally {

        hideLoading();

    }

}

/************************************************
 * ACTUALIZAR PAGO
 ************************************************/

export async function setPagoEstado(
    {
        id_san,
        ronda,
        cliente_paga,
        estado_pago
    }
) {

    try {

        await updateCuota({

            id_san,
            ronda,
            cliente_paga,
            estado_pago

        });

        showToast(
            "Pago actualizado"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}

/************************************************
 * RENOMBRAR CLIENTE
 ************************************************/

export async function renameCliente(
    {
        id_san,
        nombre_viejo,
        nombre_nuevo
    }
) {

    try {

        await updateClienteNombre({

            id_san,
            nombre_viejo,
            nombre_nuevo

        });

        showToast(
            "Cliente actualizado"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}

/************************************************
 * BENEFICIARIO
 ************************************************/

export async function setBeneficiario(
    {
        id_san,
        ronda,
        beneficiario
    }
) {

    try {

        await updateBeneficiario({

            id_san,
            ronda,
            beneficiario

        });

        showToast(
            "Beneficiario actualizado"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}

/************************************************
 * ENTREGA
 ************************************************/

export async function setEntregaEstado(
    {
        id_san,
        ronda,
        estado_entrega
    }
) {

    try {

        await updateEstadoEntrega({

            id_san,
            ronda,
            estado_entrega

        });

        showToast(
            "Entrega actualizada"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}

/************************************************
 * RECALCULAR FECHAS
 ************************************************/

export async function recalcularFechas(
    {
        id_san,
        fecha_inicio,
        frecuencia
    }
) {

    try {

        showLoading();

        await recascadeFechas({

            id_san,
            fecha_inicio,
            frecuencia

        });

        showToast(
            "Fechas actualizadas"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    } finally {

        hideLoading();

    }

}

/************************************************
 * PANEL ADMIN
 ************************************************/

export function renderAdminSan(
    idSan
) {

    const san =
        getSan(idSan);

    if (!san) return;

    const pagos =
        getPagosSan(idSan);

    const container =
        document.getElementById(
            "admin-container"
        );

    if (!container) return;

    container.innerHTML = `

        <div
            class="bg-[#170f2c]
                   rounded-2xl
                   p-5">

            <h2
                class="text-xl
                       font-bold
                       mb-4">

                ${escapeHtml(
                    san.nombre_san
                )}

            </h2>

            <div
                class="grid
                       md:grid-cols-4
                       gap-3">

                <div>
                    Cuota:
                    ${san.cuota}
                </div>

                <div>
                    Frecuencia:
                    ${escapeHtml(
                        san.frecuencia
                    )}
                </div>

                <div>
                    Puestos:
                    ${san.total_puestos}
                </div>

                <div>
                    Registros:
                    ${pagos.length}
                </div>

            </div>

            <div
                class="mt-5">

                <button

                    onclick="window.removeSan('${idSan}')"

                    class="bg-red-600
                           hover:bg-red-500
                           px-4
                           py-2
                           rounded-xl">

                    Eliminar SAN

                </button>

            </div>

        </div>

    `;

}