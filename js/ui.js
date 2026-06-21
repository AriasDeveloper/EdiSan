/************************************************
 * UI
 ************************************************/

import { CONFIG } from "./config.js";

/************************************************
 * SELECTOR HELPERS
 ************************************************/

export const $ = (selector) =>
    document.querySelector(selector);

export const $$ = (selector) =>
    document.querySelectorAll(selector);

/************************************************
 * LOADING
 ************************************************/

export function showLoading() {

    const el =
        $("#loading");

    if (!el) return;

    el.classList.remove(
        "hidden"
    );

}

export function hideLoading() {

    const el =
        $("#loading");

    if (!el) return;

    el.classList.add(
        "hidden"
    );

}

/************************************************
 * TOAST
 ************************************************/

let toastTimer = null;

export function showToast(
    message,
    type = "success"
) {

    const toast =
        $("#toast");

    if (!toast) return;

    clearTimeout(
        toastTimer
    );

    toast.textContent =
        message;

    toast.className =
        "fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-xl z-50";

    switch (type) {

        case "error":
            toast.classList.add(
                "bg-red-600",
                "text-white"
            );
            break;

        case "warning":
            toast.classList.add(
                "bg-yellow-500",
                "text-black"
            );
            break;

        default:
            toast.classList.add(
                "bg-green-600",
                "text-white"
            );
    }

    toast.classList.remove(
        "hidden"
    );

    toastTimer =
        setTimeout(() => {

            toast.classList.add(
                "hidden"
            );

        }, 3000);

}

/************************************************
 * TABS
 ************************************************/

export function switchTab(
    tab
) {

    const sections = [
        "sanes",
        "ofertas",
        "admin"
    ];

    sections.forEach(name => {

        const section =
            document.getElementById(
                `section-${name}`
            );

        if (!section) return;

        section.classList.add(
            "hidden"
        );

    });

    const active =
        document.getElementById(
            `section-${tab}`
        );

    if (active) {

        active.classList.remove(
            "hidden"
        );

    }

    updateTabButtons(
        tab
    );

}

/************************************************
 * BOTONES DE TABS
 ************************************************/

export function updateTabButtons(
    activeTab
) {

    document
        .querySelectorAll(
            ".tab-btn"
        )
        .forEach(btn => {

            const tab =
                btn.dataset.tab;

            if (
                tab === activeTab
            ) {

                btn.classList.remove(
                    "bg-[#1a1030]"
                );

                btn.classList.add(
                    "bg-purple-700"
                );

            } else {

                btn.classList.remove(
                    "bg-purple-700"
                );

                btn.classList.add(
                    "bg-[#1a1030]"
                );

            }

        });

}

/************************************************
 * LOGIN ADMIN
 ************************************************/

export function loginAdmin() {

    const pass =
        prompt(
            "Contraseña Velvet de Seguridad:"
        );

    if (
        pass === null
    ) return false;

    if (
        pass ===
        CONFIG.ADMIN_PASSWORD
    ) {

        const adminBtn =
            document.querySelector(
                '[data-tab="admin"]'
            );

        if (adminBtn) {

            adminBtn.classList.remove(
                "hidden"
            );

        }

        switchTab(
            "admin"
        );

        showToast(
            "Acceso concedido"
        );

        return true;

    }

    showToast(
        "Contraseña incorrecta",
        "error"
    );

    return false;

}

/************************************************
 * CONFIRM
 ************************************************/

export function confirmAction(
    message
) {

    return confirm(
        message
    );

}

/************************************************
 * ESCAPE HTML
 ************************************************/

export function escapeHtml(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

/************************************************
 * FORMAT MONEY
 ************************************************/

export function money(
    amount
) {

    return Number(
        amount || 0
    ).toLocaleString(
        "es-VE",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}

/************************************************
 * FORMAT DATE
 ************************************************/

export function formatDate(
    date
) {

    if (!date)
        return "-";

    const d =
        new Date(date);

    return d.toLocaleDateString(
        "es-VE"
    );

}