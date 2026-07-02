// BASEEDIMAR LECTURA.JS V2 - INTEGRACIÓN DE ELIMINACIÓN Y RENDER RÁPIDO
// ==========================================================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec";

window.baseSanes = [];
window.baseClientes = [];
window.baseTurnosPuestos = [];
window.baseSolicitudesNuevos = [];
window.baseProductos = [];

// Actualización de estado con tiempo optimizado (UI casi instantánea)
function actualizarEstadoDB(estado) {
    const indicador = document.getElementById("db-status-indicator");
    const texto = document.getElementById("db-status-text");
    if (!indicador || !texto) return;

    if (estado === "conectado") {
        indicador.style.background = "#3aed97";
        texto.innerText = "Sincronizado";
    } else if (estado === "guardando") {
        indicador.style.background = "#ebb35e";
        texto.innerText = "Procesando...";
    }
}

async function cargarDatosDesdeBD() {
    return new Promise((resolve) => {
        const nombreCallback = `jsonp_${Date.now()}`;
        
        // Timeout de seguridad: Si pasan 5 segundos y no responde, avisar
        const timeout = setTimeout(() => {
            console.error("Error: Tiempo de espera agotado. Verifica tu URL o permisos de publicación.");
            actualizarEstadoDB("error");
            document.getElementById("db-status-text").innerText = "Error de conexión";
            resolve();
        }, 5000);

        window[nombreCallback] = function(paquete) {
            clearTimeout(timeout); // Cancela el timeout si llegó respuesta
            window.baseSanes = paquete.sanes || [];
            window.baseClientes = paquete.clientes || [];
            window.baseTurnosPuestos = paquete.turnos_puestos || [];
            window.baseSolicitudesNuevos = paquete.solicitudes_nuevos || [];
            window.baseProductos = paquete.productos || [];
            
            renderizarUI();
            actualizarEstadoDB("conectado");
            
            if (script && script.parentNode) document.head.removeChild(script);
            delete window[nombreCallback];
            resolve();
        };

        const script = document.createElement('script');
        script.src = `${GOOGLE_SCRIPT_URL}?callback=${nombreCallback}`;
        script.onerror = () => { 
            clearTimeout(timeout); 
            console.error("Error al cargar el script. Verifica la URL."); 
        };
        document.head.appendChild(script);
    });
}

function renderizarUI() {
    actualizarTablaSanesUI();
    actualizarTablaClientesUI();
    actualizarTablaProductosUI();
    dibujarBloquesDeTurnos();
}

function actualizarTablaSanesUI() {
    const tbody = document.getElementById("tabla-sanes-body");
    if(!tbody) return;
    tbody.innerHTML = window.baseSanes.map(s => `
        <tr>
            <td>${s.id || s.san_id}</td>
            <td><b>${s.nombre || s.nombre_san}</b></td>
            <td>$${s.cuota || s.monto_cuota}</td>
            <td>${s.inicio || s.fecha_inicio}</td>
            <td>${s.puestos || s.total_turnos}</td>
            <td><span class="badge-status-san">${s.estado || 'Activo'}</span></td>
            <td>${s.ciclo || 'Mensual'}</td>
            <td>${s.visual || '📦'}</td>
            <td>
                <button class="btn-edit" onclick="abrirFormularioSan('${s.id || s.san_id}')">Editar</button>
                <button class="btn-delete" onclick="eliminarRegistro('sanes', '${s.id || s.san_id}')">Eliminar</button>
            </td>
        </tr>`).join('');
}

function actualizarTablaClientesUI() {
    const tbody = document.getElementById("tabla-clientes-body");
    if(!tbody) return;
    tbody.innerHTML = window.baseClientes.map(c => `
        <tr>
            <td>${c.id || c.cliente_id}</td>
            <td><b>${c.nombre || c.nombre_completo}</b></td>
            <td>${c.telefono || '-'}</td>
            <td><code>${c.contrasena || c.contraseña}</code></td>
            <td>
                <button class="btn-edit" onclick="abrirFormularioCliente('${c.id || c.cliente_id}')">Editar</button>
                <button class="btn-delete" onclick="eliminarRegistro('clientes', '${c.id || c.cliente_id}')">Eliminar</button>
            </td>
        </tr>`).join('');
}

function actualizarTablaProductosUI() {
    const tbody = document.getElementById("tabla-productos-body");
    if(!tbody) return;
    tbody.innerHTML = window.baseProductos.map(p => `
        <tr>
            <td>${p.id || p.producto_id}</td>
            <td><b>${p.nombre}</b></td>
            <td>${p.descripcion || '-'}</td>
            <td>$${p.precio}</td>
            <td>${p.visual || '📦'}</td>
            <td>${p.stock}</td>
            <td>${p.estado}</td>
            <td>
                <button class="btn-edit" onclick="abrirFormularioProducto('${p.id || p.producto_id}')">Editar</button>
                <button class="btn-delete" onclick="eliminarRegistro('productos', '${p.id || p.producto_id}')">Eliminar</button>
            </td>
        </tr>`).join('');
}

function dibujarBloquesDeTurnos() {
    const contenedor = document.getElementById("contenedor-bloques-sanes");
    if(!contenedor) return;
    contenedor.innerHTML = window.baseSanes.map(san => {
        const idSan = san.id || san.san_id;
        const puestos = window.baseTurnosPuestos.filter(t => t.san_id === idSan);
        return `
            <div class="san-block-card">
                <h3>${san.nombre || san.nombre_san}</h3>
                <div class="turnos-grid-puestos">
                    ${puestos.map(p => `<div class="puesto-item ${p.cliente_id ? 'assigned' : 'libre'}">
                        Puesto ${p.puesto}: ${p.cliente_id ? 'Ocupado' : 'Disponible'}
                    </div>`).join('')}
                </div>
            </div>`;
    }).join('');
}