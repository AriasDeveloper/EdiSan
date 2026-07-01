// ==========================================================================
// 1. DICCIONARIO MAESTRO DE 12 ICONOS (REALES Y VISUALES)
// ==========================================================================
const LIBRERIA_ICONOS = {
    "👑": "Oro/Corona",
    "💎": "Plata/Diamante",
    "💰": "Ahorro/Hucha",
    "📈": "Inversión/Progreso",
    "📺": "TV/Smart",
    "📱": "Celular/Móvil",
    "💻": "Laptop/PC",
    "🧺": "Lavadora/Hogar",
    "🏠": "Inmueble/Vivienda",
    "🚗": "Vehículo/Moto",
    "🔥": "Oferta/Fuego",
    "📦": "Producto/Caja"
};

// ==========================================================================
// 2. BASES DE DATOS EN MEMORIA LOCAL VOLÁTIL
// ==========================================================================
let baseSanes = [
    { id: "SAN-001", nombre: "San Oro Premium", cuota: 50, inicio: "2026-07-01", puestos: 5, ciclo: "Semanal", visual: "👑" }
];

let baseClientes = [
    { id: "CLI-001", nombre: "Juan Pérez", telefono: "04120000000", pass: "1234" },
    { id: "CLI-002", nombre: "Anamaría Rivas", telefono: "04147778899", pass: "abcd" }
];

let baseTurnosPuestos = [
    { sanId: "SAN-001", puesto: 1, clienteId: "CLI-001", pago: "Al Día", corte: "2026-07-01" },
    { sanId: "SAN-001", puesto: 2, clienteId: "", pago: "Sin Pago", corte: "2026-07-08" },
    { sanId: "SAN-001", puesto: 3, clienteId: "", pago: "Sin Pago", corte: "2026-07-15" },
    { sanId: "SAN-001", puesto: 4, clienteId: "", pago: "Sin Pago", corte: "2026-07-22" },
    { sanId: "SAN-001", puesto: 5, clienteId: "", pago: "Sin Pago", corte: "2026-07-29" }
];

let baseSolicitudesNuevos = [
    { id: "SOL-001", nombre: "Carlos Mendoza", telefono: "04245551122", sanId: "SAN-001", puesto: 2 }
];

let baseSolicitudesInscritos = [
    { id: "PROP-001", clienteId: "CLI-002", sanId: "SAN-001", fecha: "2026-07-01" }
];

let baseProductos = [
    { id: "PROD-001", nombre: "Smart TV 55 Pulgadas", descripcion: "Resolución 4K UHD UltraSlim", precio: 450, visual: "📺", stock: 8, estado: "Disponible" }
];

// ==========================================================================
// 3. ARRANQUE E INTERRUPTOR DE PESTAÑAS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const enlacesMenu = document.querySelectorAll("nav ul li a");
    const secciones = document.querySelectorAll("main section");

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener("click", (e) => {
            e.preventDefault();
            enlacesMenu.forEach(link => link.classList.remove("active"));
            enlace.classList.add("active");
            secciones.forEach(sec => sec.style.display = "none");
            
            const targetId = enlace.getAttribute("href");
            document.querySelector(targetId).style.display = "block";
        });
    });

    // Cargar Paletas de Iconos en formularios
    inicializarGridIconos();

    // Render Inicial Completo
    renderizarTodo();

    // Mostrar sección inicial (Sanes)
    secciones[0].style.display = "block";
});

function renderizarTodo() {
    actualizarTablaSanesUI();
    actualizarTablaClientesUI();
    dibujarBloquesDeTurnos();
    actualizarTablaSolicitudesNuevosUI();
    actualizarTablaSolicitudesInscritosUI();
    actualizarTablaProductosUI();
}

// Inicializa las cuadriculas de iconos inyectando la librería mapeada
function inicializarGridIconos() {
    document.querySelectorAll(".icon-selector-grid").forEach(grid => {
        grid.innerHTML = "";
        const targetInputId = grid.getAttribute("data-input");
        Object.keys(LIBRERIA_ICONOS).forEach(icono => {
            const opt = document.createElement("div");
            opt.className = "icon-opt";
            opt.innerHTML = `
                <span class="icon-opt-visual">${icono}</span>
                <span class="icon-opt-label">${LIBRERIA_ICONOS[icono]}</span>
            `;
            opt.addEventListener("click", () => {
                document.getElementById(targetInputId).value = icono;
                grid.querySelectorAll(".icon-opt").forEach(o => o.classList.remove("selected"));
                opt.classList.add("selected");
            });
            grid.appendChild(opt);
        });
    });
}

// Renderizador Multimedia Inteligente (Regla 8)
function obtenerCeldaMultimedia(valor) {
    if (!valor) return `<span class="render-icon">📦</span>`;
    if (Object.keys(LIBRERIA_ICONOS).includes(valor)) {
        return `<span class="render-icon">${valor}</span>`;
    }
    return `<img src="${valor}" class="img-render" onerror="this.onerror=null; this.replaceWith('📦');">`;
}

// ==========================================================================
// 4. LÓGICA DE SANES (CORRECCIÓN REGLA 1: EDITAR EN LUGAR DE CREAR)
// ==========================================================================
function abrirFormularioSan(id = "") {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-san-container");
    modal.style.display = "block";

    if (id) {
        // MODO EDICIÓN
        const san = baseSanes.find(s => s.id === id);
        document.getElementById("san-modal-title").innerText = `Editar San: ${id}`;
        document.getElementById("san-edit-id").value = id;
        document.getElementById("san-nombre").value = san.nombre;
        document.getElementById("san-cuota").value = san.cuota;
        document.getElementById("san-inicio").value = san.inicio;
        document.getElementById("san-estado").value = san.estado;
        document.getElementById("san-ciclo").value = san.ciclo;
        document.getElementById("san-media-input").value = san.visual;
        
        // Ocultar campo de turnos al editar (no se debe re-alterar el número de puestos creados sobre la marcha)
        document.getElementById("label-total-turnos").style.display = "none";
        document.getElementById("san-total-turnos").style.display = "none";
        document.getElementById("san-total-turnos").required = false;
    } else {
        // MODO NUEVO
        document.getElementById("form-san").reset();
        document.getElementById("san-modal-title").innerText = "Agregar Nuevo San";
        document.getElementById("san-edit-id").value = "";
        document.getElementById("label-total-turnos").style.display = "block";
        document.getElementById("san-total-turnos").style.display = "block";
        document.getElementById("san-total-turnos").required = true;
    }
}

document.getElementById("form-san").addEventListener("submit", (e) => {
    e.preventDefault();
    const editId = document.getElementById("san-edit-id").value;
    const nombre = document.getElementById("san-nombre").value;
    const cuota = parseInt(document.getElementById("san-cuota").value);
    const inicio = document.getElementById("san-inicio").value;
    const estado = document.getElementById("san-estado").value;
    const ciclo = document.getElementById("san-ciclo").value;
    const visual = document.getElementById("san-media-input").value;

    if (editId) {
        // Guardado de EDICIÓN real
        const san = baseSanes.find(s => s.id === editId);
        san.nombre = nombre;
        san.cuota = cuota;
        san.inicio = inicio;
        san.estado = estado;
        san.ciclo = ciclo;
        san.visual = visual;
    } else {
        // Guardado de NUEVO registro
        const nuevoId = "SAN-00" + (baseSanes.length + 1);
        const totalPuestos = parseInt(document.getElementById("san-total-turnos").value);
        
        baseSanes.push({ id: nuevoId, nombre, cuota, inicio, puestos: totalPuestos, ciclo, visual });

        // Creación automatizada de puestos vacíos
        let fechaCorte = new Date(inicio);
        for (let i = 1; i <= totalPuestos; i++) {
            baseTurnosPuestos.push({
                sanId: nuevoId, puesto: i, clienteId: "", pago: "Sin Pago", corte: fechaCorte.toISOString().split('T')[0]
            });
            if (ciclo === "Semanal") fechaCorte.setDate(fechaCorte.getDate() + 7);
            else if (ciclo === "Quincenal") fechaCorte.setDate(fechaCorte.getDate() + 15);
            else fechaCorte.setMonth(fechaCorte.getMonth() + 1);
        }
    }
    renderizarTodo();
    ocultarTodosLosFormularios();
});

function eliminarSan(id) {
    if(confirm(`¿Deseas eliminar el San ${id} y todos sus turnos asociados?`)) {
        baseSanes = baseSanes.filter(s => s.id !== id);
        baseTurnosPuestos = baseTurnosPuestos.filter(t => t.sanId !== id);
        renderizarTodo();
    }
}

function actualizarTablaSanesUI() {
    const tbody = document.getElementById("tabla-sanes-body");
    tbody.innerHTML = "";
    baseSanes.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td>${s.id}</td>
                <td><b>${s.nombre}</b></td>
                <td>$${s.cuota}</td>
                <td>${s.inicio}</td>
                <td>${s.puestos}</td>
                <td>${s.estado}</td>
                <td>${s.ciclo}</td>
                <td>${obtenerCeldaMultimedia(s.visual)}</td>
                <td>
                    <button type="button" class="btn-edit" onclick="abrirFormularioSan('${s.id}')">Editar</button>
                    <button type="button" class="btn-delete" onclick="eliminarSan('${s.id}')">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

// ==========================================================================
// 5. LÓGICA DE CLIENTES (CORRECCIÓN REGLA 2: EDITAR CON DATOS AUTO-CARGADOS)
// ==========================================================================
function abrirFormularioCliente(id = "") {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-cliente-container");
    modal.style.display = "block";

    if (id) {
        // MODO EDICIÓN CON CARGA EFECTIVA DE DATOS EXISENTES
        const cli = baseClientes.find(c => c.id === id);
        document.getElementById("cliente-modal-title").innerText = `Editar Cliente: ${id}`;
        document.getElementById("cliente-edit-id").value = id;
        document.getElementById("cliente-nombre").value = cli.nombre;
        document.getElementById("cliente-telefono").value = cli.telefono;
        document.getElementById("cliente-pass").value = cli.pass;
    } else {
        // MODO CREACIÓN LIMPIA
        document.getElementById("form-cliente").reset();
        document.getElementById("cliente-modal-title").innerText = "Agregar Nuevo Cliente";
        document.getElementById("cliente-edit-id").value = "";
    }
}

document.getElementById("form-cliente").addEventListener("submit", (e) => {
    e.preventDefault();
    const editId = document.getElementById("cliente-edit-id").value;
    const nombre = document.getElementById("cliente-nombre").value;
    const telefono = document.getElementById("cliente-telefono").value;
    const pass = document.getElementById("cliente-pass").value;

    if (editId) {
        // Modificación del cliente seleccionado sin alterar ID
        const cli = baseClientes.find(c => c.id === editId);
        cli.nombre = nombre;
        cli.telefono = telefono;
        cli.pass = pass;
    } else {
        // Nuevo registro directo
        const nuevoId = "CLI-00" + (baseClientes.length + 1);
        baseClientes.push({ id: nuevoId, nombre, telefono, pass });
    }
    renderizarTodo();
    ocultarTodosLosFormularios();
});

function eliminarCliente(id) {
    if(confirm(`¿Remover de forma permanente al cliente ${id}?`)) {
        baseClientes = baseClientes.filter(c => c.id !== id);
        // Desvincularlo de los turnos donde participaba
        baseTurnosPuestos.forEach(t => { if(t.clienteId === id) { t.clienteId = ""; t.pago = "Sin Pago"; } });
        renderizarTodo();
    }
}

function actualizarTablaClientesUI() {
    const tbody = document.getElementById("tabla-clientes-body");
    tbody.innerHTML = "";
    baseClientes.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.id}</td>
                <td><b>${c.nombre}</b></td>
                <td>${c.telefono}</td>
                <td><code>${c.pass}</code></td>
                <td>
                    <button type="button" class="btn-edit" onclick="abrirFormularioCliente('${c.id}')">Editar</button>
                    <button type="button" class="btn-delete" onclick="eliminarCliente('${c.id}')">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

// ==========================================================================
// 6. MONITOREO DE TURNOS (REGLA 3 Y 4: LISTAS DESPLEGABLES Y CAMBIO DE PAGO RÁPIDO)
// ==========================================================================
function dibujarBloquesDeTurnos() {
    const contenedor = document.getElementById("contenedor-bloques-sanes");
    contenedor.innerHTML = "";

    baseSanes.forEach(san => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "san-block-card";
        tarjeta.innerHTML = `
            <div class="san-block-header">
                <h3>${san.id}: ${san.nombre} (Cuota: $${san.cuota})</h3>
                <span class="badge-info">Ciclo de Cortes: ${san.ciclo}</span>
            </div>
        `;

        const malla = document.createElement("div");
        malla.className = "turnos-grid-puestos";

        const puestos = baseTurnosPuestos.filter(t => t.sanId === san.id);
        puestos.forEach(p => {
            const item = document.createElement("div");
            const esLibre = p.clienteId === "";
            item.className = `puesto-item ${esLibre ? 'libre' : 'asignado'}`;

            // Buscar nombre del cliente
            const clienteObj = baseClientes.find(c => c.id === p.clienteId);
            const nombreMostrar = clienteObj ? `${clienteObj.nombre} (${p.clienteId})` : "❌ Vacante (Disponible)";

            item.innerHTML = `
                <div class="puesto-num">Puesto ${p.puesto}</div>
                <div class="puesto-cliente" title="${nombreMostrar}">${nombreMostrar}</div>
                <div class="puesto-meta">Corte: ${p.corte}</div>
                
                <!-- Regla 4: Cambio de estado de pago inmediato desde lista desplegable nativa -->
                <select class="select-pago-fast" data-status="${p.pago}" onchange="cambiarPagoRapido('${p.sanId}', ${p.puesto}, this.value)">
                    <option value="Sin Pago" ${p.pago === 'Sin Pago' ? 'selected' : ''}>Sin Pago</option>
                    <option value="Pendiente" ${p.pago === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Al Día" ${p.pago === 'Al Día' ? 'selected' : ''}>Al Día</option>
                </select>

                <!-- Regla 3: Botón individual que abre selección exclusiva en lista plegable -->
                <button type="button" style="margin-top:10px; width:100%; font-size:11px; padding:5px;" onclick="abrirAsignacionPuesto('${p.sanId}', ${p.puesto})">
                    ${esLibre ? 'Asignar Cliente' : 'Cambiar Ocupante'}
                </button>
            `;
            malla.appendChild(item);
        });

        tarjeta.appendChild(malla);
        contenedor.appendChild(tarjeta);
    });
}

function cambiarPagoRapido(sanId, puestoNum, nuevoEstado) {
    const puesto = baseTurnosPuestos.find(t => t.sanId === sanId && t.puesto === puestoNum);
    if (puesto) {
        puesto.pago = nuevoEstado;
    }
    dibujarBloquesDeTurnos(); 
}

// Regla 3: Carga y apertura de lista plegable de clientes para la asignación
function abrirAsignacionPuesto(sanId, puestoNum) {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-asignacion-puesto-container");
    const selectClientes = document.getElementById("puesto-cliente-select");
    
    document.getElementById("puesto-san-id").value = sanId;
    document.getElementById("puesto-numero").value = puestoNum;
    document.getElementById("info-puesto-pautar").innerText = `${sanId} - Puesto Número ${puestoNum}`;

    // Armar las opciones plegables
    selectClientes.innerHTML = `<option value="">-- Dejar Vacante / Remover Cliente --</option>`;
    baseClientes.forEach(c => {
        selectClientes.innerHTML += `<option value="${c.id}">${c.nombre} (${c.id})</option>`;
    });

    // Auto-seleccionar el cliente que ya está en el puesto (si aplica)
    const puestoActual = baseTurnosPuestos.find(t => t.sanId === sanId && t.puesto === puestoNum);
    if(puestoActual) selectClientes.value = puestoActual.clienteId;

    modal.style.display = "block";
}

document.getElementById("form-pautar-puesto").addEventListener("submit", (e) => {
    e.preventDefault();
    const sanId = document.getElementById("puesto-san-id").value;
    const num = parseInt(document.getElementById("puesto-numero").value);
    const clienteSeleccionado = document.getElementById("puesto-cliente-select").value;

    const puesto = baseTurnosPuestos.find(t => t.sanId === sanId && t.puesto === num);
    if (puesto) {
        puesto.clienteId = clienteSeleccionado;
        puesto.pago = clienteSeleccionado === "" ? "Sin Pago" : "Pendiente";
    }

    renderizarTodo();
    ocultarTodosLosFormularios();
});

// ==========================================================================
// 7. SOLICITUDES NUEVOS (CORRECCIÓN REGLA 5: PROCESO FLUIDO SIN ADVERTENCIAS)
// ==========================================================================
function actualizarTablaSolicitudesNuevosUI() {
    const tbody = document.getElementById("tabla-solicitudes-nuevos-body");
    tbody.innerHTML = "";
    baseSolicitudesNuevos.forEach(sol => {
        tbody.innerHTML += `
            <tr id="fila-sol-${sol.id}">
                <td>${sol.id}</td>
                <td>${sol.nombre}</td>
                <td>${sol.telefono}</td>
                <td>${sol.sanId}</td>
                <td>Puesto ${sol.puesto}</td>
                <td>
                    <button type="button" class="btn-approve" onclick="aceptarSolicitudNuevo('${sol.id}')">Aceptar e Inscribir</button>
                    <button type="button" class="btn-delete" onclick="removerSolicitudElemento('fila-sol-${sol.id}', 'NUEVO', '${sol.id}')">Rechazar</button>
                </td>
            </tr>
        `;
    });
}

function aceptarSolicitudNuevo(id) {
    const sol = baseSolicitudesNuevos.find(s => s.id === id);
    
    // 1. Inscribir automáticamente al cliente en la base general sin alertas ni advertencias molestas
    const nuevoCliId = "CLI-00" + (baseClientes.length + 1);
    baseClientes.push({
        id: nuevoCliId,
        nombre: sol.nombre,
        telefono: sol.telefono,
        pass: "Auto" + Math.floor(1000 + Math.random() * 9000) // Contraseña temporal limpia
    });

    // 2. Intentar asignarle el puesto deseado de forma inmediata si está libre
    const puesto = baseTurnosPuestos.find(t => t.sanId === sol.sanId && t.puesto === sol.puesto);
    if (puesto && puesto.clienteId === "") {
        puesto.clienteId = nuevoCliId;
        puesto.pago = "Pendiente";
    }

    // 3. Limpiar solicitud procesada de la cola
    baseSolicitudesNuevos = baseSolicitudesNuevos.filter(s => s.id !== id);
    
    renderizarTodo();
}

// ==========================================================================
// 8. SOLICITUDES INSCRITOS (REGLA 6: EVALUACIÓN EN LISTA SÓLO CON PUESTOS LIBRES)
// ==========================================================================
function actualizarTablaSolicitudesInscritosUI() {
    const tbody = document.getElementById("tabla-solicitudes-inscritos-body");
    tbody.innerHTML = "";
    baseSolicitudesInscritos.forEach(prop => {
        tbody.innerHTML += `
            <tr id="fila-prop-${prop.id}">
                <td>${prop.id}</td>
                <td>${prop.clienteId}</td>
                <td>${prop.sanId}</td>
                <td>${prop.fecha}</td>
                <td>
                    <button type="button" class="btn-approve" onclick="abrirAprobacionInscritoModal('${prop.id}')">Evaluar Puestos</button>
                    <button type="button" class="btn-delete" onclick="removerSolicitudElemento('fila-prop-${prop.id}', 'INSCRITO', '${prop.id}')">Rechazar</button>
                </td>
            </tr>
        `;
    });
}

function abrirAprobacionInscritoModal(propId) {
    ocultarTodosLosFormularios();
    const prop = baseSolicitudesInscritos.find(p => p.id === propId);
    
    document.getElementById("modal-inscrito-prop-id").value = propId;
    document.getElementById("modal-inscrito-cliente-id").value = prop.clienteId;
    document.getElementById("modal-inscrito-san-id").value = prop.sanId;
    
    document.getElementById("info-solicitud-inscrito-texto").innerText = `Asignación para Cliente ${prop.clienteId} en el fondo ${prop.sanId}.`;
    
    const selectPuestos = document.getElementById("modal-inscrito-puesto-select");
    selectPuestos.innerHTML = "";

    // Filtrar EXCLUSIVAMENTE los puestos del San que no posean ningún cliente asignado
    const vacantesDisponibles = baseTurnosPuestos.filter(t => t.sanId === prop.sanId && t.clienteId === "");

    if (vacantesDisponibles.length === 0) {
        selectPuestos.innerHTML = `<option value="">❌ No quedan puestos libres en este San</option>`;
    } else {
        vacantesDisponibles.forEach(v => {
            selectPuestos.innerHTML += `<option value="${v.puesto}">Puesto Número ${v.puesto} (Corte: ${v.corte})</option>`;
        });
    }

    document.getElementById("form-aprobar-inscrito-container").style.display = "block";
}

document.getElementById("form-aprobar-inscrito").addEventListener("submit", (e) => {
    e.preventDefault();
    const propId = document.getElementById("modal-inscrito-prop-id").value;
    const clienteId = document.getElementById("modal-inscrito-cliente-id").value;
    const sanId = document.getElementById("modal-inscrito-san-id").value;
    const puestoElegido = parseInt(document.getElementById("modal-inscrito-puesto-select").value);

    if (!puestoElegido) {
        alert("Operación inviable. No seleccionaste ningún puesto libre.");
        return;
    }

    const puesto = baseTurnosPuestos.find(t => t.sanId === sanId && t.puesto === puestoElegido);
    if(puesto) {
        puesto.clienteId = clienteId;
        puesto.pago = "Pendiente";
    }

    // Retirar de la bandeja
    baseSolicitudesInscritos = baseSolicitudesInscritos.filter(p => p.id !== propId);
    renderizarTodo();
    ocultarTodosLosFormularios();
});

function removerSolicitudElemento(filaId, tipo, id) {
    if (confirm("¿Descartar esta solicitud definitivamente?")) {
        if (tipo === 'NUEVO') baseSolicitudesNuevos = baseSolicitudesNuevos.filter(s => s.id !== id);
        else baseSolicitudesInscritos = baseSolicitudesInscritos.filter(p => p.id !== id);
        document.getElementById(filaId).remove();
    }
}

// ==========================================================================
// 9. PRODUCTOS (CORRECCIÓN REGLA 7: OPERACIONES COMPLETAS GUARDAR/EDITAR)
// ==========================================================================
function abrirFormularioProducto(id = "") {
    ocultarTodosLosFormularios();
    const modal = document.getElementById("form-producto-container");
    modal.style.display = "block";

    if(id) {
        const prod = baseProductos.find(p => p.id === id);
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

document.getElementById("form-producto").addEventListener("submit", (e) => {
    e.preventDefault();
    const editId = document.getElementById("producto-edit-id").value;
    const nombre = document.getElementById("producto-nombre").value;
    const descripcion = document.getElementById("producto-descripcion").value;
    const precio = parseInt(document.getElementById("producto-precio").value);
    const stock = parseInt(document.getElementById("producto-stock").value);
    const estado = document.getElementById("producto-estado").value;
    const visual = document.getElementById("prod-media-input").value;

    if (editId) {
        // Guardar cambios sobre producto existente
        const prod = baseProductos.find(p => p.id === editId);
        prod.nombre = nombre;
        prod.descripcion = descripcion;
        prod.precio = precio;
        prod.stock = stock;
        prod.estado = estado;
        prod.visual = visual;
    } else {
        // Insertar nuevo producto real de forma efectiva
        const nuevoId = "PROD-00" + (baseProductos.length + 1);
        baseProductos.push({ id: nuevoId, nombre, descripcion, precio, visual, stock, estado });
    }

    renderizarTodo();
    ocultarTodosLosFormularios();
});

function eliminarProducto(id) {
    if (confirm(`¿Eliminar el producto ${id} por completo del stock?`)) {
        baseProductos = baseProductos.filter(p => p.id !== id);
        renderizarTodo();
    }
}

function actualizarTablaProductosUI() {
    const tbody = document.getElementById("tabla-productos-body");
    tbody.innerHTML = "";
    baseProductos.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td><b>${p.nombre}</b></td>
                <td><span style="font-size:11px; color:var(--texto-secundario);">${p.descripcion}</span></td>
                <td>$${p.precio}</td>
                <td>${obtenerCeldaMultimedia(p.visual)}</td>
                <td>${p.stock} u.</td>
                <td>${p.estado}</td>
                <td>
                    <button type="button" class="btn-edit" onclick="abrirFormularioProducto('${p.id}')">Editar</button>
                    <button type="button" class="btn-delete" onclick="eliminarProducto('${p.id}')">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

// Auxiliares de visualización general
function ocultarTodosLosFormularios() {
    document.querySelectorAll(".modal-form").forEach(m => m.style.display = "none");
}