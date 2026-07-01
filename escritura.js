// ==========================================================================
// APERTURA DE MODALES Y FORMULARIOS (Vistas de Escritura)
// ==========================================================================

function abrirFormularioSan(id = "") {
    ocultarTodosLosFormularios();
    document.getElementById("form-san-container").style.display = "block";
    
    if (id) {
        const san = window.baseSanes.find(s => s.id === id);
        document.getElementById("san-modal-title").innerText = `Editar San: ${id}`;
        document.getElementById("san-edit-id").value = id;
        document.getElementById("san-nombre").value = san.nombre;
        document.getElementById("san-cuota").value = san.cuota;
        document.getElementById("san-inicio").value = san.inicio;
        document.getElementById("san-ciclo").value = san.ciclo;
        document.getElementById("san-media-input").value = san.visual;
        
        document.getElementById("label-total-turnos").style.display = "none";
        document.getElementById("san-total-turnos").style.display = "none";
        document.getElementById("san-total-turnos").required = false;
    } else {
        document.getElementById("form-san").reset();
        document.getElementById("san-modal-title").innerText = "Agregar Nuevo San";
        document.getElementById("san-edit-id").value = "";
        document.getElementById("label-total-turnos").style.display = "block";
        document.getElementById("san-total-turnos").style.display = "block";
        document.getElementById("san-total-turnos").required = true;
    }
}

function abrirFormularioCliente(id = "") {
    ocultarTodosLosFormularios();
    document.getElementById("form-cliente-container").style.display = "block";
    
    if (id) {
        const cliente = window.baseClientes.find(c => c.id === id);
        document.getElementById("cliente-modal-title").innerText = `Editar Cliente: ${id}`;
        document.getElementById("cliente-edit-id").value = id;
        document.getElementById("cliente-nombre").value = cliente.nombre;
        document.getElementById("cliente-telefono").value = cliente.telefono;
        document.getElementById("cliente-pass").value = cliente.contrasena;
    } else {
        document.getElementById("form-cliente").reset();
        document.getElementById("cliente-modal-title").innerText = "Agregar Nuevo Cliente";
        document.getElementById("cliente-edit-id").value = "";
    }
}

function abrirFormularioProducto(id = "") {
    ocultarTodosLosFormularios();
    document.getElementById("form-producto-container").style.display = "block";
    
    if (id) {
        const prod = window.baseProductos.find(p => p.id === id);
        document.getElementById("producto-modal-title").innerText = `Editar Producto: ${id}`;
        document.getElementById("producto-edit-id").value = id;
        document.getElementById("producto-nombre").value = prod.nombre;
        document.getElementById("producto-descripcion").value = prod.descripcion;
        document.getElementById("producto-precio").value = prod.precio;
        document.getElementById("producto-stock").value = prod.stock;
        document.getElementById("producto-estado").value = prod.estado;
        document.getElementById("prod-media-input").value = prod.visual;
    } else {
        document.getElementById("form-producto").reset();
        document.getElementById("producto-modal-title").innerText = "Agregar Producto";
        document.getElementById("producto-edit-id").value = "";
    }
}

function abrirAsignacionPuesto(sanId, puestoNum) {
    ocultarTodosLosFormularios();
    const selectClientes = document.getElementById("puesto-cliente-select");
    
    document.getElementById("puesto-san-id").value = sanId;
    document.getElementById("puesto-numero").value = puestoNum;
    document.getElementById("info-puesto-pautar").innerText = `${sanId} - Puesto Número ${puestoNum}`;

    selectClientes.innerHTML = `<option value="">[-- Dejar como Vacante Libre --]</option>`;
    window.baseClientes.forEach(c => {
        selectClientes.innerHTML += `<option value="${c.id}">${c.nombre} (${c.id})</option>`;
    });

    const puestoActual = window.baseTurnosPuestos.find(t => t.san_id === sanId && t.puesto === puestoNum);
    if(puestoActual && puestoActual.cliente_id) selectClientes.value = puestoActual.cliente_id;

    document.getElementById("form-asignacion-puesto-container").style.display = "block";
}

function abrirAprobacionNuevoModal(solId) {
    ocultarTodosLosFormularios();
    const sol = window.baseSolicitudesNuevos.find(s => s.id === solId);
    document.getElementById("modal-nuevo-sol-id").value = solId;
    document.getElementById("modal-nuevo-san-id").value = sol.san_id;
    document.getElementById("info-solicitud-nuevo-texto").innerText = `Asignar puesto para ${sol.nombre}`;

    const selectPuestos = document.getElementById("modal-nuevo-puesto-select");
    selectPuestos.innerHTML = "";

    const vacantes = window.baseTurnosPuestos.filter(t => t.san_id === sol.san_id && (!t.cliente_id || t.cliente_id === ""));

    if (vacantes.length === 0) {
        selectPuestos.innerHTML = `<option value="">❌ Sin puestos libres</option>`;
    } else {
        vacantes.forEach(v => {
            selectPuestos.innerHTML += `<option value="${v.puesto}">Puesto ${v.puesto} (Corte: ${v.corte})</option>`;
        });
    }
    document.getElementById("form-aprobar-nuevo-container").style.display = "block";
}

// ==========================================================================
// ACCIONES DE PROCESAMIENTO Y ENVÍO A GOOGLE SHEETS (POST)
// ==========================================================================

// Guardar o Editar SAN
document.getElementById("form-san").addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = document.getElementById("san-edit-id").value;
    const nombre = document.getElementById("san-nombre").value;
    const cuota = parseFloat(document.getElementById("san-cuota").value);
    const inicio = document.getElementById("san-inicio").value;
    const ciclo = document.getElementById("san-ciclo").value;
    const visual = document.getElementById("san-media-input").value;

    if (editId) {
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
        
        // 1. Insertar fila cabecera del San
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                tabla: "sanes", accion: "insertar", datos: { id: nuevoId, nombre, cuota, inicio, puestos: totalPuestos, ciclo, visual, estado: "A la espera de clientes" }
            })
        });

        // 2. Generar turnos en cascada secuencialmente
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
    finalizarEscrituraFluidos();
});

// Guardar o Editar Cliente
document.getElementById("form-cliente").addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = document.getElementById("cliente-edit-id").value;
    const nombre = document.getElementById("cliente-nombre").value;
    const telefono = document.getElementById("cliente-telefono").value;
    const contrasena = document.getElementById("cliente-pass").value;

    if (editId) {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ tabla: "clientes", accion: "editar", datos: { id: editId, nombre, telefono, contrasena } })
        });
    } else {
        const nuevoId = "CLI-" + Date.now().toString().slice(-4);
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ tabla: "clientes", accion: "insertar", datos: { id: nuevoId, nombre, telefono, contrasena } })
        });
    }
    finalizarEscrituraFluidos();
});

// Guardar o Editar Producto
document.getElementById("form-producto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = document.getElementById("producto-edit-id").value;
    const nombre = document.getElementById("producto-nombre").value;
    const descripcion = document.getElementById("producto-descripcion").value;
    const precio = parseFloat(document.getElementById("producto-precio").value);
    const stock = parseInt(document.getElementById("producto-stock").value);
    const estado = document.getElementById("producto-estado").value;
    const visual = document.getElementById("prod-media-input").value;

    if (editId) {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ tabla: "productos", accion: "editar", datos: { id: editId, nombre, descripcion, precio, stock, estado, visual } })
        });
    } else {
        const nuevoId = "PROD-" + Date.now().toString().slice(-4);
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ tabla: "productos", accion: "insertar", datos: { id: nuevoId, nombre, descripcion, precio, stock, estado, visual } })
        });
    }
    finalizarEscrituraFluidos();
});

// Asignar u Ocupar fila de puesto de cadena manual
document.getElementById("form-pautar-puesto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const sanId = document.getElementById("puesto-san-id").value;
    const num = parseInt(document.getElementById("puesto-numero").value);
    const clienteSeleccionado = document.getElementById("puesto-cliente-select").value || "";

    let nuevoPago = "Sin Pago";
    if (clienteSeleccionado !== "") {
        const match = window.baseTurnosPuestos.find(t => t.san_id === sanId && t.puesto === num);
        if(match) nuevoPago = match.pago;
    }

    await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ tabla: "turnos_puestos", accion: "editar", datos: { san_id: sanId, puesto: num, cliente_id: clienteSeleccionado, pago: nuevoPago } })
    });
    finalizarEscrituraFluidos();
});

// Actualización Inmediata y Cambio de Pago Rápido desde la tarjeta del bloque
async function cambiarPagoRapido(sanId, puestoNum, nuevoEstado) {
    await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ tabla: "turnos_puestos", accion: "editar", datos: { san_id: sanId, puesto: puestoNum, pago: nuevoEstado } })
    });
    
    // Modificación acelerada en caché local para respuesta visual instantánea
    const match = window.baseTurnosPuestos.find(t => t.san_id === sanId && t.puesto === puestoNum);
    if(match) match.pago = nuevoEstado;
    renderizarUI();
}

// Aprobar solicitud de cliente externo e inscribir directamente en el puesto
document.getElementById("form-aprobar-nuevo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const solId = document.getElementById("modal-nuevo-sol-id").value;
    const sanId = document.getElementById("modal-nuevo-san-id").value;
    const puestoElegido = parseInt(document.getElementById("modal-nuevo-puesto-select").value);

    if (!puestoElegido) return;
    const sol = window.baseSolicitudesNuevos.find(s => s.id === solId);
    const nuevoCliId = "CLI-" + Date.now().toString().slice(-4);

    // 1. Registro de nuevo cliente
    await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ tabla: "clientes", accion: "insertar", datos: { id: nuevoCliId, nombre: sol.nombre, telefono: sol.telefono, contrasena: "1234" } })
    });
    // 2. Asignación del puesto en la cadena
    await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ tabla: "turnos_puestos", accion: "editar", datos: { san_id: sanId, puesto: puestoElegido, cliente_id: nuevoCliId, pago: "Sin Pago" } })
    });
    // 3. Remover solicitud procesada de la cola
    await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ tabla: "solicitudes_nuevos", accion: "editar", datos: { id: solId } }) // El script asume limpieza o remoción según los campos provistos
    });

    finalizarEscrituraFluidos();
});

// SIMULAR LLEGADA DE FECHAS DE CORTE AUTOMÁTICAS
async function simularLlegadaDeCortes() {
    const fechaDeHoy = new Date(); 
    let modificados = 0;

    for (let puesto of window.baseTurnosPuestos) {
        const fechaCortePuesto = new Date(puesto.corte);
        if (fechaDeHoy >= fechaCortePuesto && puesto.pago === "Sin Pago") {
            puesto.pago = "Pendiente";
            modificados++;
            
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({ tabla: "turnos_puestos", accion: "editar", datos: { san_id: puesto.san_id, puesto: puesto.puesto, pago: "Pendiente" } })
            });
        }
    }
    
    if (modificados > 0) {
        finalizarEscrituraFluidos();
        alert(`Escáner Finalizado: ${modificados} puestos cambiaron su estado a 'Pendiente'.`);
    } else {
        alert("Escáner Finalizado: Todos los registros se encuentran al día.");
    }
}

// Cierre fluido de formularios con reconexión limpia a la carga masiva
function finalizarEscrituraFluidos() {
    setTimeout(async () => {
        if (typeof cargarDatosDesdeBD === "function") {
            await cargarDatosDesdeBD();
        }
        ocultarTodosLosFormularios();
    }, 450); // Tiempo de espera prudencial para mitigar la latencia de procesamiento asíncrono de Google Sheets
}