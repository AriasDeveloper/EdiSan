/************************************************
 * OFERTAS
 ************************************************/

import { CONFIG } from "./config.js";

import {
    escapeHtml,
    money
} from "./ui.js";

/************************************************
 * RENDER OFERTAS
 ************************************************/

export function renderOfertas(
    ofertas = []
) {

    const container =
        document.getElementById(
            "ofertas-container"
        );

    if (!container) return;

    if (!ofertas.length) {

        container.innerHTML = `

            <div
                class="col-span-full
                       text-center
                       text-purple-400
                       py-10">

                No hay ofertas disponibles.

            </div>

        `;

        return;
    }

    container.innerHTML =
        ofertas.map(oferta =>
            createOfertaCard(oferta)
        ).join("");

}

/************************************************
 * CARD
 ************************************************/

function createOfertaCard(
    oferta
) {

    const id =
        oferta.id_oferta ||
        oferta.id ||
        "";

    const producto =
        escapeHtml(
            oferta.producto
        );

    const descripcion =
        escapeHtml(
            oferta.descripcion || ""
        );

    const precio =
        money(
            oferta.precio_oferta
        );

    const disponibilidad =
        escapeHtml(
            oferta.disponibilidad || ""
        );

    const img =
        oferta.imgurl ||
        oferta.imgUrl ||
        "";

    return `

        <div
            class="bg-[#170f2c]
                   rounded-2xl
                   overflow-hidden
                   border
                   border-purple-900/30">

            <div
                class="h-52
                       bg-[#0f081f]
                       overflow-hidden">

                ${
                    img
                    ? `
                    <img
                        src="${img}"
                        alt="${producto}"
                        class="w-full
                               h-full
                               object-cover">
                    `
                    : `
                    <div
                        class="w-full
                               h-full
                               flex
                               items-center
                               justify-center">

                        <i
                            class="fa-solid
                                   fa-image
                                   text-4xl
                                   text-purple-700">
                        </i>

                    </div>
                    `
                }

            </div>

            <div
                class="p-4">

                <h3
                    class="font-bold
                           text-lg
                           mb-2">

                    ${producto}

                </h3>

                <p
                    class="text-sm
                           text-purple-300
                           mb-4">

                    ${descripcion}

                </p>

                <div
                    class="flex
                           justify-between
                           items-center
                           mb-4">

                    <div
                        class="text-xl
                               font-bold">

                        $${precio}

                    </div>

                    <div
                        class="text-xs
                               text-green-400">

                        ${disponibilidad}

                    </div>

                </div>

                <button

                    onclick="window.orderOferta('${id}')"

                    class="w-full
                           bg-green-600
                           hover:bg-green-500
                           rounded-xl
                           py-3
                           font-bold">

                    <i
                        class="fa-brands
                               fa-whatsapp">
                    </i>

                    Pedir

                </button>

            </div>

        </div>

    `;
}

/************************************************
 * PEDIDO
 ************************************************/

export function orderOferta(
    idOferta,
    ofertas = []
) {

    const oferta =
        ofertas.find(o => {

            const id =
                o.id_oferta ||
                o.id;

            return (
                String(id) ===
                String(idOferta)
            );

        });

    if (!oferta) return;

    const mensaje =
`
Hola 👋

Estoy interesado en la siguiente oferta:

Producto:
${oferta.producto}

Precio:
$${oferta.precio_oferta}

¿Sigue disponible?
`;

    const url =
        `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=` +
        encodeURIComponent(
            mensaje
        );

    window.open(
        url,
        "_blank"
    );

}