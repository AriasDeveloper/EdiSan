// ==========================================================================
// BASEEDIMAR CLOUD API - MÓDULO DE ESCRITURA Y ACCIONES (escritura.js)
// ==========================================================================

/**
 * Funciones globales para abrir Modales de Edición / Creación
 * Mapean los datos de la caché global hacia los inputs de los formularios
 */
function abrirFormularioSan(id = "") {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-san-modal");
    if (!modal) return;

    // Resetear formulario por defecto
    document.getElementById("san-form-id").value = id;
    document.getElementById("san-form-accion").value = id ? "editar" : "insertar";
    document.getElementById("san-titulo-dinamico").innerText = id ? "✏️ Editar San" : "✨ Crear Nuevo San";
    
    const fields = ["san-nombre", "san-cuota", "san-inicio", "san-puestos", "san-ciclo", "san-visual"];
    fields.forEach(f => { const el = document.getElementById(f); if(el) el.value = ""; });

    // Si es edición, poblar con los datos existentes en la caché
    if (id) {
        const san = window.baseSanes.find(s => (s.id || s.san_id) === id);
        if (san) {
            if(document.getElementById("san-nombre")) document.getElementById("san-nombre").value = san.nombre || san.nombre_san || "";
            if(document.getElementById("san-cuota")) document.getElementById("san-cuota").value = san.cuota || san.monto_cuota || "";
            if(document.getElementById("san-inicio")) document.getElementById("san-inicio").value = san.inicio || san.fecha_inicio || "";
            if(document.getElementById("san-puestos")) document.getElementById("san-puestos").value = san.puestos || san.total_turnos || "";
            if(document.getElementById("san-ciclo")) document.getElementById("san-ciclo").value = san.ciclo || "";
            if(document.getElementById("san-visual")) document.getElementById("san-visual").value = san.visual || "";
        }
    }
    modal.style.display = "flex";
}

function abrirFormularioCliente(id = "") {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-cliente-modal");
    if (!modal) return;

    document.getElementById("cliente-form-id").value = id;
    document.getElementById("cliente-form-accion").value = id ? "editar" : "insertar";
    document.getElementById("cliente-titulo-dinamico").innerText = id ? "✏️ Editar Cliente" : "✨ Registrar Cliente";

    const fields = ["cliente-nombre", "cliente-telefono", "cliente-contrasena"];
    fields.forEach(f => { const el = document.getElementById(f); if(el) el.value = ""; });

    if (id) {
        const cli = window.baseClientes.find(c => (c.id || c.cliente_id) === id);
        if (cli) {
            if(document.getElementById("cliente-nombre")) document.getElementById("cliente-nombre").value = cli.nombre || cli.nombre_completo || "";
            if(document.getElementById("cliente-telefono")) document.getElementById("cliente-telefono").value = cli.telefono || "";
            if(document.getElementById("cliente-contrasena")) document.getElementById("cliente-contrasena").value = cli.contrasena || cli.contraseña || "";
        }
    }
    modal.style.display = "flex";
}

function abrirFormularioProducto(id = "") {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-producto-modal");
    if (!modal) return;

    document.getElementById("producto-form-id").value = id;
    document.getElementById("producto-form-accion").value = id ? "editar" : "insertar";
    document.getElementById("producto-titulo-dinamico").innerText = id ? "✏️ Editar Producto" : "✨ Añadir Producto";

    const fields = ["producto-nombre", "producto-descripcion", "producto-precio", "producto-visual", "producto-stock", "producto-estado"];
    fields.forEach(f => { const el = document.getElementById(f); if(el) el.value = ""; });

    if (id) {
        const prod = window.baseProductos.find(p => (p.id || p.producto_id) === id);
        if (prod) {
            if(document.getElementById("producto-nombre")) document.getElementById("producto-nombre").value = prod.nombre || "";
            if(document.getElementById("producto-descripcion")) document.getElementById("producto-descripcion").value = prod.descripcion || "";
            if(document.getElementById("producto-precio")) document.getElementById("producto-precio").value = prod.precio || "";
            if(document.getElementById("producto-visual")) document.getElementById("producto-visual").value = prod.visual || "";
            if(document.getElementById("producto-stock")) document.getElementById("producto-stock").value = prod.stock || "";
            if(document.getElementById("producto-estado")) document.getElementById("producto-estado").value = prod.estado || "Disponible";
        }
    }
    modal.style.display = "flex";
}

function abrirAsignacionPuesto(sanId, puestoNum) {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-puesto-modal");
    if (!modal) return;

    document.getElementById("puesto-form-san-id").value = sanId;
    document.getElementById("puesto-form-num").value = puestoNum;

    // Poblar select de clientes disponibles
    const selectCliente = document.getElementById("puesto-select-cliente");
    if (selectCliente) {
        selectCliente.innerHTML = `<option value="">❌ Dejar Vacante (Disponible)</option>`;
        window.baseClientes.forEach(c => {
            selectCliente.innerHTML += `<option value="${c.id || c.cliente_id}">${c.nombre || c.nombre_completo}</option>`;
        });
    }

    // Cargar datos actuales del puesto si existen
    const puestoObj = window.baseTurnosPuestos.find(t => t.san_id === sanId && parseInt(t.puesto) === parseInt(puestoNum));
    if (puestoObj) {
        if(selectCliente) selectCliente.value = puestoObj.cliente_id || "";
        if(document.getElementById("puesto-corte")) document.getElementById("puesto-corte").value = puestoObj.corte || "";
        if(document.getElementById("puesto-pago")) document.getElementById("puesto-pago").value = puestoObj.pago || "Sin Pago";
    }

    modal.style.display = "flex";
}

function abrirAprobacionNuevoModal(solicitudId) {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-aprobacion-modal");
    if (!modal) return;

    const sol = window.baseSolicitudesNuevos.find(s => (s.id || s.solicitud_id) === solicitudId);
    if (!sol) return;

    document.getElementById("aprobacion-solicitud-id").value = solicitudId;
    document.getElementById("aprobacion-nombre").value = sol.nombre || sol.nombre_completo || "";
    document.getElementById("aprobacion-telefono").value = sol.telefono || "";
    document.getElementById("aprobacion-san-target").value = sol.san_id || "";

    // Filtrar puestos vacíos de ese San específico para ofrecerlos
    const selectPuesto = document.getElementById("aprobacion-select-puesto");
    if (selectPuesto) {
        selectPuesto.innerHTML = "";
        const puestosTarget = window.baseTurnosPuestos.filter(t => t.san_id === sol.san_id && (!t.cliente_id || t.cliente_id.trim() === ""));
        
        if(puestosTarget.length === 0) {
            selectPuesto.innerHTML = `<option value="">⚠️ No hay puestos libres en este San</option>`;
        } else {
            puestosTarget.forEach(p => {
                selectPuesto.innerHTML += `<option value="${p.puesto}">Puesto Número ${p.puesto} (Corte: ${p.corte || 'No asignada'})</option>`;
            });
        }
    }

    modal.style.display = "flex";
}

/**
 * PROCESADORES INTERNOS DE ENVÍO (Submit Event Handlers)
 */

async function procesarGuardarSan() {
    const id = document.getElementById("san-form-id").value;
    const accion = document.getElementById("san-form-accion").value;
    
    const payload = {
        id: id || `SAN-${Date.now().toString().slice(-4)}`, // Generar ID automático si es nuevo
        nombre: document.getElementById("san-nombre").value,
        cuota: document.getElementById("san-cuota").value,
        inicio: document.getElementById("san-inicio").value,
        puestos: document.getElementById("san-puestos").value,
        ciclo: document.getElementById("san-ciclo").value,
        visual: document.getElementById("san-visual").value,
        estado: accion === "insertar" ? "A la espera de clientes" : undefined
    };

    actualizarEstadoDB("guardando");
    await enviarDatosCloud("sanes", accion, payload);
    
    // Si es un San nuevo, creamos automáticamente sus slots o registros de puestos vacíos
    if (accion === "insertar") {
        const totalPuestos = parseInt(payload.puestos) || 0;
        for (let i = 1; i <= totalPuestos; i++) {
            await enviarDatosCloud("turnos_puestos", "insertar", {
                san_id: payload.id,
                puesto: i.toString(),
                cliente_id: "",
                corte: "",
                pago: "Sin Pago"
            });
        }
    }
    finalizarEscrituraFluidos();
}

async function procesarGuardarCliente() {
    const id = document.getElementById("cliente-form-id").value;
    const accion = document.getElementById("cliente-form-accion").value;

    const payload = {
        id: id || `CLI-${Date.now().toString().slice(-4)}`,
        nombre: document.getElementById("cliente-nombre").value,
        telefono: document.getElementById("cliente-telefono").value,
        contrasena: document.getElementById("cliente-contrasena").value
    };

    actualizarEstadoDB("guardando");
    await enviarDatosCloud("clientes", accion, payload);
    finalizarEscrituraFluidos();
}

async function procesarGuardarProducto() {
    const id = document.getElementById("producto-form-id").value;
    const accion = document.getElementById("producto-form-accion").value;

    const payload = {
        id: id || `PROD-${Date.now().toString().slice(-4)}`,
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

async function procesarAsignacionPuestoManual() {
    const sanId = document.getElementById("puesto-form-san-id").value;
    const puestoNum = document.getElementById("puesto-form-num").value;

    const payload = {
        san_id: sanId,
        puesto: puestoNum,
        cliente_id: document.getElementById("puesto-select-cliente").value,
        corte: document.getElementById("puesto-corte").value,
        pago: document.getElementById("puesto-pago").value
    };

    actualizarEstadoDB("guardando");
    await enviarDatosCloud("turnos_puestos", "editar", payload);
    finalizarEscrituraFluidos();
}

async function cambiarPagoRapido(sanId, puestoNum, nuevoPago) {
    const puestoObj = window.baseTurnosPuestos.find(t => t.san_id === sanId && parseInt(t.puesto) === parseInt(puestoNum));
    if (!puestoObj) return;

    const payload = {
        san_id: sanId,
        puesto: puestoNum.toString(),
        cliente_id: puestoObj.cliente_id || "",
        corte: puestoObj.corte || "",
        pago: nuevoPago
    };

    actualizarEstadoDB("guardando");
    await enviarDatosCloud("turnos_puestos", "editar", payload);
    finalizarEscrituraFluidos();
}

async function procesarAprobacionSolicitud() {
    const solicitudId = document.getElementById("aprobacion-solicitud-id").value;
    const nombre = document.getElementById("aprobacion-nombre").value;
    const telefono = document.getElementById("aprobacion-telefono").value;
    const sanId = document.getElementById("aprobacion-san-target").value;
    const puestoElegido = document.getElementById("aprobacion-select-puesto").value;

    if (!puestoElegido) {
        alert("Error: Debes seleccionar un número de puesto válido para realizar la aprobación.");
        return;
    }

    actualizarEstadoDB("guardando");

    // 1. Crear el nuevo perfil de cliente oficial
    const nuevoClienteId = `CLI-${Date.now().toString().slice(-4)}`;
    await enviarDatosCloud("clientes", "insertar", {
        id: nuevoClienteId,
        nombre: nombre,
        telefono: telefono,
        contrasena: "1234" // Contraseña por defecto asignada automáticamente
    });

    // 2. Colocar al cliente en el puesto correspondiente de la tabla de turnos
    await enviarDatosCloud("turnos_puestos", "editar", {
        san_id: sanId,
        puesto: puestoElegido.toString(),
        cliente_id: nuevoClienteId,
        pago: "Sin Pago"
    });

    // 3. Eliminar la solicitud de la pestaña activa (En Apps Script la limpia editando el ID a vacío o lo manejamos removiendo)
    await enviarDatosCloud("solicitudes_nuevos", "editar", {
        id: solicitudId,
        nombre: `[APROBADO] ${nombre}`, // Marca visual de control histórico en Sheets
        san_id: "" 
    });

    finalizarEscrituraFluidos();
}

/**
 * PASARELA DE TRANSPORTE BLINDADO POST (Engaña al navegador con text/plain para evadir OPTIONS Preflight CORS)
 */
async function enviarDatosCloud(tablaDestino, accionEjecutar, datosObjeto) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: {
                "Content-Type": "text/plain" 
            },
            body: JSON.stringify({
                tabla: tablaDestino,
                accion: accionEjecutar,
                datos: datosObjeto
            })
        });
        return true;
    } catch (err) {
        console.error(`Fallo crítico de envío en la tabla ${tablaDestino}:`, err);
        return false;
    }
}

/**
 * CIERRE Y RE-SINCRONIZACIÓN FLUIDA DE INTERFAZ
 */
function finalizarEscrituraFluidos() {
    setTimeout(async () => {
        if (typeof cargarDatosDesdeBD === "function") {
            // Re-descarga el paquete global para actualizar las tablas con los datos reales de la nube
            await cargarDatosDesdeBD(); 
        }
        ocultarTodosLosFormularios();
    }, 800); // Margen de retardo para garantizar la escritura en el servidor de Google
}