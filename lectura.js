// BASEEDIMAR LECTURA.JS V2 - INTEGRACIÓN DE ELIMINACIÓN Y RENDER RÁPIDO
// ==========================================================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec";

window.appData = {
    sanes: [], clientes: [], turnos: [], productos: [],
    loading: true
};

async function cargarDatosDesdeBD() {
    console.log("Iniciando carga de datos...");
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Definir la función global para el JSONP
    window[callbackName] = function(data) {
        console.log("Datos recibidos correctamente.");
        window.appData.sanes = data.sanes || [];
        window.appData.clientes = data.clientes || [];
        window.appData.turnos = data.turnos_puestos || [];
        window.appData.productos = data.productos || [];
        window.appData.loading = false;
        
        // Ejecutar renderizado
        renderizarUI();
        actualizarEstadoDB("conectado");
        
        // Limpieza
        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `${GOOGLE_SCRIPT_URL}?callback=${callbackName}&t=${Date.now()}`;
    script.onerror = function() {
        console.error("Error crítico: No se pudo conectar con Google Apps Script.");
        document.getElementById("db-status-text").innerText = "Error de Conexión";
    };
    
    document.body.appendChild(script);
}

function renderizarUI() {
    // Aquí se actualizarán las tablas basándose en window.appData
    actualizarTablaSanesUI();
    actualizarTablaClientesUI();
    // ... llamar a las demás funciones de renderizado
}

function actualizarEstadoDB(estado) {
    const el = document.getElementById("db-status-text");
    if(el) el.innerText = estado === "conectado" ? "BaseEdimar: En Línea" : "Conectando...";
}

// Iniciar carga al cargar la web
window.onload = cargarDatosDesdeBD;