// ==========================================================================
// LECTURA.JS FINAL - UNIFICADO Y CORREGIDO
// ==========================================================================

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec"; // REEMPLAZA CON TU URL /EXEC

window.appData = {
    sanes: [], clientes: [], turnos: [], productos: [],
    loading: true
};

// 1. Inicia la carga
async function cargarDatosDesdeBD() {
    console.log("Iniciando carga de datos...");
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    window[callbackName] = function(data) {
        console.log("Datos recibidos:", data);
        window.appData.sanes = data.sanes || [];
        window.appData.clientes = data.clientes || [];
        window.appData.turnos = data.turnos_puestos || [];
        window.appData.productos = data.productos || [];
        window.appData.loading = false;
        
        renderizarUI();
        actualizarEstadoDB("conectado");
        
        // Limpieza
        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `${GOOGLE_SCRIPT_URL}?callback=${callbackName}&t=${Date.now()}`;
    script.onerror = () => console.error("Error al conectar con Google.");
    document.body.appendChild(script);
}

// 2. Funciones de Renderizado (Definidas antes de ser llamadas)
function actualizarTablaSanesUI() {
    const tbody = document.getElementById("tabla-sanes-body");
    if(!tbody) return;
    tbody.innerHTML = window.appData.sanes.map(s => `
        <tr>
            <td>${s.id || ''}</td>
            <td><b>${s.nombre || ''}</b></td>
            <td>$${s.cuota || '0'}</td>
            <td>${s.inicio || '-'}</td>
            <td>${s.puestos || '0'}</td>
            <td>${s.estado || 'Activo'}</td>
            <td>${s.ciclo || 'Mensual'}</td>
            <td>
                <button onclick="abrirFormularioSan('${s.id}')">Editar</button>
                <button onclick="eliminarRegistro('sanes', '${s.id}')">Eliminar</button>
            </td>
        </tr>`).join('');
}

function actualizarTablaClientesUI() {
    const tbody = document.getElementById("tabla-clientes-body");
    if(!tbody) return;
    tbody.innerHTML = window.appData.clientes.map(c => `
        <tr>
            <td>${c.id || ''}</td>
            <td><b>${c.nombre || ''}</b></td>
            <td>${c.telefono || '-'}</td>
            <td><code>${c.contrasena || ''}</code></td>
            <td>
                <button onclick="abrirFormularioCliente('${c.id}')">Editar</button>
                <button onclick="eliminarRegistro('clientes', '${c.id}')">Eliminar</button>
            </td>
        </tr>`).join('');
}

// 3. Motor maestro de renderizado
function renderizarUI() {
    console.log("Renderizando interfaz...");
    actualizarTablaSanesUI();
    actualizarTablaClientesUI();
}

function actualizarEstadoDB(estado) {
    const el = document.getElementById("db-status-text");
    if(el) el.innerText = estado === "conectado" ? "BaseEdimar: En Línea" : "Conectando...";
}

// 4. Iniciar al cargar
window.onload = cargarDatosDesdeBD;