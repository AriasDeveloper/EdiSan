// Memoria local para emular los estados de ocupación de las bases de datos
let baseSanes = [
    { id: "SAN-001", nombre: "San Oro Premium", cuota: 50, inicio: "2026-07-01", puestos: 5, ciclo: "Semanal", visual: "icon:oro" }
];

// Almacén de turnos en memoria para verificar disponibilidad única (Regla 5)
let baseTurnosPuestos = [
    { sanId: "SAN-001", puesto: 1, clienteId: "CLI-001", pago: "Al Día", corte: "2026-07-01" },
    { sanId: "SAN-001", puesto: 2, clienteId: "", pago: "Sin Pago", corte: "2026-07-08" },
    { sanId: "SAN-001", puesto: 3, clienteId: "", pago: "Sin Pago", corte: "2026-07-15" },
    { sanId: "SAN-001", puesto: 4, clienteId: "", pago: "Sin Pago", corte: "2026-07-22" },
    { sanId: "SAN-001", puesto: 5, clienteId: "", pago: "Sin Pago", corte: "2026-07-29" }
];

document.addEventListener("DOMContentLoaded", () => {
    // Manejo de cambio de pestaña
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

    // Iniciar renderizado de la estructura de bloques
    dibujarBloquesDeTurnos();

    // Inyección de botón de colapso lateral
    const navBar = document.querySelector("nav");
    const btnCollapse = document.createElement("button");
    btnCollapse.innerText = "◀";
    btnCollapse.style.cssText = "position:absolute; bottom:20px; left:20px; width:35px; height:35px; border-radius:50%; background:#9d4edd; color:white; border:none; cursor:pointer; z-index:150;";
    document.body.appendChild(btnCollapse);

    btnCollapse.addEventListener("click", () => {
        navBar.classList.toggle("collapsed");
        btnCollapse.innerText = navBar.classList.contains("collapsed") ? "▶" : "◀";
    });
});

// ==========================================================================
// AUTOMATIZACIÓN DE CREACIÓN DE TURNOS AL CONFIGURAR UN SAN (Regla 2)
// ==========================================================================
document.getElementById("form-san").addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Generar ID único incremental gestionado por la web
    const nuevoId = "SAN-00" + (baseSanes.length + 1);
    const nombre = e.target.elements[0].value;
    const cuota = parseInt(e.target.elements[1].value);
    const fechaInicioStr = e.target.elements[2].value;
    const totalPuestos = parseInt(document.getElementById("san-total-turnos").value);
    const ciclo = e.target.elements[5].value;
    const visualValue = document.getElementById("san-media-input").value;

    // Crear la cabecera del San
    baseSanes.push({ id: nuevoId, nombre: nombre, cuota: cuota, inicio: fechaInicioStr, puestos: totalPuestos, ciclo: ciclo, visual: visualValue });

    // REGLA 2: Creación automática de turnos vacíos con fechas escalonadas según el ciclo
    let fechaCorte = new Date(fechaInicioStr);
    for (let i = 1; i <= totalPuestos; i++) {
        baseTurnosPuestos.push({
            sanId: nuevoId,
            puesto: i,
            clienteId: "", 
            pago: "Sin Pago",
            corte: fechaCorte.toISOString().split('T')[0]
        });

        // Escalonar fechas según ciclo del San
        if (ciclo === "Semanal") fechaCorte.setDate(fechaCorte.getDate() + 7);
        else if (ciclo === "Quincenal") fechaCorte.setDate(fechaCorte.getDate() + 15);
        else fechaCorte.setDate(fechaCorte.getMonth() + 1);
    }

    alert(`¡Éxito BaseEdimar! Creado ${nuevoId} y configurados automáticamente sus ${totalPuestos} turnos libres.`);
    actualizarTablaSanesUI();
    dibujarBloquesDeTurnos();
    ocultarTodosLosFormularios();
    e.target.reset();
});

// ==========================================================================
// RENDERIZADO EN BLOQUES INDEPENDIENTES POR SANES (Regla 2 y 3)
// ==========================================================================
function dibujarBloquesDeTurnos() {
    const contenedor = document.getElementById("contenedor-bloques-sanes");
    contenedor.innerHTML = ""; // Limpiar vista anterior

    baseSanes.forEach(san => {
        const tarjetaBloque = document.createElement("div");
        tarjetaBloque.className = "san-block-card";

        // Cabecera del bloque
        tarjetaBloque.innerHTML = `
            <div class="san-block-header">
                <h3>${san.id}: ${san.nombre} (Cuota: $${san.cuota})</h3>
                <span class="badge-info">Ciclo de Cortes: ${san.ciclo}</span>
            </div>
        `;

        const mallaPuestos = document.createElement("div");
        mallaPuestos.className = "turnos-grid-puestos";

        // Filtrar y plasmar cada puesto correspondiente a este San
        const puestosDeEsteSan = baseTurnosPuestos.filter(t => t.sanId === san.id);
        
        puestosDeEsteSan.forEach(p => {
            const itemPuesto = document.createElement("div");
            const esLibre = p.clienteId === "";
            itemPuesto.className = `puesto-item ${esLibre ? 'libre' : 'asignado'}`;

            itemPuesto.innerHTML = `
                <div class="puesto-num">Puesto ${p.puesto}</div>
                <div class="puesto-cliente">${esLibre ? '❌ Vacante (Disponible)' : '👤 ' + p.clienteId}</div>
                <div class="puesto-meta">Fecha de Corte: ${p.corte}</div>
                <span class="puesto-pago ${esLibre ? 'status-pago-vacio' : (p.pago === 'Al Día' ? 'status-pago-completo' : 'status-pago-pendiente')}">
                    ${p.pago}
                </span>
                <button type="button" style="margin-top:10px;" onclick="abrirAsignacionPuesto('${p.sanId}', ${p.puesto}, '${p.clienteId}')">
                    ${esLibre ? 'Asignar Puesto' : 'Modificar'}
                </button>
            `;
            mallaPuestos.appendChild(itemPuesto);
        });

        tarjetaBloque.appendChild(mallaPuestos);
        contenedor.appendChild(tarjetaBloque);
    });
}

// ==========================================================================
// PROCESAMIENTO E INTERCEPCIÓN DE SOLICITUDES (Regla 4 y 5)
// ==========================================================================

// Regla 4: Al aprobar Solicitudes Nuevos se autoescribe el formulario de Clientes
function procesarSolicitudNuevo(solId, nombre, telefono, sanIdDestino, puestoDeseado) {
    alert(`Cargando datos del postulante ${nombre} al formulario de registro...`);
    
    abrirFormulario('form-cliente-container');
    
    const inputsCliente = document.querySelectorAll("#form-cliente-container input");
    inputsCliente[0].value = nombre;     // Escribe nombre automáticamente
    inputsCliente[1].value = telefono;   // Escribe teléfono automáticamente
    inputsCliente[2].value = "";         // Deja libre solo contraseña
}

// Regla 5: Validar solicitudes de inscritos impidiendo duplicidad de puestos ocupados
function procesarSolicitudInscrito(propuestaId, clienteId, sanId, puestoDeseado) {
    // Buscar si el puesto deseado en ese San se encuentra libre
    const registroPuesto = baseTurnosPuestos.find(t => t.sanId === sanId && t.puesto === puestoDeseado);

    if (!registroPuesto) {
        alert("Error crítico: El puesto solicitado no existe en el organigrama de este San.");
        return;
    }

    if (registroPuesto.clienteId !== "") {
        // Regla 5: Bloquear asignación si ya hay un cliente ocupando el puesto
        alert(`Operación denegada: El Puesto ${puestoDeseado} del ${sanId} ya está ocupado por ${registroPuesto.clienteId}. No se permiten duplicados.`);
    } else {
        // Ejecutar asignación limpia
        registroPuesto.clienteId = clienteId;
        registroPuesto.pago = "Pendiente";
        alert(`¡Pautado con éxito! El Cliente ${clienteId} ha tomado el Puesto ${puestoDeseado} libre del ${sanId}.`);
        dibujarBloquesDeTurnos();
        document.getElementById(`fila-prop-001`).remove(); // Limpia la solicitud procesada
    }
}

// Modificar de manera directa un puesto desde la cuadrícula de turnos
function abrirAsignacionPuesto(sanId, numeroPuesto, clienteActual) {
    abrirFormulario('form-asignacion-puesto-container');
    document.getElementById("puesto-san-id").value = sanId;
    document.getElementById("puesto-numero").value = numeroPuesto;
    document.getElementById("puesto-cliente-id").value = clienteActual;
}

document.getElementById("form-pautar-puesto").addEventListener("submit", (e) => {
    e.preventDefault();
    const sanId = document.getElementById("puesto-san-id").value;
    const num = parseInt(document.getElementById("puesto-numero").value);
    const nuevoCliente = document.getElementById("puesto-cliente-id").value;
    const pago = document.getElementById("puesto-estado-pago").value;

    // Verificar unicidad en asignación manual (Regla 5)
    if (nuevoCliente !== "") {
        const ocupado = baseTurnosPuestos.find(t => t.sanId === sanId && t.puesto === num && t.clienteId !== "" && t.clienteId !== nuevoCliente);
        if (ocupado) {
            alert("Error: Este puesto está en posesión de otro usuario.");
            return;
        }
    }

    const t = baseTurnosPuestos.find(t => t.sanId === sanId && t.puesto === num);
    if (t) {
        t.clienteId = nuevoCliente;
        t.pago = nuevoCliente === "" ? "Sin Pago" : pago;
    }

    alert("Puesto actualizado.");
    dibujarBloquesDeTurnos();
    ocultarTodosLosFormularios();
});

// Auxiliares de interfaz
function setVisualValue(inputId, value) {
    document.getElementById(inputId).value = value;
}

const abrirFormulario = (id) => {
    ocultarTodosLosFormularios();
    const f = document.getElementById(id);
    if(f) f.style.display = "block";
};

const ocultarTodosLosFormularios = () => {
    document.querySelectorAll(".modal-form").forEach(f => f.style.display = "none");
};

document.querySelectorAll("form button[type='button']").forEach(b => b.addEventListener("click", ocultarTodosLosFormularios));

function eliminarFila(id) {
    if(confirm(`¿Seguro que deseas eliminar el registro ${id}?`)) {
        baseSanes = baseSanes.filter(s => s.id !== id);
        actualizarTablaSanesUI();
    }
}

function rechazarSolicitud(filaId) {
    if(confirm("¿Rechazar y remover esta solicitud del sistema?")) {
        document.getElementById(filaId).remove();
    }
}

function actualizarTablaSanesUI() {
    const tbody = document.getElementById("tabla-sanes-body");
    tbody.innerHTML = "";
    baseSanes.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td>${s.id}</td>
                <td>${s.nombre}</td>
                <td>$${s.cuota}</td>
                <td>${s.inicio}</td>
                <td>${s.puestos}</td>
                <td>Activo</td>
                <td>${s.ciclo}</td>
                <td><span class="icono-celda-muestra"></span> (${s.visual})</td>
                <td>
                    <button type="button" class="btn-edit" onclick="abrirFormulario('form-san-container')">Editar</button>
                    <button type="button" class="btn-delete" onclick="eliminarFila('${s.id}')">Eliminar</button>
                </td>
            </tr>
        `;
    });
}