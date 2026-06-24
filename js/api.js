// js/api.js
import { API_CONFIG } from './config.js';

export let DB = { 
    sanes: [], 
    clientes: [], 
    registrosTurnos: [], 
    solicitudesNuevos: [], 
    solicitudesInscritos: [],
    productos: [] 
};

export function fijarDB(nuevaDB) {
    DB = nuevaDB;
}

export function verificarFechasVencidas() {
    const hoy = new Date();
    DB.registrosTurnos.forEach(reg => {
        if (reg.Estado_Pago === 'pendiente' && reg.Fecha_Limite) {
            const limite = new Date(reg.Fecha_Limite);
            if (hoy > limite) reg.Estado_Pago = 'atrasado'; 
        }
    });
}

export async function cargarDatosDesdeSheets(mostrarCarga, ocultarCarga, postSincronizacion) {
    mostrarCarga();
    try {
        const respuesta = await fetch(API_CONFIG.URL_APPS_SCRIPT);
        const resultado = await respuesta.json();
        
        if (resultado.status === "success") {
            fijarDB(resultado.data);
            verificarFechasVencidas();
            postSincronizacion();
        } else {
            window.mostrarToast("Error en la estructura del servidor", "error");
        }
    } catch (e) { 
        window.mostrarToast("Error de sincronización con la nube", "error"); 
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
        window.mostrarToast("Cambio registrado de forma segura", "success");
        setTimeout(callbackRecarga, 1200);
    } catch (e) { 
        window.mostrarToast("Fallo al escribir en la base de datos", "error"); 
        ocultarCarga(); 
    }
}