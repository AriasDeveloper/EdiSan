// js/api.js
import { ADMIN_CONFIG } from './config.js';

export const DB = {
    clientes: [],
    sanes: [],
    registrosTurnos: [],
    solicitudesNuevos: [],
    solicitudesInscritos: [],
    productos: []
};

export async function cargarDatosDesdeSheets(fnMostrarCarga, fnOcultarCarga, fnRefrescarUI) {
    if (fnMostrarCarga) fnMostrarCarga();
    
    try {
        const respuesta = await fetch(ADMIN_CONFIG.URL_API, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });
        
        if (!respuesta.ok) throw new Error(`HTTP Código ${respuesta.status}`);
        
        const textoPlano = await respuesta.text();
        const datos = JSON.parse(textoPlano);
        
        if (datos && datos.status === "success") {
            DB.clientes = datos.clientes || [];
            DB.sanes = datos.sanes || [];
            DB.registrosTurnos = datos.registros || []; 
            DB.solicitudesNuevos = datos.solicitudesNuevos || [];
            DB.solicitudesInscritos = datos.solicitudesInscritos || [];
            DB.productos = datos.productos || [];
            console.log("EDISAN Database sincronizada.");
        } else {
            throw new Error(datos.message || "Estructura de datos corrupta");
        }
        
    } catch (error) {
        console.error("Error crítico de sincronización:", error);
        if (window.mostrarToast) window.mostrarToast("Falla de conexión con la base de datos", "error");
    } finally {
        if (fnOcultarCarga) fnOcultarCarga();
        if (fnRefrescarUI) fnRefrescarUI();
    }
}

export async function ejecutarPostSheets(accion, datosPayload, fnMostrarCarga, fnCallbackExito) {
    if (fnMostrarCarga) fnMostrarCarga();
    
    try {
        const respuesta = await fetch(ADMIN_CONFIG.URL_API, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: accion, data: datosPayload })
        });
        
        if (!respuesta.ok) throw new Error(`HTTP Error ${respuesta.status}`);
        
        const resultado = await respuesta.json();
        
        if (resultado.status === 'success') {
            if (fnCallbackExito) fnCallbackExito(resultado);
        } else {
            if (window.mostrarToast) window.mostrarToast(resultado.message || "Error procesando orden", "error");
            if (window.ocultarCarga) window.ocultarCarga();
        }
    } catch (error) {
        console.error("Error enviando datos:", error);
        if (window.mostrarToast) window.mostrarToast("Falla de red al guardar datos", "error");
        if (window.ocultarCarga) window.ocultarCarga();
    }
}