// ==========================================================================
// BASEEDIMAR ESCRITURA.JS V2 - GESTIÓN DE IDs, ELIMINACIÓN Y RESPUESTA RÁPIDA
// ==========================================================================

// Generador de IDs únicos (Ej: SAN-172033)
function generarId(prefijo) {
    return `${prefijo}-${Date.now().toString().slice(-6)}`;
}

// Lógica universal de eliminación
async function eliminarRegistro(tabla, id) {
    if (!confirm(`¿Estás seguro de eliminar el registro ${id}?`)) return;
    actualizarEstadoDB("guardando");
    await enviarDatosCloud(tabla, "eliminar", { id: id });
    finalizarEscrituraFluidos();
}

// PROCESADOR UNIFICADO: Guardar San
async function procesarGuardarSan() {
    const accion = document.getElementById("san-form-accion").value;
    const payload = {
        id: document.getElementById("san-form-id").value || generarId("SAN"),
        nombre: document.getElementById("san-nombre").value,
        cuota: document.getElementById("san-cuota").value,
        inicio: document.getElementById("san-inicio").value,
        puestos: document.getElementById("san-puestos").value,
        ciclo: document.getElementById("san-ciclo").value,
        visual: document.getElementById("san-visual").value,
        estado: "A la espera de clientes"
    };

    actualizarEstadoDB("guardando");
    await enviarDatosCloud("sanes", accion, payload);
    
    // Generar los puestos automáticamente solo si es inserción
    if (accion === "insertar") {
        for (let i = 1; i <= parseInt(payload.puestos); i++) {
            await enviarDatosCloud("turnos_puestos", "insertar", {
                san_id: payload.id, puesto: i.toString(), cliente_id: "", corte: "", pago: "Sin Pago"
            });
        }
    }
    finalizarEscrituraFluidos();
}

// PROCESADOR UNIFICADO: Guardar Cliente
async function procesarGuardarCliente() {
    const accion = document.getElementById("cliente-form-accion").value;
    const payload = {
        id: document.getElementById("cliente-form-id").value || generarId("CLI"),
        nombre: document.getElementById("cliente-nombre").value,
        telefono: document.getElementById("cliente-telefono").value,
        contrasena: document.getElementById("cliente-contrasena").value
    };

    actualizarEstadoDB("guardando");
    await enviarDatosCloud("clientes", accion, payload);
    finalizarEscrituraFluidos();
}

// PROCESADOR UNIFICADO: Guardar Producto
async function procesarGuardarProducto() {
    const accion = document.getElementById("producto-form-accion").value;
    const payload = {
        id: document.getElementById("producto-form-id").value || generarId("PROD"),
        nombre: document.getElementById("producto-nombre").value,
        descripcion: document.getElementById("producto-descripcion").value,
        precio: document.getElementById("producto-precio").value,
        visual: document.getElementById("producto-visual").value,
        stock: document.getElementById("producto-stock").value,
        estado: document.getElementById("producto-estado").value
    };

    actualizarEstadoDB("guardando");
    await enviarDatosCloud("productos", accion, payload);
    finalizarEscrituraFluidos();
}

// PASARELA DE TRANSPORTE (POST a Apps Script)
async function enviarDatosCloud(tabla, accion, datos) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ tabla, accion, datos })
        });
    } catch (err) { console.error("Error de envío:", err); }
}

// FINALIZACIÓN RÁPIDA (100ms)
function finalizarEscrituraFluidos() {
    setTimeout(async () => {
        await cargarDatosDesdeBD();
        ocultarTodosLosFormularios();
    }, 100); 
}