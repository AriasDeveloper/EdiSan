// js/api.js
import { ADMIN_CONFIG } from './config.js';

// Objeto global donde se almacena la base de datos local temporal
export const DB = {
    clientes: [],
    sanes: [],
    registrosTurnos: [],
    solicitudesNuevos: [],
    solicitudesInscritos: [],
    productos: []
};

/**
 * Carga todos los datos desde el script de Google Sheets y los mapea al objeto DB
 * respetando de forma estricta las columnas de tu documento.
 */
export async function cargarDatosDesdeSheets(fnMostrarCarga, fnOcultarCarga, fnRefrescarUI) {
    if (fnMostrarCarga) fnMostrarCarga();
    
    try {
        // Hacemos una petición GET a tu Web App de Google Apps Script
        const respuesta = await fetch(ADMIN_CONFIG.URL_API);
        
        if (!respuesta.ok) {
            throw new Error(`Error de red: ${respuesta.status}`);
        }
        
        // Si tu Apps Script solo responde a POST para sincronizar datos masivos, 
        // aquí puedes usar una estructura adaptada. Asumiendo que tu backend actual 
        // devuelve un JSON estructurado con todas las pestañas al consultar:
        const datos = await respuesta.json();
        
        if (datos) {
            // ASIGNACIÓN Y CONTROL DE VALORES SEGÚN TU EXCEL REAL
            DB.clientes = datos.clientes || [];
            DB.sanes = datos.sanes || [];
            DB.registrosTurnos = datos.registros || []; // Mapeado a tu pestaña "Registros"
            DB.solicitudesNuevos = datos.solicitudesNuevos || [];
            DB.solicitudesInscritos = datos.solicitudesInscritos || [];
            DB.productos = datos.productos || [];
        }
        
    } catch (error) {
        console.error("Falla crítica al sincronizar con Google Sheets:", error);
        if (window.mostrarToast) {
            window.mostrarToast("Falla de conexión con la base de datos", "error");
        }
    } finally {
        if (fnOcultarCarga) fnOcultarCarga();
        if (fnRefrescarUI) fnRefrescarUI();
    }
}

/**
 * Envía las acciones de creación, actualización y borrado hacia el backend Code.gs
 */
export async function ejecutarPostSheets(accion, datosPayload, fnMostrarCarga, fnCallbackExito) {
    if (fnMostrarCarga) fnMostrarCarga();
    
    try {
        const opciones = {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain' // Se usa text/plain para evitar bloqueos de CORS preflight con Apps Script
            },
            body: JSON.stringify({
                action: accion,
                data: datosPayload
            })
        };
        
        const respuesta = await fetch(ADMIN_CONFIG.URL_API, opciones);
        
        if (!respuesta.ok) {
            throw new Error(`Error en el servidor: ${respuesta.status}`);
        }
        
        const resultado = await respuesta.json();
        
        if (resultado.status === 'success') {
            if (fnCallbackExito) {
                fnCallbackExito(resultado);
            } else if (window.recargarManejador) {
                window.recargarManejador();
            }
        } else {
            console.error("El backend retornó un error controlado:", resultado.message);
            if (window.mostrarToast) {
                window.mostrarToast(resultado.message || "No se pudo procesar la solicitud", "error");
            }
            if (window.ocultarCarga) window.ocultarCarga();
        }
        
    } catch (error) {
        console.error(`Falla al ejecutar la acción [${accion}]:`, error);
        if (window.mostrarToast) {
            window.mostrarToast("Error de comunicación. Intente de nuevo.", "error");
        }
        if (window.ocultarCarga) window.ocultarCarga();
    }
}