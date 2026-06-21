/************************************************
 * APP
 ************************************************/

import { getData } from "./api.js";

import {
    buildCache,
    cache
} from "./cache.js";

import {
    showLoading,
    hideLoading,
    showToast,
    switchTab,
    loginAdmin
} from "./ui.js";

import {
    initSanes,
    renderSanDetails,
    openRondaModal
} from "./sanes.js";

import {
    renderOfertas,
    orderOferta
} from "./ofertas.js";

import {
    initAdmin,
    renderAdminSan,
    removeSan
} from "./admin.js";

/************************************************
 * INIT
 ************************************************/

document.addEventListener(
    "DOMContentLoaded",
    init
);

/************************************************
 * APP INIT
 ************************************************/

async function init() {

    try {

        showLoading();

        const data =
            await getData();

        buildCache(
            data
        );

        populateSelectors();

        registerEvents();

        initSanes();

        initAdmin();

        renderInitialViews();

    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message,
            "error"
        );

    } finally {

        hideLoading();

    }

}

/************************************************
 * SELECTORES
 ************************************************/

function populateSelectors() {

    populateSanSelector();

    populateAdminSelector();

}

/************************************************
 * SELECTOR SANES
 ************************************************/

function populateSanSelector() {

    const selector =
        document.getElementById(
            "san-selector"
        );

    if (!selector) return;

    selector.innerHTML =
        cache.data.sanes
            .map(san => {

                const id =
                    san.id_san;

                const nombre =
                    san.nombre_san;

                return `

                    <option
                        value="${id}">

                        ${nombre}

                    </option>

                `;

            })
            .join("");

}

/************************************************
 * SELECTOR ADMIN
 ************************************************/

function populateAdminSelector() {

    const selector =
        document.getElementById(
            "admin-san-selector"
        );

    if (!selector) return;

    selector.innerHTML =
        cache.data.sanes
            .map(san => {

                const id =
                    san.id_san;

                const nombre =
                    san.nombre_san;

                return `

                    <option
                        value="${id}">

                        ${nombre}

                    </option>

                `;

            })
            .join("");

}

/************************************************
 * EVENTOS
 ************************************************/

function registerEvents() {

    registerTabs();

    registerAdminButton();

    registerAdminSelector();

}

/************************************************
 * TABS
 ************************************************/

function registerTabs() {

    document
        .querySelectorAll(
            ".tab-btn"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => {

                    switchTab(
                        btn.dataset.tab
                    );

                }
            );

        });

}

/************************************************
 * ADMIN LOGIN
 ************************************************/

function registerAdminButton() {

    const btn =
        document.getElementById(
            "btn-admin"
        );

    if (!btn) return;

    btn.addEventListener(
        "click",
        () => {

            loginAdmin();

        }
    );

}

/************************************************
 * ADMIN SELECTOR
 ************************************************/

function registerAdminSelector() {

    const selector =
        document.getElementById(
            "admin-san-selector"
        );

    if (!selector) return;

    selector.addEventListener(
        "change",
        () => {

            renderAdminSan(
                selector.value
            );

        }
    );

}

/************************************************
 * RENDER INICIAL
 ************************************************/

function renderInitialViews() {

    if (
        cache.data.sanes.length
    ) {

        renderSanDetails(
            cache.data.sanes[0]
                .id_san
        );

    }

    renderOfertas(
        cache.data.ofertas
    );

    switchTab(
        "sanes"
    );

}

/************************************************
 * FUNCIONES GLOBALES
 ************************************************/

window.openRondaModal =
    openRondaModal;

window.removeSan =
    removeSan;

window.orderOferta =
    (id) =>
        orderOferta(
            id,
            cache.data.ofertas
        );