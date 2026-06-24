// js/ui-admin.js
import { DB, ejecutarPostSheets } from './api.js';

// 1. INICIALIZADOR DE PESTAÑAS (TABS) ADMINISTRATIVAS
export function inicializarTabsAdmin() {
    const triggers = document.querySelectorAll('.tab-trigger');
    triggers.forEach(btn => {
        btn.onclick = () => {
            triggers.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content-admin').forEach(c => c.classList.add('oculto'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const target = document.getElementById(`tab-${tabId}`);
            if (target) target.classList.remove('oculto');
        };
    });
}

// 2. ORQUESTADOR PRINCIPAL DEL PANEL DE LA PATRONA
export function renderizarAdminTodo() {
    renderizarMatrizPagos();
    renderizarSolicitudesNuevos();
    renderizarSolicitudesInscritos();
    renderizarAsignadorTurnos();
}

// 3. MATRIZ GLOBAL DE CONTROL DE PAGOS (ACCESIBILIDAD CORREGIDA)
function renderizarMatrizPagos() {
    const tbody = document.getElementById('tbody-matriz-pagos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!DB.registrosTurnos || DB.registrosTurnos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--texto-secundario);">No hay turnos registrados en el sistema.</td></tr>`;
        return;
    }

    DB.registrosTurnos.forEach(reg => {
        const san = DB.sanes.find(s => s.San_ID == reg.San_ID) || { Nombre_San: 'Desconocido' };
        const cli = DB.clientes.find(c => c.Cliente_ID == reg.Cliente_ID) || { Nombre_Completo: 'Desconocido' };
        
        const compHtml = reg.Comprobante_Pago ? 
            `<a href="${reg.Comprobante_Pago}" target="_blank" class="link-premium" style="font-size:0.85rem;" title="Ver comprobante de pago de ${cli.Nombre_Completo}">Ver Recibo</a>` 
            : '<span style="color:var(--texto-secundario); font-size:0.85rem;">Ninguno</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${san.Nombre_San}</b></td>
            <td>${cli.Nombre_Completo}</td>
            <td>Turno ${reg.Numero_Turno}</td>
            <td><span class="badge-estado ${reg.Estado_Pago}">${reg.Estado_Pago.toUpperCase()}</span></td>
            <td>${compHtml}</td>
            <td>
                <select class="sel-cambiar-estado select-premium" data-id="${reg.Registro_ID}" title="Cambiar estado de pago para ${cli.Nombre_Completo} en ${san.Nombre_San}">
                    <option value="pendiente" ${reg.Estado_Pago === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="pagado" ${reg.Estado_Pago === 'pagado' ? 'selected' : ''}>Pagado</option>
                    <option value="atrasado" ${reg.Estado_Pago === 'atrasado' ? 'selected' : ''}>Atrasado</option>
                </select>
            </td>
        `;

        // Evento inmediato para guardar cambios de estado desde el selector
        tr.querySelector('.sel-cambiar-estado').onchange = (e) => {
            const nuevoEstado = e.target.value;
            ejecutarPostSheets('actualizarEstadoPago', {
                registroId: reg.Registro_ID,
                estado: nuevoEstado
            }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
        };

        tbody.appendChild(tr);
    });
}

// 4. TABLA DE SOLICITUDES PARA NUEVOS CLIENTES (Asignación de claves)
function renderizarSolicitudesNuevos() {
    const tbody = document.getElementById('tbody-solicitudes-nuevos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!DB.solicitudesNuevos || DB.solicitudesNuevos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--texto-secundario);">No hay solicitudes de nuevos clientes de momento.</td></tr>`;
        return;
    }

    DB.solicitudesNuevos.forEach(sol => {
        const san = DB.sanes.find(s => s.San_ID == sol.San_ID) || { Nombre_San: '-' };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${sol.Nombre_Completo}</b></td>
            <td>${sol.Telefono}</td>
            <td>Interés en: ${san.Nombre_San}</td>
            <td>
                <button class="btn-primary btn-aprobar-nuevo" style="padding:4px 12px; font-size:0.8rem; background:linear-gradient(135deg, #22c55e, #16a34a);" title="Aprobar e ingresar al sistema a ${sol.Nombre_Completo}">
                    Aprobar con Clave
                </button>
            </td>
        `;

        tr.querySelector('.btn-aprobar-nuevo').onclick = () => {
            const clavePropuesta = prompt(`Asigna una contraseña privada para ${sol.Nombre_Completo}:`, "EDISAN" + Math.floor(1000 + Math.random() * 9000));
            if (clavePropuesta) {
                ejecutarPostSheets('procesarAprobacionNuevo', {
                    solicitudId: sol.Solicitud_ID,
                    nombre: sol.Nombre_Completo,
                    telefono: sol.Telefono,
                    sanId: sol.San_ID,
                    contrasena: clavePropuesta
                }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
            }
        };

        tbody.appendChild(tr);
    });
}

// 5. TABLA DE PROPUESTAS DE CLIENTES YA INSCRITOS
function renderizarSolicitudesInscritos() {
    const tbody = document.getElementById('tbody-solicitudes-inscritos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!DB.solicitudesInscritos || DB.solicitudesInscritos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--texto-secundario);">No hay solicitudes de expansión pendientes.</td></tr>`;
        return;
    }

    DB.solicitudesInscritos.forEach(sol => {
        const cli = DB.clientes.find(c => c.Cliente_ID == sol.Cliente_ID) || { Nombre_Completo: 'Desconocido' };
        const san = DB.sanes.find(s => s.San_ID == sol.San_ID) || { Nombre_San: 'Desconocido' };

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${cli.Nombre_Completo}</b></td>
            <td>Desea entrar a: ${san.Nombre_San}</td>
            <td>
                <button class="btn-primary btn-aprobar-inscrito" style="padding:4px 12px; font-size:0.8rem;" title="Aprobar cupo en ${san.Nombre_San} para ${cli.Nombre_Completo}">
                    Conceder Cupo
                </button>
            </td>
        `;

        tr.querySelector('.btn-aprobar-inscrito').onclick = () => {
            ejecutarPostSheets('procesarAprobacionInscrito', {
                solicitudId: sol.Solicitud_ID,
                clienteId: sol.Cliente_ID,
                sanId: sol.San_ID
            }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
        };

        tbody.appendChild(tr);
    });
}

// 6. ASIGNADOR MANUAL DE PUESTOS Y TURNOS (Control estricto de capacidad)
function renderizarAsignadorTurnos() {
    const selectClientes = document.getElementById('admin-select-cliente');
    const selectSanes = document.getElementById('admin-select-san');
    const inputTurno = document.getElementById('admin-input-turno');

    if (!selectClientes || !selectSanes || !inputTurno) return;

    // Poblar listas
    selectClientes.innerHTML = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    selectSanes.innerHTML = DB.sanes.map(s => `<option value="${s.San_ID}">${s.Nombre_San}</option>`).join('');

    const btnAsignar = document.getElementById('btn-admin-asignar-manual');
    btnAsignar.onclick = () => {
        const clienteId = selectClientes.value;
        const sanId = selectSanes.value;
        const turnoNum = parseInt(inputTurno.value);

        if (!clienteId || !sanId || !turnoNum) {
            window.mostrarToast("Por favor completa todos los campos del asignador", "error");
            return;
        }

        const sanSeleccionado = DB.sanes.find(s => s.San_ID == sanId);
        const ocupadosActualmente = DB.registrosTurnos.filter(r => r.San_ID == sanId).length;

        // Validación estricta para evitar sobrepasar la capacidad máxima configurada
        if (ocupadosActualmente >= parseInt(sanSeleccionado.Total_Turnos)) {
            alert(`¡Error! El grupo ${sanSeleccionado.Nombre_San} ya alcanzó su capacidad máxima de ${sanSeleccionado.Total_Turnos} puestos.`);
            return;
        }

        // Validación de turno duplicado en el mismo San
        const turnoDuplicado = DB.registrosTurnos.some(r => r.San_ID == sanId && r.Numero_Turno == turnoNum);
        if (turnoDuplicado) {
            alert(`El Turno ${turnoNum} ya está asignado en este San. Escoge otro número.`);
            return;
        }

        ejecutarPostSheets('asignarTurnoManual', {
            id: "REG" + Date.now().toString().slice(-4),
            clienteId: clienteId,
            sanId: sanId,
            turno: turnoNum
        }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
    };
}