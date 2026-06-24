// js/api.js
import { API_CONFIG } from './config.js';

// Base de datos reactiva local
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

// Verifica de forma automática si hay cuotas vencidas antes de pintar la UI
export function verificarFechasVencidas() {
    const hoy = new Date();
    if (!DB.registrosTurnos) return;
    
    DB.registrosTurnos.forEach(reg => {
        if (reg.Estado_Pago === 'pendiente' && reg.Fecha_Limite) {
            const limite = new Date(reg.Fecha_Limite);
            if (hoy > limite) reg.Estado_Pago = 'atrasado'; 
        }
    });
}

// Petición GET unificada
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
            window.mostrarToast("Estructura de datos inválida", "error");
        }
    } catch (e) { 
        window.mostrarToast("Error de conexión con la nube", "error"); 
        console.error("Error en la sincronización:", e);
    } finally { 
        ocultarCarga(); 
    }
}

// Petición POST unificada para registrar acciones con seguridad
export async function ejecutarPostSheets(accion, payload, mostrarCarga, ocultarCarga, callbackRecarga) {
    mostrarCarga();
    try {
        await fetch(API_CONFIG.URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: accion, payload: payload })
        });
        window.mostrarToast("Cambio registrado exitosamente", "success");
        // Pequeño delay de cortesía para dejar que Sheets procese la fila
        setTimeout(callbackRecarga, 1500);
    } catch (e) { 
        window.mostrarToast("Error al escribir en la base de datos", "error"); 
        console.error("Error en ejecución de comando:", e);
        ocultarCarga(); 
    }
}