// ==========================================================================
// BASEEDIMAR CLOUD API - MÓDULO DE LECTURA Y RENDERIZADO (lectura.js)
// ==========================================================================

// REEMPLAZA ESTA URL CON LA QUE COPIASTE EN EL PASO 1 (Debe terminar en /exec)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec";

const LIBRERIA_ICONOS = {
    "👑": "Oro/Corona", "💎": "Plata/Diamante", "💰": "Ahorro/Hucha", "📈": "Inversión",
    "📺": "TV/Smart", "📱": "Celular", "💻": "Laptop/PC", "🧺": "Lavadora"
};

// Caché global reactiva para almacenar los datos locales de la aplicación
window.baseSanes = [];
window.baseClientes = [];
window.baseTurnosPuestos = [];
window.baseSolicitudesNuevos = [];
window.baseProductos = [];

/**
 * Inicialización de la Interfaz al cargar el DOM
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Configuración del sistema nativo de navegación por pestañas (Tabs)
    const enlacesMenu = document.querySelectorAll("nav ul li a");
    const secciones = document.querySelectorAll("main section");

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener("click", (e) => {
            e.preventDefault();
            enlacesMenu.forEach(link => link.classList.remove("active"));
            enlace.classList.add("active");
            secciones.forEach(sec => sec.style.display = "none");
            
            const seccionDestino = document.querySelector(enlace.getAttribute("href"));
            if (seccionDestino) seccionDestino.style.display = "block";
        });
    });

    // Inicializar componentes visuales estáticos
    inicializarGridIconos();
    
    // Descarga inicial masiva de datos desde la nube
    await cargarDatosDesdeBD();
    
    // Forzar la visualización de la primera sección activa por defecto
    if (secciones.length > 0) secciones[0].style.display = "block";
});

/**
 * Control dinámico del botón de estado de la Base de Datos (Superior Derecho)
 */
function actualizarEstadoDB(estado) {
    const indicador = document.getElementById("db-status-indicator");
    const texto = document.getElementById("db-status-text");
    if (!indicador || !texto) return;

    if (estado === "conectado") {
        indicador.style.background = "#3aed97";
        indicador.style.boxShadow = "0 0 10px #3aed97";
        texto.innerText = "BaseEdimar Cloud (Sincronizado)";
    } else if (estado === "guardando") {
        indicador.style.background = "#ebb35e";
        indicador.style.boxShadow = "0 0 10px #ebb35e";
        texto.innerText = "Sincronizando cambios en la nube...";
    } else if (estado === "error") {
        indicador.style.background = "#eb5e5e";
        indicador.style.boxShadow = "0 0 10px #eb5e5e";
        texto.innerText = "Error de conexión con Google Sheets";
    }
}

/**
 * Lector maestro centralizado mediante inyección JSONP (Inmune a bloqueos CORS)
 */
async function cargarDatosDesdeBD() {
    return new Promise((resolve) => {
        // Creamos un identificador único global para la función puente temporal
        const nombreCallback = `jsonp_callback_global_${Date.now()}`;
        
        // Declaramos el receptor global que procesará el paquete unificado enviado por Google
        window[nombreCallback] = function(paquete) {
            if (!paquete || paquete.error) {
                actualizarEstadoDB("error");
                console.error("Error devuelto por la API de Google Script:", paquete ? paquete.error : "Paquete nulo");
                cleanup();
                return resolve();
            }

            // Mapeo seguro y tolerante a fallos contra subpropiedades o variaciones de cabeceras
            window.baseSanes = Array.isArray(paquete.sanes) ? paquete.sanes : [];
            window.baseClientes = Array.isArray(paquete.clientes) ? paquete.clientes : [];
            window.baseTurnosPuestos = Array.isArray(paquete.turnos_puestos) ? paquete.turnos_puestos : [];
            window.baseSolicitudesNuevos = Array.isArray(paquete.solicitudes_nuevos) ? paquete.solicitudes_nuevos : [];
            window.baseProductos = Array.isArray(paquete.productos) ? paquete.productos : [];

            // Disparar redibujado completo de la interfaz de usuario
            renderizarUI();
            actualizarEstadoDB("conectado");
            cleanup();
            resolve();
        };

        // Recolector de basura para evitar fugas de memoria en el DOM
        function cleanup() {
            if (script && script.parentNode) script.parentNode.removeChild(script);
            delete window[nombreCallback];
        }

        // Creamos la etiqueta de script dinámica para saltar el cortafuegos CORS del navegador
        const script = document.createElement('script');
        script.src = `${GOOGLE_SCRIPT_URL}?callback=${nombreCallback}`;
        script.async = true;
        script.onerror = () => {
            actualizarEstadoDB("error");
            console.error("Fallo crítico de red en la pasarela de datos BaseEdimar.");
            cleanup();
            resolve();
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Renderizador unificado de vistas y componentes de tablas
 */
function renderizarUI() {
    calcularEstadosSanesAutomaticamente();
    actualizarTablaSanesUI();
    actualizarTablaClientesUI();
    dibujarBloquesDeTurnos();
    actualizarTablaSolicitudesNuevosUI();
    actualizarTablaProductosUI();
}

/**
 * Motor lógico para evaluar y actualizar estados de Sanes en tiempo real
 */
function calcularEstadosSanesAutomaticamente() {
    const fechaActual = new Date();
    window.baseSanes.forEach(san => {
        const targetId = san.id || san.san_id;
        if (!targetId) return;

        const puestosId = window.baseTurnosPuestos.filter(t => t.san_id === targetId);
        const totalPuestos = puestosId.length;
        const ocupados = puestosId.filter(t => t.cliente_id && t.cliente_id.trim() !== "").length;
        
        const fechaRaw = san.inicio || san.fecha_inicio || san.fecha;
        const fechaInicioSan = new Date(fechaRaw);
        
        let nuevoEstado = "Activo";
        if (ocupados < totalPuestos && fechaActual < fechaInicioSan) {
            nuevoEstado = "A la espera de clientes";
        } else if (ocupados === totalPuestos && fechaActual < fechaInicioSan) {
            nuevoEstado = "Lleno";
        } else if (fechaActual >= fechaInicioSan && ocupados < totalPuestos) {
            nuevoEstado = "A la espera de la fecha";
        }

        // Si el estado recalculado varía, lo actualizamos silenciosamente en la base de datos
        if(san.estado !== nuevoEstado) {
            san.estado = nuevoEstado;
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ tabla: "sanes", accion: "editar", datos: { id: targetId, estado: nuevoEstado } })
            });
        }
    });
}

/**
 * RENDERIZADORES INDEPENDIENTES DE TABLAS HTML (Blindados contra valores undefined)
 */

function actualizarTablaSanesUI() {
    const tbody = document.getElementById("tabla-sanes-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    
    window.baseSanes.forEach(s => {
        const id = s.id || s.san_id || "";
        const nombre = s.nombre || s.nombre_san || "Sin nombre";
        const cuota = s.cuota || s.monto_cuota || "0";
        const inicio = s.inicio || s.fecha_inicio || "-";
        const puestos = s.puestos || s.total_turnos || "0";
        const estado = s.estado || "Desconocido";
        const ciclo = s.ciclo || "Mensual";
        const visual = s.visual || s.imagen || s.multimedia || "";

        tbody.innerHTML += `
            <tr>
                <td>${id}</td>
                <td><b>${nombre}</b></td>
                <td>$${cuota}</td>
                <td>${inicio}</td>
                <td>${puestos}</td>
                <td><span class="badge-status-san" data-state="${estado}">${estado}</span></td>
                <td>${ciclo}</td>
                <td>${obtenerCeldaMultimedia(visual)}</td>
                <td><button type="button" class="btn-edit" onclick="abrirFormularioSan('${id}')">Editar</button></td>
            </tr>`;
    });
}

function dibujarBloquesDeTurnos() {
    const contenedor = document.getElementById("contenedor-bloques-sanes"); 
    if(!contenedor) return;
    contenedor.innerHTML = "";
    
    window.baseSanes.forEach(san => {
        const targetId = san.id || san.san_id;
        if (!targetId) return;

        const tarjeta = document.createElement("div"); 
        tarjeta.className = "san-block-card";
        tarjeta.innerHTML = `<div class="san-block-header"><h3>${targetId}: ${san.nombre || san.nombre_san}</h3><span class="badge-info">Ciclo: ${san.ciclo || 'Mensual'}</span></div>`;
        
        const malla = document.createElement("div"); 
        malla.className = "turnos-grid-puestos";

        const puestos = window.baseTurnosPuestos.filter(t => t.san_id === targetId);
        
        puestos.forEach(p => {
            const item = document.createElement("div");
            const esLibre = !p.cliente_id || p.cliente_id.trim() === "";
            item.className = `puesto-item ${esLibre ? 'libre' : 'assigned'}`;
            if(!esLibre) item.style.border = "1px solid var(--morado-neon)";

            const clienteObj = window.baseClientes.find(c => (c.id || c.cliente_id) === p.cliente_id);
            const nombreMostrar = clienteObj ? `${clienteObj.nombre || clienteObj.nombre_completo}` : "❌ Vacante (Disponible)";
            
            const pagoActual = p.pago || p.estado_pago || "Sin Pago";
            const corteFecha = p.corte || p.fecha_corte || "-";

            item.innerHTML = `
                <div class="puesto-num">Puesto ${p.puesto}</div>
                <div class="puesto-cliente">${nombreMostrar}</div>
                <div class="puesto-meta">Corte: ${corteFecha}</div>
                <select class="select-pago-fast" data-status="${pagoActual}" onchange="cambiarPagoRapido('${p.san_id}', ${p.puesto}, this.value)">
                    <option value="Sin Pago" ${pagoActual === 'Sin Pago' ? 'selected' : ''}>Sin Pago</option>
                    <option value="Pendiente" ${pagoActual === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Al Día" ${pagoActual === 'Al Día' ? 'selected' : ''}>Al Día</option>
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
        const id = c.id || c.cliente_id || "";
        const nombre = c.nombre || c.nombre_completo || "Sin Nombre";
        const telefono = c.telefono || "-";
        const contrasena = c.contrasena || c.contraseña || "1234";

        tbody.innerHTML += `
            <tr>
                <td>${id}</td>
                <td><b>${nombre}</b></td>
                <td>${telefono}</td>
                <td><code>${contrasena}</code></td>
                <td><button type="button" class="btn-edit" onclick="abrirFormularioCliente('${id}')">Editar</button></td>
            </tr>`; 
    });
}

function actualizarTablaSolicitudesNuevosUI() {
    const tbody = document.getElementById("tabla-solicitudes-nuevos-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    
    window.baseSolicitudesNuevos.forEach(sol => {
        const id = sol.id || sol.solicitud_id || "";
        const nombre = sol.nombre || sol.nombre_completo || "Anónimo";
        const telefono = sol.telefono || "-";
        const sanId = sol.san_id || sol.id_san || "";

        tbody.innerHTML += `
            <tr>
                <td>${id}</td>
                <td>${nombre}</td>
                <td>${telefono}</td>
                <td>${sanId}</td>
                <td><button type="button" class="btn-approve" onclick="abrirAprobacionNuevoModal('${id}')">Elegir Puesto</button></td>
            </tr>`;
    });
}

function actualizarTablaProductosUI() {
    const tbody = document.getElementById("tabla-productos-body"); 
    if(!tbody) return;
    tbody.innerHTML = "";
    
    window.baseProductos.forEach(p => { 
        const id = p.id || p.producto_id || "";
        const nombre = p.nombre || "Producto sin nombre";
        const descripcion = p.descripcion || "-";
        const precio = p.precio || "0";
        const visual = p.visual || p.imagen || "";
        const stock = p.stock || "0";
        const estado = p.estado || "Disponible";

        tbody.innerHTML += `
            <tr>
                <td>${id}</td>
                <td><b>${nombre}</b></td>
                <td>${descripcion}</td>
                <td>$${precio}</td>
                <td>${obtenerCeldaMultimedia(visual)}</td>
                <td>${stock}</td>
                <td>${estado}</td>
                <td><button type="button" class="btn-edit" onclick="abrirFormularioProducto('${id}')">Editar</button></td>
            </tr>`; 
    });
}

/**
 * Utilidades complementarias de interfaz
 */
function inicializarGridIconos() {
    document.querySelectorAll(".icon-selector-grid").forEach(grid => {
        grid.innerHTML = ""; 
        const targetInputId = grid.getAttribute("data-input");
        Object.keys(LIBRERIA_ICONOS).forEach(icono => {
            const opt = document.createElement("div"); 
            opt.className = "icon-opt"; 
            opt.innerHTML = `<span>${icono}</span>`;
            opt.addEventListener("click", () => { 
                const inputDestino = document.getElementById(targetInputId);
                if (inputDestino) inputDestino.value = icono; 
            });
            grid.appendChild(opt);
        });
    });
}

function obtenerCeldaMultimedia(valor) { 
    if (!valor || valor.trim() === "") return `📦`; 
    return valor.trim(); 
}

function ocultarTodosLosFormularios() { 
    document.querySelectorAll(".modal-form").forEach(m => m.style.display = "none"); 
}