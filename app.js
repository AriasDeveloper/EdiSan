// URL DE TU APLICACIÓN WEB DE GOOGLE APP SCRIPT
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec";

const LIBRERIA_ICONOS = {
    "👑": "Oro/Corona", "💎": "Plata/Diamante", "💰": "Ahorro/Hucha", "📈": "Inversión",
    "📺": "TV/Smart", "📱": "Celular", "💻": "Laptop/PC", "🧺": "Lavadora"
};

// Caché local para renderizado inmediato
let baseSanes = [];
let baseClientes = [];
let baseTurnosPuestos = [];
let baseSolicitudesNuevos = [];
let baseSolicitudesInscritos = [];
let baseProductos = [];

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

        baseSanes = Array.isArray(resSanes) ? resSanes : [];
        baseClientes = Array.isArray(resClientes) ? resClientes : [];
        baseTurnosPuestos = Array.isArray(resTurnos) ? resTurnos : [];
        baseSolicitudesNuevos = Array.isArray(resSolNuevos) ? resSolNuevos : [];
        baseProductos = Array.isArray(resProd) ? resProd : [];

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
    actualizarTablaProductosUI();
}

// LÓGICA AUTOMÁTICA DE ESTADOS (Sincroniza de vuelta a Google Sheets si cambia)
function calcularEstadosSanesAutomaticamente() {
    const fechaActual = new Date();
    baseSanes.forEach(async (san) => {
        const puestosId = baseTurnosPuestos.filter(t => t.san_id === san.id);
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
            // Guardar cambio de estado automático en Google Sheets en segundo plano
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({ tabla: "sanes", accion: "editar", datos: { id: san.id, estado: nuevoEstado } })
            });
        }
    });
}

// ==========================================================================
// ESCRITURA / ACTUALIZACIÓN EN GOOGLE SHEETS (POST)
// ==========================================================================
document.getElementById("form-san").addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = document.getElementById("san-edit-id").value;
    const nombre = document.getElementById("san-nombre").value;
    const cuota = parseFloat(document.getElementById("san-cuota").value);
    const inicio = document.getElementById("san-inicio").value;
    const ciclo = document.getElementById("san-ciclo").value;
    const visual = document.getElementById("san-media-input").value;

    if (editId) {
        // Envío de edición a Google Sheets
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                tabla: "sanes", accion: "editar", datos: { id: editId, nombre, cuota, inicio, ciclo, visual }
            })
        });
    } else {
        const nuevoId = "SAN-" + Date.now().toString().slice(-4);
        const totalPuestos = parseInt(document.getElementById("san-total-turnos").value);
        
        // 1. Insertar fila del San
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                tabla: "sanes", accion: "insertar", datos: { id: nuevoId, nombre, cuota, inicio, puestos: totalPuestos, ciclo, visual, estado: "A la espera de clientes" }
            })
        });

        // 2. Generar turnos asociados secuencialmente en Google Sheets
        let fechaCorte = new Date(inicio + "T00:00:00");
        for (let i = 1; i <= totalPuestos; i++) {
            let corteStr = fechaCorte.toISOString().split('T')[0];
            
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    tabla: "turnos_puestos", accion: "insertar", datos: { san_id: nuevoId, puesto: i, cliente_id: "", pago: "Sin Pago", corte: corteStr }
                })
            });

            if (ciclo === "Semanal") fechaCorte.setDate(fechaCorte.getDate() + 7);
            else if (ciclo === "Quincenal") fechaCorte.setDate(fechaCorte.getDate() + 15);
            else fechaCorte.setMonth(fechaCorte.getMonth() + 1);
        }
    }
    
    // Recargar datos y limpiar vista
    setTimeout(async () => {
        await cargarDatosDesdeBD();
        ocultarTodosLosFormularios();
    }, 500); // Pequeña espera para asegurar que Google procese la cola de escritura
});

// ACTUALIZACIÓN DE PAGO RÁPIDO
async function cambiarPagoRapido(sanId, puestoNum, nuevoEstado) {
    await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            tabla: "turnos_puestos",
            accion: "editar",
            datos: { san_id: sanId, puesto: puestoNum, pago: nuevoEstado } // El script usará san_id y puesto para localizar la fila
        })
    });
    // Actualizamos localmente de inmediato para que la interfaz se sienta instantánea
    const match = baseTurnosPuestos.find(t => t.san_id === sanId && t.puesto === puestoNum);
    if(match) match.pago = nuevoEstado;
    renderizarUI();
}

// El resto de funciones de renderizado de tablas (actualizarTablaSanesUI, dibujarBloquesDeTurnos, etc.) se quedan exactamente igual a como las tenías, ya que leen del mismo formato de arreglos de objetos.