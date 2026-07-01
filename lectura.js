// URL DE TU APLICACIÓN WEB DE GOOGLE APP SCRIPT
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec";

const LIBRERIA_ICONOS = {
    "👑": "Oro/Corona", "💎": "Plata/Diamante", "💰": "Ahorro/Hucha", "📈": "Inversión",
    "📺": "TV/Smart", "📱": "Celular", "💻": "Laptop/PC", "🧺": "Lavadora"
};

window.baseSanes = [];
window.baseClientes = [];
window.baseTurnosPuestos = [];
window.baseSolicitudesNuevos = [];
window.baseProductos = [];

document.addEventListener("DOMContentLoaded", async () => {
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
    await cargarDatosDesdeBD();
    secciones[0].style.display = "block";
});

// FUNCIÓN PARA CONTROLAR EL ESTADO VISIBLE DE LA BASE DE DATOS
function actualizarEstadoDB(estado) {
    const indicador = document.getElementById("db-status-indicator");
    const texto = document.getElementById("db-status-text");
    
    if (!indicador || !texto) return;

    if (estado === "conectado") {
        indicador.style.background = "#3aed97";
        indicador.style.boxShadow = "0 0 8px #3aed97";
        texto.innerText = "BaseEdimar Cloud (Sincronizado)";
    } else if (estado === "guardando") {
        indicador.style.background = "#ebb35e";
        indicador.style.boxShadow = "0 0 8px #ebb35e";
        texto.innerText = "Guardando cambios en Google Sheets...";
    } else if (estado === "error") {
        indicador.style.background = "#eb5e5e";
        indicador.style.boxShadow = "0 0 8px #eb5e5e";
        texto.innerText = "Error de conexión con Google Sheets";
    }
}

// CONTROLLER DE CONSULTAS ASÍNCRONAS MEDIANTE RECURSO SCRIPT (JSONP)
function solicitarTablaJSONP(tablaNombre) {
    return new Promise((resolve, reject) => {
        // Generar un nombre único global para la función de respuesta
        const nombreCallback = `jsonp_callback_${tablaNombre}_${Date.now()}`;
        
        // Crear el puente global que recibirá los datos desde Google
        window[nombreCallback] = function(datos) {
            cleanup();
            resolve(datos);
        };

        // En caso de fallo drástico de red
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error(`Tiempo de espera agotado para la tabla: ${tablaNombre}`));
        }, 8000);

        // Limpieza de memoria eliminando elementos del DOM
        function cleanup() {
            clearTimeout(timeoutId);
            if (script && script.parentNode) script.parentNode.removeChild(script);
            delete window[nombreCallback];
        }

        // Inyección del tag script dinámico para saltar CORS
        const script = document.createElement('script');
        script.src = `${GOOGLE_SCRIPT_URL}?tabla=${tablaNombre}&callback=${nombreCallback}`;
        script.async = true;
        script.onerror = () => { cleanup(); reject(new Error(`Fallo de carga en el script de ${tablaNombre}`)); };
        
        document.head.appendChild(script);
    });
}

// NUEVA FUNCIÓN DE CARGA INMUNE A CORS
async function cargarDatosDesdeBD() {
    try {
        // Ejecutamos las llamadas inyectando scripts simultáneos en el head
        const [resSanes, resClientes, resTurnos, resSolNuevos, resProd] = await Promise.all([
            solicitarTablaJSONP("sanes"),
            solicitarTablaJSONP("clientes"),
            solicitarTablaJSONP("turnos_puestos"),
            solicitarTablaJSONP("solicitudes_nuevos"),
            solicitarTablaJSONP("productos")
        ]);

        if (resSanes.error || resClientes.error || resTurnos.error) {
            actualizarEstadoDB("error");
            console.error("Error lógico en Sheets:", resSanes.error || resClientes.error);
            return;
        }

        // Mapeo seguro a la caché global
        window.baseSanes = Array.isArray(resSanes) ? resSanes : [];
        window.baseClientes = Array.isArray(resClientes) ? resClientes : [];
        window.baseTurnosPuestos = Array.isArray(resTurnos) ? resTurnos : [];
        window.baseSolicitudesNuevos = Array.isArray(resSolNuevos) ? resSolNuevos : [];
        window.baseProductos = Array.isArray(resProd) ? resProd : [];

        // Pintar la interfaz y activar el botón verde
        renderizarUI();
        actualizarEstadoDB("conectado");
    } catch (err) {
        actualizarEstadoDB("error");
        console.error("Error crítico en la pasarela JSONP:", err);
    }
}
function renderizarUI() {
    calcularEstadosSanesAutomaticamente();
    actualizarTablaSanesUI();
    actualizarTablaClientesUI();
    dibujarBloquesDeTurnos();
    actualizarTablaSolicitudesNuevosUI();
    actualizarTablaProductosUI();
}

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
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({ tabla: "sanes", accion: "editar", datos: { id: san.id, estado: nuevoEstado } })
            });
        }
    });
}

function actualizarTablaSanesUI() {
    const tbody = document.getElementById("tabla-sanes-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    window.baseSanes.forEach(s => {
        tbody.innerHTML += `<tr><td>${s.id || s.san_id}</td><td><b>${s.nombre || s.nombre_san}</b></td><td>$${s.cuota || s.monto_cuota}</td><td>${s.inicio || s.fecha_inicio}</td><td>${s.puestos || s.total_turnos}</td><td><span class="badge-status-san" data-state="${s.estado}">${s.estado}</span></td><td>${s.ciclo}</td><td>${obtenerCeldaMultimedia(s.visual)}</td><td><button type="button" class="btn-edit" onclick="abrirFormularioSan('${s.id || s.san_id}')">Editar</button></td></tr>`;
    });
}

function dibujarBloquesDeTurnos() {
    const contenedor = document.getElementById("contenedor-bloques-sanes"); 
    if(!contenedor) return;
    contenedor.innerHTML = "";
    
    window.baseSanes.forEach(san => {
        const targetId = san.id || san.san_id;
        const tarjeta = document.createElement("div"); 
        tarjeta.className = "san-block-card";
        tarjeta.innerHTML = `<div class="san-block-header"><h3>${targetId}: ${san.nombre || san.nombre_san}</h3><span class="badge-info">Ciclo: ${san.ciclo}</span></div>`;
        
        const malla = document.createElement("div"); 
        malla.className = "turnos-grid-puestos";

        const puestos = window.baseTurnosPuestos.filter(t => t.san_id === targetId);
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
        tbody.innerHTML += `<tr><td>${c.id || c.cliente_id}</td><td><b>${c.nombre || c.nombre_completo}</b></td><td>${c.telefono}</td><td><code>${c.contrasena}</code></td><td><button type="button" class="btn-edit" onclick="abrirFormularioCliente('${c.id || c.cliente_id}')">Editar</button></td></tr>`; 
    });
}

function actualizarTablaSolicitudesNuevosUI() {
    const tbody = document.getElementById("tabla-solicitudes-nuevos-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    window.baseSolicitudesNuevos.forEach(sol => {
        tbody.innerHTML += `<tr><td>${sol.id || sol.solicitud_id}</td><td>${sol.nombre || sol.nombre_completo}</td><td>${sol.telefono}</td><td>${sol.san_id}</td><td><button type="button" class="btn-approve" onclick="abrirAprobacionNuevoModal('${sol.id || sol.solicitud_id}')">Elegir Puesto</button></td></tr>`;
    });
}

function actualizarTablaProductosUI() {
    const tbody = document.getElementById("tabla-productos-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    window.baseProductos.forEach(p => { 
        tbody.innerHTML += `<tr><td>${p.id || p.producto_id}</td><td><b>${p.nombre}</b></td><td>${p.descripcion}</td><td>$${p.precio}</td><td>${obtenerCeldaMultimedia(p.visual)}</td><td>${p.stock}</td><td>${p.estado}</td><td><button type="button" class="btn-edit" onclick="abrirFormularioProducto('${p.id || p.producto_id}')">Editar</button></td></tr>`; 
    });
}

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
function obtenerCeldaMultimedia(valor) { if (!valor) return `📦`; return valor; }
function ocultarTodosLosFormularios() { document.querySelectorAll(".modal-form").forEach(m => m.style.display = "none"); }