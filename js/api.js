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
 * Carga todos los datos desde el script de Google Sheets controlando redirecciones CORS
 */
export async function cargarDatosDesdeSheets(fnMostrarCarga, fnOcultarCarga, fnRefrescarUI) {
    if (fnMostrarCarga) fnMostrarCarga();
    
    try {
        // Usamos redirect: "follow" para obligar al navegador a seguir el salto de URL seguro de Google
        const opciones = {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Accept': 'application/json'
            }
        };

        const respuesta = await fetch(ADMIN_CONFIG.URL_API, opciones);
        
        if (!respuesta.ok) {
            throw new Error(`Error de respuesta del servidor: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        
        if (datos && datos.status === "error") {
            console.error("Error devuelto por el backend de Google:", datos.message);
            if (window.mostrarToast) window.mostrarToast(datos.message, "error");
            return;
        }

        if (datos) {
            // Sincronización exacta con las propiedades del nuevo doGet
            DB.clientes = datos.clientes || [];
            DB.sanes = datos.sanes || [];
            DB.registrosTurnos = datos.registros || []; 
            DB.solicitudesNuevos = datos.solicitudesNuevos || [];
            DB.solicitudesInscritos = datos.solicitudesInscritos || [];
            DB.productos = datos.productos || [];
            
            console.log("EDISAN DB Sincronizada con éxito:", DB);
        }
        
    } catch (error) {
        console.error("Falla de lectura o bloqueo CORS:", error);
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
            redirect: 'follow', // Vital también para que los envíos no se queden colgados
            headers: {
                'Content-Type': 'text/plain' 
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