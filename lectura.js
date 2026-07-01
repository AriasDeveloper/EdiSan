// URL DE TU APLICACIÓN WEB DE GOOGLE APP SCRIPT
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec";

const LIBRERIA_ICONOS = {
    "👑": "Oro/Corona", "💎": "Plata/Diamante", "💰": "Ahorro/Hucha", "📈": "Inversión",
    "📺": "TV/Smart", "📱": "Celular", "💻": "Laptop/PC", "🧺": "Lavadora"
};

// Caché global para renderizado inmediato compartida entre scripts
window.baseSanes = [];
window.baseClientes = [];
window.baseTurnosPuestos = [];
window.baseSolicitudesNuevos = [];
window.baseSolicitudesInscritos = [];
window.baseProductos = [];

document.addEventListener("DOMContentLoaded", async () => {
    // Sistema navegación tabs original
    const enlacesMenu = document.querySelectorAll("nav ul li a");
    const secciones = document.querySelectorAll("main section");

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener("click", (e) => {
            e.preventDefault();
            enlacesMenu.forEach(link => link.classList.remove("active"));
            enlace.classList.add("active");
            secciones.forEach(sec => sec.style.display = "none");
            document.querySelector(enlace.getAttribute("href")).style.display = "block";
        });
    });

    inicializarGridIconos();
    // Carga inicial optimizada desde Google Sheets
    await cargarDatosDesdeBD();
    secciones[0].style.display = "block";
});

// ==========================================================================
// LECTURA EFICIENTE DESDE GOOGLE SHEETS (GET)
// ==========================================================================
async function cargarDatosDesdeBD() {
    try {
        // Cargamos todas las tablas en paralelo para no ralentizar la interfaz
        const [resSanes, resClientes, resTurnos, resSolNuevos, resProd] = await Promise.all([
            fetch(`${GOOGLE_SCRIPT_URL}?tabla=sanes`).then(r => r.json()),
            fetch(`${GOOGLE_SCRIPT_URL}?tabla=clientes`).then(r => r.json()),
            fetch(`${GOOGLE_SCRIPT_URL}?tabla=turnos_puestos`).then(r => r.json()),
            fetch(`${GOOGLE_SCRIPT_URL}?tabla=solicitudes_nuevos`).then(r => r.json()),
            fetch(`${GOOGLE_SCRIPT_URL}?tabla=productos`).then(r => r.json())
        ]);

        window.baseSanes = Array.isArray(resSanes) ? resSanes : [];
        window.baseClientes = Array.isArray(resClientes) ? resClientes : [];
        window.baseTurnosPuestos = Array.isArray(resTurnos) ? resTurnos : [];
        window.baseSolicitudesNuevos = Array.isArray(resSolNuevos) ? resSolNuevos : [];
        window.baseProductos = Array.isArray(resProd) ? resProd : [];

        renderizarUI();
    } catch (err) {
        console.error("Error al sincronizar con Google Sheets:", err);
    }
}

function renderizarUI() {
    calcularEstadosSanesAutomaticamente();
    actualizarTablaSanesUI();
    actualizarTablaClientesUI();
    dibujarBloquesDeTurnos();
    actualizarTablaSolicitudesNuevosUI();
    actualizarTablaSolicitudesInscritosUI();
    actualizarTablaProductosUI();
}

// LÓGICA AUTOMÁTICA DE ESTADOS
function calcularEstadosSanesAutomaticamente() {
    const fechaActual = new Date();
    window.baseSanes.forEach(async (san) => {
        const puestosId = window.baseTurnosPuestos.filter(t => t.san_id === san.id);
        const totalPuestos = puestosId.length;
        const ocupados = puestosId.filter(t => t.cliente_id && t.cliente_id !== "").length;
        const fechaInicioSan = new Date(san.inicio);
        
        let nuevoEstado = "Activo";

        if (ocupados < totalPuestos && fechaActual < fechaInicioSan) {
            nuevoEstado = "A la espera de clientes";
        } else if (ocupados === totalPuestos && fechaActual < fechaInicioSan) {
            nuevoEstado = "Lleno";
        } else if (fechaActual >= fechaInicioSan && ocupados < totalPuestos) {
            nuevoEstado = "A la espera de la fecha";
        }

        if(san.estado !== nuevoEstado) {
            san.estado = nuevoEstado;
            // Envía la actualización a Google Sheets en segundo plano sin congelar la app
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({ tabla: "sanes", accion: "editar", datos: { id: san.id, estado: nuevoEstado } })
            });
        }
    });
}

// ==========================================================================
// COMPONENTES DE RENDERIZACIÓN DE TABLAS DE INTERFAZ (UI)
// ==========================================================================
function actualizarTablaSanesUI() {
    const tbody = document.getElementById("tabla-sanes-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    window.baseSanes.forEach(s => {
        tbody.innerHTML += `<tr><td>${s.id}</td><td><b>${s.nombre}</b></td><td>$${s.cuota}</td><td>${s.inicio}</td><td>${s.puestos}</td><td><span class="badge-status-san" data-state="${s.estado}">${s.estado}</span></td><td>${s.ciclo}</td><td>${obtenerCeldaMultimedia(s.visual)}</td><td><button type="button" class="btn-edit" onclick="abrirFormularioSan('${s.id}')">Editar</button></td></tr>`;
    });
}

function dibujarBloquesDeTurnos() {
    const contenedor = document.getElementById("contenedor-bloques-sanes"); 
    if(!contenedor) return;
    contenedor.innerHTML = "";
    
    window.baseSanes.forEach(san => {
        const tarjeta = document.createElement("div"); 
        tarjeta.className = "san-block-card";
        tarjeta.innerHTML = `<div class="san-block-header"><h3>${san.id}: ${san.nombre}</h3><span class="badge-info">Ciclo: ${san.ciclo}</span></div>`;
        
        const malla = document.createElement("div"); 
        malla.className = "turnos-grid-puestos";

        const puestos = window.baseTurnosPuestos.filter(t => t.san_id === san.id);
        puestos.forEach(p => {
            const item = document.createElement("div");
            const esLibre = !p.cliente_id;
            item.className = `puesto-item ${esLibre ? 'libre' : 'assigned'}`;
            if(!esLibre) item.style.border = "1px solid var(--morado-neon)";

            const clienteObj = window.baseClientes.find(c => c.id === p.cliente_id);
            const nombreMostrar = clienteObj ? `${clienteObj.nombre}` : "❌ Vacante (Disponible)";

            item.innerHTML = `
                <div class="puesto-num">Puesto ${p.puesto}</div>
                <div class="puesto-cliente">${nombreMostrar}</div>
                <div class="puesto-meta">Corte: ${p.corte}</div>
                <select class="select-pago-fast" data-status="${p.pago}" onchange="cambiarPagoRapido('${p.san_id}', ${p.puesto}, this.value)">
                    <option value="Sin Pago" ${p.pago === 'Sin Pago' ? 'selected' : ''}>Sin Pago</option>
                    <option value="Pendiente" ${p.pago === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Al Día" ${p.pago === 'Al Día' ? 'selected' : ''}>Al Día</option>
                </select>
                <button type="button" style="margin-top:10px; width:100%; font-size:11px; padding:5px;" onclick="abrirAsignacionPuesto('${p.san_id}', ${p.puesto})">Asignar / Vaciar</button>
            `;
            malla.appendChild(item);
        });
        tarjeta.appendChild(malla); 
        contenedor.appendChild(tarjeta);
    });
}

function actualizarTablaClientesUI() {
    const tbody = document.getElementById("tabla-clientes-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    window.baseClientes.forEach(c => { 
        tbody.innerHTML += `<tr><td>${c.id}</td><td><b>${c.nombre}</b></td><td>${c.telefono}</td><td><code>${c.contrasena}</code></td><td><button type="button" class="btn-edit" onclick="abrirFormularioCliente('${c.id}')">Editar</button></td></tr>`; 
    });
}

function actualizarTablaSolicitudesNuevosUI() {
    const tbody = document.getElementById("tabla-solicitudes-nuevos-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    window.baseSolicitudesNuevos.forEach(sol => {
        tbody.innerHTML += `<tr><td>${sol.id}</td><td>${sol.nombre}</td><td>${sol.telefono}</td><td>${sol.san_id}</td><td><button type="button" class="btn-approve" onclick="abrirAprobacionNuevoModal('${sol.id}')">Elegir Puesto</button></td></tr>`;
    });
}

function actualizarTablaSolicitudesInscritosUI() {
    const tbody = document.getElementById("tabla-solicitudes-inscritos-body"); 
    if(!tbody) return;
    tbody.innerHTML = ""; // Se mantiene limpio listo para uso futuro
}

function actualizarTablaProductosUI() {
    const tbody = document.getElementById("tabla-productos-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    window.baseProductos.forEach(p => { 
        tbody.innerHTML += `<tr><td>${p.id}</td><td><b>${p.nombre}</b></td><td>${p.descripcion}</td><td>$${p.precio}</td><td>${obtenerCeldaMultimedia(p.visual)}</td><td>${p.stock}</td><td>${p.estado}</td><td><button type="button" class="btn-edit" onclick="abrirFormularioProducto('${p.id}')">Editar</button></td></tr>`; 
    });
}

// FUNCIONES AUXILIARES DE INTERFAZ
function inicializarGridIconos() {
    document.querySelectorAll(".icon-selector-grid").forEach(grid => {
        grid.innerHTML = ""; 
        const targetInputId = grid.getAttribute("data-input");
        Object.keys(LIBRERIA_ICONOS).forEach(icono => {
            const opt = document.createElement("div"); 
            opt.className = "icon-opt"; 
            opt.innerHTML = `<span>${icono}</span>`;
            opt.addEventListener("click", () => { document.getElementById(targetInputId).value = icono; });
            grid.appendChild(opt);
        });
    });
}

function obtenerCeldaMultimedia(valor) { 
    if (!valor) return `📦`; 
    return valor; 
}

function ocultarTodosLosFormularios() { 
    document.querySelectorAll(".modal-form").forEach(m => m.style.display = "none"); 
}