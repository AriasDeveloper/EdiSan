/************************************************
 * ADMIN FULL FIXED
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
    confirmAction
} from "./ui.js";

/************************************************
 * INIT
 ************************************************/

export function initAdmin() {

    registerForms();
    initSelector();   // 🔥 FIX CLAVE

}

/************************************************
 * FORMULARIOS
 ************************************************/

function registerForms() {

    const formSan =
        document.getElementById("form-add-san");

    if (formSan) {
        formSan.addEventListener("submit", handleCreateSan);
    }

    const formOferta =
        document.getElementById("form-add-oferta");

    if (formOferta) {
        formOferta.addEventListener("submit", handleCreateOferta);
    }
}

/************************************************
 * SELECTOR ADMIN (🔥 FALTABA ESTO)
 ************************************************/

function initSelector() {

    const selector =
        document.getElementById("admin-san-selector");

    if (!selector) return;

    selector.innerHTML =
        '<option value="">Seleccione un SAN</option>';

    cache.data.sanes.forEach(san => {

        const opt =
            document.createElement("option");

        opt.value = san.id_san;
        opt.textContent = san.nombre_san;

        selector.appendChild(opt);

    });

    selector.addEventListener("change", e => {

        const id = e.target.value;

        if (!id) return;

        renderAdminSan(id);

    });

    // auto load first SAN
    if (cache.data.sanes.length) {

        const first = cache.data.sanes[0].id_san;

        selector.value = first;

        renderAdminSan(first);
    }
}

/************************************************
 * CREAR SAN
 ************************************************/

async function handleCreateSan(e) {

    e.preventDefault();

    try {

        showLoading();

        const data =
            Object.fromEntries(new FormData(e.target));

        await addSan(data);

        showToast("SAN creado");

        location.reload();

    } catch (err) {

        showToast(err.message, "error");

    } finally {

        hideLoading();
    }
}

/************************************************
 * CREAR OFERTA
 ************************************************/

async function handleCreateOferta(e) {

    e.preventDefault();

    try {

        showLoading();

        const data =
            Object.fromEntries(new FormData(e.target));

        await addOferta(data);

        showToast("Oferta creada");

        location.reload();

    } catch (err) {

        showToast(err.message, "error");

    } finally {

        hideLoading();
    }
}

/************************************************
 * RENDER ADMIN SAN (FIXED)
 ************************************************/

export function renderAdminSan(idSan) {

    const san = getSan(idSan);
    const pagos = getPagosSan(idSan);

    const container =
        document.getElementById("admin-container");

    if (!container || !san) return;

    container.innerHTML = `

    <div class="bg-[#0f081f] p-4 rounded-xl mb-4">

        <h2 class="text-xl font-bold">${san.nombre_san}</h2>

        <div class="grid grid-cols-4 gap-2 mt-2 text-sm">

            <div>Cuota: $${san.cuota}</div>
            <div>Frecuencia: ${san.frecuencia}</div>
            <div>Puestos: ${san.total_puestos}</div>
            <div>Inicio: ${san.fecha_inicio}</div>

        </div>

    </div>

    <div class="overflow-auto">

        <table class="w-full text-sm">

            <thead>
                <tr>
                    <th>Ronda</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Pago</th>
                    <th>Beneficiario</th>
                    <th>Entrega</th>
                </tr>
            </thead>

            <tbody>

                ${pagos.map(p => `

                    <tr>

                        <td>${p.ronda}</td>
                        <td>${p.fecha}</td>
                        <td>${p.cliente}</td>

                        <td>
                            <button onclick="togglePago('${idSan}','${p.ronda}','${p.cliente}','${p.estado_pago}')">
                                ${p.estado_pago}
                            </button>
                        </td>

                        <td>${p.beneficiario}</td>
                        <td>${p.estado_entrega}</td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

    </div>

    <button onclick="window.removeSan('${idSan}')"
        class="bg-red-600 px-4 py-2 mt-4 rounded">

        Eliminar SAN

    </button>

    `;
}

/************************************************
 * TOGGLE PAGO
 ************************************************/

window.togglePago = async function (
    idSan,
    ronda,
    cliente,
    estado
) {

    const nuevo =
        estado.includes("Pagado")
            ? "🔴 Pendiente"
            : "🟢 Pagado";

    try {

        await updateCuota({
            id_san: idSan,
            ronda,
            cliente_paga: cliente,
            estado_pago: nuevo
        });

        renderAdminSan(idSan);

    } catch (e) {

        showToast(e.message, "error");
    }
};

/************************************************
 * REMOVE SAN
 ************************************************/

window.removeSan = async function (idSan) {

    const ok = confirmAction("¿Eliminar SAN?");

    if (!ok) return;

    await deleteSan(idSan);

    location.reload();
};