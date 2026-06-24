// js/api.js
import { API_CONFIG } from './config.js';

export let DB = { sanes: [], clientes: [], registrosTurnos: [], solicitudesNuevos: [], solicitudesInscritos: [] };

export function fijarDB(nuevaDB) { DB = nuevaDB; }

export async function cargarDatosDesdeSheets(mostrarCarga, ocultarCarga, postSincronizacion) {
    mostrarCarga();
    try {
        const respuesta = await fetch(API_CONFIG.URL_APPS_SCRIPT);
        const resultado = await respuesta.json();
        if (resultado.status === "success") {
            fijarDB(resultado.data);
            postSincronizacion();
        } else {
            window.mostrarToast("Estructura de datos inválida", "error");
        }
    } catch (e) {
        window.mostrarToast("Error de conexión a la base de datos", "error");
        console.error(e);
    } finally {
        ocultarCarga();
    }
}

export async function ejecutarPostSheets(accion, payload, mostrarCarga, ocultarCarga, callbackRecarga) {
    mostrarCarga();
    try {
        await fetch(API_CONFIG.URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: accion, payload: payload })
        });
        window.mostrarToast("Transacción enviada", "success");
        setTimeout(callbackRecarga, 1500);
    } catch (e) {
        window.mostrarToast("Error de escritura en red", "error");
        ocultarCarga();
    }
}