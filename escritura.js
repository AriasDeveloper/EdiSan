// ==========================================================================
// ESCRITURA.JS V3 - ACCIÓN DIRECTA Y SIN LATENCIA
// ==========================================================================

const generarId = (prefijo) => `${prefijo}-${Math.floor(Math.random() * 9000) + 1000}`;

// Función maestra de envío
async function ejecutarAccion(tabla, accion, datos) {
    actualizarEstadoDB("Procesando...");
    
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ tabla, accion, datos })
        });
        
        // Recarga instantánea tras la operación
        await cargarDatosDesdeBD();
        ocultarTodosLosFormularios();
    } catch (err) {
        console.error("Error al ejecutar:", err);
        alert("Error al conectar con la base de datos.");
    }
}

// Ejemplo de uso para insertar San
async function procesarGuardarSan() {
    const datos = {
        id: document.getElementById("san-form-id").value || generarId("SAN"),
        nombre: document.getElementById("san-nombre").value,
        cuota: document.getElementById("san-cuota").value,
        inicio: document.getElementById("san-inicio").value,
        puestos: document.getElementById("san-puestos").value,
        ciclo: document.getElementById("san-ciclo").value,
        visual: document.getElementById("san-visual").value,
        estado: "Activo"
    };
    await ejecutarAccion("sanes", document.getElementById("san-form-accion").value, datos);
}

// Ejemplo de uso para eliminar
async function eliminarRegistro(tabla, id) {
    if (confirm("¿Eliminar registro " + id + "?")) {
        await ejecutarAccion(tabla, "eliminar", { id: id });
    }
}

// Ocultar modales
function ocultarTodosLosFormularios() {
    document.querySelectorAll(".modal-form").forEach(m => m.style.display = "none");
}