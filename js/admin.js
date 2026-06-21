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

export function renderAdminSan(idSan) {

    const san =
        getSan(idSan);

    if (!san) return;

    const pagos =
        getPagosSan(idSan);

    const container =
        document.getElementById(
            "admin-container"
        );

    container.innerHTML = `

    <div class="bg-[#0f081f] p-4 rounded-xl mb-4">

        <h3 class="text-xl font-bold mb-2">
            ${san.nombre_san}
        </h3>

        <div class="grid md:grid-cols-4 gap-3">

            <div>
                <strong>Cuota:</strong><br>
                $${san.cuota}
            </div>

            <div>
                <strong>Frecuencia:</strong><br>
                ${san.frecuencia}
            </div>

            <div>
                <strong>Puestos:</strong><br>
                ${san.total_puestos}
            </div>

            <div>
                <strong>Inicio:</strong><br>
                ${san.fecha_inicio}
            </div>

        </div>

    </div>

    <div class="overflow-auto">

        <table class="w-full text-sm">

            <thead>

                <tr class="border-b border-purple-700">

                    <th class="p-2">Ronda</th>
                    <th class="p-2">Fecha</th>
                    <th class="p-2">Cliente</th>
                    <th class="p-2">Pago</th>
                    <th class="p-2">Beneficiario</th>
                    <th class="p-2">Entrega</th>

                </tr>

            </thead>

            <tbody>

                ${pagos.map(p => `

                    <tr class="border-b border-slate-800">

                        <td class="p-2">
                            ${p.ronda}
                        </td>

                        <td class="p-2">
                            ${p.fecha}
                        </td>

                        <td class="p-2">
                            ${p.cliente}
                        </td>

                        <td class="p-2">

                            <button
                                class="bg-slate-700 px-2 py-1 rounded"
                                onclick="togglePago(
                                    '${idSan}',
                                    '${p.ronda}',
                                    '${p.cliente}',
                                    '${p.estado_pago}'
                                )">

                                ${p.estado_pago}

                            </button>

                        </td>

                        <td class="p-2">

                            ${p.beneficiario}

                        </td>

                        <td class="p-2">

                            ${p.estado_entrega}

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

    </div>

    <div class="mt-4">

        <button
            onclick="window.removeSan('${idSan}')"
            class="bg-red-600 px-4 py-2 rounded-xl">

            Eliminar SAN

        </button>

    </div>

    `;
}