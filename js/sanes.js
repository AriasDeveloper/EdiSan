/************************************************
 * SANES
 ************************************************/

import {
    getSan,
    getPagosSan,
    getRondasSan,
    getClienteHistorial
} from "./cache.js";

import {
    escapeHtml,
    money,
    formatDate,
    showToast
} from "./ui.js";

/************************************************
 * SAN ACTUAL
 ************************************************/

let currentSanId = null;

/************************************************
 * INIT
 ************************************************/

export function initSanes() {

    const selector =
        document.getElementById(
            "san-selector"
        );

    if (!selector) return;

    selector.addEventListener(
        "change",
        () => {

            renderSanDetails(
                selector.value
            );

        }
    );

}

/************************************************
 * RENDER SAN
 ************************************************/

export function renderSanDetails(
    idSan
) {

    if (!idSan) {

        const selector =
            document.getElementById(
                "san-selector"
            );

        if (!selector) return;

        idSan =
            selector.value;
    }

    currentSanId =
        idSan;

    const san =
        getSan(idSan);

    if (!san) return;

    renderSanHeader(
        san
    );

    renderRondas(
        idSan
    );

}

/************************************************
 * CABECERA
 ************************************************/

function renderSanHeader(
    san
) {

    const container =
        document.getElementById(
            "san-details"
        );

    if (!container) return;

    container.innerHTML = `

        <div
            class="bg-[#170f2c]
                   rounded-2xl
                   p-5
                   mb-4">

            <h2
                class="text-xl
                       font-bold
                       mb-3">

                ${escapeHtml(
                    san.nombre_san
                )}

            </h2>

            <div
                class="grid
                       md:grid-cols-4
                       gap-3">

                <div>

                    <div class="text-purple-400">
                        Cuota
                    </div>

                    <div>
                        $${money(
                            san.cuota
                        )}
                    </div>

                </div>

                <div>

                    <div class="text-purple-400">
                        Frecuencia
                    </div>

                    <div>
                        ${escapeHtml(
                            san.frecuencia
                        )}
                    </div>

                </div>

                <div>

                    <div class="text-purple-400">
                        Puestos
                    </div>

                    <div>
                        ${escapeHtml(
                            san.total_puestos
                        )}
                    </div>

                </div>

                <div>

                    <div class="text-purple-400">
                        Inicio
                    </div>

                    <div>
                        ${formatDate(
                            san.fecha_inicio
                        )}
                    </div>

                </div>

            </div>

        </div>

    `;
}

/************************************************
 * RONDAS
 ************************************************/

function renderRondas(
    idSan
) {

    const container =
        document.getElementById(
            "client-puestos-container"
        );

    if (!container) return;

    const rondas =
        getRondasSan(
            idSan
        );

    const html =
        Object.entries(
            rondas
        )
        .sort(
            (a, b) =>
                Number(a[0]) -
                Number(b[0])
        )
        .map(
            ([ronda, pagos]) => {

                const total =
                    pagos.length;

                const pagados =
                    pagos.filter(
                        p =>
                        String(
                            p.estado_pago
                        ).includes(
                            "Pagado"
                        )
                    ).length;

                const porcentaje =
                    total
                        ? Math.round(
                            (pagados * 100)
                            / total
                        )
                        : 0;

                const fecha =
                    pagos[0]?.fecha ||
                    "";

                return `

                <div
                    class="bg-[#170f2c]
                           rounded-2xl
                           p-4
                           cursor-pointer
                           hover:border-purple-500
                           border
                           border-transparent"

                    onclick="window.openRondaModal('${idSan}',${ronda})">

                    <div
                        class="flex
                               justify-between
                               mb-2">

                        <div
                            class="font-bold">

                            Ronda ${ronda}

                        </div>

                        <div
                            class="text-xs">

                            ${porcentaje}%

                        </div>

                    </div>

                    <div
                        class="text-xs
                               text-purple-400
                               mb-3">

                        ${formatDate(
                            fecha
                        )}

                    </div>

                    <div
                        class="w-full
                               h-2
                               bg-[#0f081f]
                               rounded-full">

                        <div
                            class="h-2
                                   rounded-full
                                   bg-purple-600"

                            style="
                                width:${porcentaje}%;
                            ">
                        </div>

                    </div>

                    <div
                        class="mt-3
                               text-sm">

                        ${pagados}
                        /
                        ${total}
                        Pagados

                    </div>

                </div>

                `;
            }
        )
        .join("");

    container.innerHTML =
        html;

}

/************************************************
 * MODAL RONDA
 ************************************************/

export function openRondaModal(
    idSan,
    ronda
) {

    const rondas =
        getRondasSan(
            idSan
        );

    const pagos =
        rondas[ronda] || [];

    const rows =
        pagos.map(p => {

            return `

            <tr
                class="border-b
                       border-purple-900">

                <td
                    class="p-2">

                    ${escapeHtml(
                        p.cliente
                    )}

                </td>

                <td
                    class="p-2">

                    ${escapeHtml(
                        p.estado_pago
                    )}

                </td>

            </tr>

            `;

        })
        .join("");

    const popup =
        window.open(
            "",
            "_blank",
            "width=700,height=700"
        );

    popup.document.write(`

        <html>

        <head>

            <title>
                Ronda ${ronda}
            </title>

        </head>

        <body>

            <h2>
                Ronda ${ronda}
            </h2>

            <table
                border="1"
                width="100%">

                <tr>

                    <th>
                        Cliente
                    </th>

                    <th>
                        Estado
                    </th>

                </tr>

                ${rows}

            </table>

        </body>

        </html>

    `);

}

/************************************************
 * HISTORIAL CLIENTE
 ************************************************/

export function showClientHistory(
    nombre
) {

    const historial =
        getClienteHistorial(
            nombre
        );

    if (
        !historial.length
    ) {

        showToast(
            "Sin historial",
            "warning"
        );

        return;
    }

    console.table(
        historial
    );

}