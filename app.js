// CONFIGURACIÓN DE RUTAS DE COMUNICACIÓN ENLACE DIRECTO
const API_URL = "AQUI_PEGA_TU_NUEVA_URL_DE_GOOGLE_APPS_SCRIPT_EXEC";

let sesionAdminActiva = false;
let tipoFormularioActual = 'sanes';

// Inicialización automática al cargar el sitio
document.addEventListener("DOMContentLoaded", () => {
    importarDatosEstadisticas();
});

function forzarLoader(estado) {
    const loader = document.getElementById("loader");
    if(loader) loader.style.display = estado ? "flex" : "none";
}

// Consumo de la API con manejo de redirecciones automático (Fix del Bucle Infinito)
async function consultarServidor(payload) {
    try {
        const query = await fetch(API_URL, {
            method: "POST",
            mode: "cors",
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        if (!query.ok) throw new Error("Respuesta de servidor inválida");
        return await query.json();
    } catch (err) {
        console.error("Fallo de enlace:", err);
        forzarLoader(false);
        alert("Atención: Interrupción en la línea de datos con BaseEdimar.");
        return { success: false, error: err.toString() };
    }
}

// Renderizado dinámico de la base de datos a los ojos de la Patrona y sus clientes
async function importarDatosEstadisticas() {
    forzarLoader(true);
    const data = await consultarServidor({ action: "obtenerDatosVitrina" });
    forzarLoader(false);

    if(data && data.success) {
        dibujarTablaSanes(data.sanes);
        dibujarTablaProductos(data.productos);
    }
}

function dibujarTablaSanes(listaSanes) {
    const box = document.getElementById("grid-sanes");
    box.innerHTML = listaSanes.length === 0 ? `<p class="text-muted">No existen grupos de Sanes registrados actualmente.</p>` : "";
    
    listaSanes.forEach(san => {
        box.innerHTML += `
            <div class="card-premium">
                <h4 style="color:var(--neon-violet); margin-bottom:10px;">${san.NombreGrupo || 'San Innominado'}</h4>
                <p style="font-size:1.2rem; font-weight:700; margin-bottom:10px;">Monto: $${san.MontoCiclo || '0'}</p>
                <p style="color:var(--text-muted); font-size:0.9rem;">Turno Actual: <b>${san.TurnoActual || '-'}</b></p>
                <p style="color:var(--text-muted); font-size:0.9rem;">Estado: <span style="color:#00f5d4">${san.Estado || 'Activo'}</span></p>
            </div>
        `;
    });
}

function dibujarTablaProductos(listaProductos) {
    const box = document.getElementById("grid-productos");
    box.innerHTML = listaProductos.length === 0 ? `<p class="text-muted">Catálogo vacío comercialmente.</p>` : "";
    
    listaProductos.forEach(prod => {
        box.innerHTML += `
            <div class="card-premium" style="border-left: 3px solid var(--neon-gold)">
                <h4 style="margin-bottom:8px;">${prod.Articulo || 'Producto'}</h4>
                <p style="font-size:1.3rem; color:var(--neon-gold); font-weight:700; margin-bottom:5px;">$${prod.Precio || '0'}</p>
                <p style="color:var(--text-muted); font-size:0.85rem;">Cuotas Permitidas: ${prod.CuotasMaximas || '1'}</p>
            </div>
        `;
    });
}

// CONTROL DE MODAL INTERACTIVO
function alternarModalAdmin(mostrar) {
    document.getElementById("modal-admin").style.display = mostrar ? "flex" : "none";
}

function procesarLoginAdmin() {
    const pass = document.getElementById("admin-key").value;
    if(pass === "Edimar2026*") { // Validación Local rápida antes de sesión abierta
        sesionAdminActiva = true;
        document.getElementById("admin-login-view").style.display = "none";
        document.getElementById("admin-console-view").style.display = "block";
        cambiarFormulario('sanes');
    } else {
        alert("Clave Maestra Inválida. Acceso Restringido.");
    }
}

function cerrarSesionAdmin() {
    sesionAdminActiva = false;
    document.getElementById("admin-key").value = "";
    document.getElementById("admin-console-view").style.display = "none";
    document.getElementById("admin-login-view").style.display = "block";
    alternarModalAdmin(false);
}

function cambiarFormulario(tipo) {
    tipoFormularioActual = tipo;
    const btns = document.querySelectorAll(".tab-btn");
    btns[0].classList.toggle("active", tipo === 'sanes');
    btns[1].classList.toggle("active", tipo === 'productos');
    
    const wrapper = document.getElementById("campos-dinamicos");
    if(tipo === 'sanes') {
        wrapper.innerHTML = `
            <div class="input-wrapper"><label>Nombre del San</label><input type="text" id="f-nombre" required placeholder="Ej: San Oro Semanal"></div>
            <div class="input-wrapper"><label>Monto del Ciclo ($)</label><input type="number" id="f-monto" required placeholder="200"></div>
            <div class="input-wrapper"><label>Turno Inicial</label><input type="text" id="f-turno" value="1" required></div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="input-wrapper"><label>Nombre del Artículo</label><input type="text" id="f-articulo" required placeholder="Ej: Smart TV 42 pulgadas"></div>
            <div class="input-wrapper"><label>Precio de Venta ($)</label><input type="number" id="f-precio" required placeholder="350"></div>
            <div class="input-wrapper"><label>Financiamiento Máximo (Cuotas)</label><input type="number" id="f-cuotas" value="4" required></div>
        `;
    }
}

// Envío de Operaciones a Google Sheets sin recargar pantalla
async function enviarDatosConsola(event) {
    event.preventDefault();
    forzarLoader(true);
    
    let filaNueva = [];
    let destinoTabla = "";
    
    if(tipoFormularioActual === 'sanes') {
        destinoTabla = "Sanes";
        filaNueva = [
            document.getElementById("f-nombre").value,
            document.getElementById("f-monto").value,
            document.getElementById("f-turno").value,
            "Activo"
        ];
    } else {
        destinoTabla = "Productos";
        filaNueva = [
            document.getElementById("f-articulo").value,
            document.getElementById("f-precio").value,
            document.getElementById("f-cuotas").value
        ];
    }
    
    const token = document.getElementById("admin-key").value;
    const payload = {
        action: "ejecutarComandoAdmin",
        password: token,
        subAction: "registrarOperacion",
        tabla: destinoTabla,
        fila: filaNueva
    };
    
    const ejecucion = await consultarServidor(payload);
    forzarLoader(false);
    
    if(ejecucion && ejecucion.success) {
        alert(ejecucion.message);
        document.getElementById("form-registro").reset();
        cambiarFormulario(tipoFormularioActual);
        importarDatosEstadisticas(); // Refresca vitrina al instante
    } else {
        alert("Error en procesamiento: " + ejecucion.error);
    }
}