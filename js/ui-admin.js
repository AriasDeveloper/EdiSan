// js/ui-admin.js
import { DB, ejecutarPostSheets } from './api.js';

export function inicializarTabsAdmin() {
    const tabs = ['sanes', 'clientes', 'puestos', 'solicitudes', 'productos'];
    tabs.forEach(t => {
        const botonTab = document.getElementById(`tab-admin-${t}`);
        if(botonTab) {
            botonTab.onclick = (e) => {
                tabs.forEach(x => {
                    document.getElementById(`sub-panel-${x}`).classList.add('oculto');
                    document.getElementById(`tab-admin-${x}`).className = 'btn-secondary';
                });
                document.getElementById(`sub-panel-${t}`).classList.remove('oculto');
                e.currentTarget.className = 'btn-primary';
            };
        }
    });
}

export function renderizarAdminTodo() {
    // Selects dinámicos
    const selSan = document.getElementById('sel-puesto-san');
    const selCli = document.getElementById('sel-puesto-cliente');
    if(selSan) selSan.innerHTML = DB.sanes.map(s => `<option value="${s.San_ID}">${s.Nombre_San}</option>`).join('');
    if(selCli) selCli.innerHTML = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');

    if(selSan) {
        selSan.onchange = (e) => actualizarDesplegableTurnos(e.target.value);
        if(DB.sanes.length > 0) actualizarDesplegableTurnos(DB.sanes[0].San_ID);
    }

    // Listado de Sanes
    document.getElementById('lista-admin-sanes-tabla').innerHTML = DB.sanes.map(s => {
        const o = DB.registrosTurnos.filter(r => r.San_ID == s.San_ID).length;
        return `<tr><td><b>${s.Nombre_San}</b></td><td>$${s.Monto_Cuota}</td><td>${s.Ciclo}</td><td>${o}/${s.Total_Turnos}</td><td><button class="btn-danger btn-del-san" data-id="${s.San_ID}">Eliminar</button></td></tr>`;
    }).join('');

    // Listado de Clientes
    document.getElementById('lista-admin-clientes-tabla').innerHTML = DB.clientes.map(c => `
        <tr><td>${c.Cliente_ID}</td><td><b>${c.Nombre_Completo}</b></td><td><code>${c.Contrasena}</code></td><td><button class="btn-danger btn-del-cliente" data-id="${c.Cliente_ID}">Eliminar</button></td></tr>
    `).join('');

    // Listado de Productos
    document.getElementById('tabla-admin-productos').innerHTML = DB.productos.map(p => `
        <tr><td><img src="${p.Imagen_URL}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;"></td><td><b>${p.Nombre}</b></td><td>$${p.Precio}</td><td>${p.Stock} unds</td><td><button class="btn-danger btn-del-prod" data-id="${p.Producto_ID}">Eliminar</button></td></tr>
    `).join('');

    // Matriz de Control de Pagos Global
    const tablaPagos = document.getElementById('tabla-admin-pagos-global');
    tablaPagos.innerHTML = DB.registrosTurnos.map(reg => {
        const san = DB.sanes.find(s => s.San_ID == reg.San_ID) || { Nombre_San: '-' };
        const cli = DB.clientes.find(c => c.Cliente_ID == reg.Cliente_ID) || { Nombre_Completo: '-' };
        let compHtml = reg.Comprobante ? `<button class="btn-secondary btn-ver-comp" data-link="${reg.Comprobante}" data-id="${reg.Registro_ID}">Ver Recibo</button>` : '<i>Ninguno</i>';

        return `<tr>
            <td><b>${san.Nombre_San}</b></td><td>${cli.Nombre_Completo}</td><td>Turno ${reg.Numero_Turno}</td><td><span class="badge-estado ${reg.Estado_Pago}">${reg.Estado_Pago}</span></td><td>${compHtml}</td>
            <td>
                <select class="sel-cambiar-estado" data-id="${reg.Registro_ID}">
                    <option value="pendiente" ${reg.Estado_Pago==='pendiente'?'selected':''}>Pendiente</option>
                    <option value="pagado" ${reg.Estado_Pago==='pagado'?'selected':''}>Pagado</option>
                    <option value="atrasado" ${reg.Estado_Pago==='atrasado'?'selected':''}>Atrasado</option>
                </select>
            </td>
        </tr>`;
    }).join('');

    // Listas de esperas
    document.getElementById('tabla-espera-nuevos').innerHTML = DB.solicitudesNuevos.map(sn => `
        <tr><td><b>${sn.Nombre_Completo}</b></td><td>${sn.Telefono}</td><td><button class="btn-primary btn-apr-nuevo" data-id="${sn.Solicitud_ID}" data-nombre="${sn.Nombre_Completo}" data-tel="${sn.Telefono}">Aceptar</button></td></tr>
    `).join('');

    document.getElementById('tabla-espera-inscritos').innerHTML = DB.solicitudesInscritos.map(si => {
        const c = DB.clientes.find(x => x.Cliente_ID == si.Cliente_ID) || { Nombre_Completo: '-' };
        return `<tr><td><b>${c.Nombre_Completo}</b></td><td><button class="btn-primary btn-apr-inscrito" data-id="${si.Propuesta_ID}">Aceptar</button></td></tr>`;
    }).join('');

    conectarEventosAdmin(tablaPagos);
}

function actualizarDesplegableTurnos(sanId) {
    const selectTurnos = document.getElementById('num-puesto-turno');
    if (!selectTurnos) return;
    const sanSeleccionado = DB.sanes.find(s => s.San_ID == sanId);
    if(!sanSeleccionado) return;

    const turnosOcupados = DB.registrosTurnos.filter(r => r.San_ID == sanId).map(r => parseInt(r.Numero_Turno));
    let opcionesHtml = '';
    for (let i = 1; i <= parseInt(sanSeleccionado.Total_Turnos); i++) {
        opcionesHtml += `<option value="${i}" ${turnosOcupados.includes(i)?'disabled':''}>Turno ${i} ${turnosOcupados.includes(i)?'(Ocupado 🚫)':'(Libre)'}</option>`;
    }
    selectTurnos.innerHTML = opcionesHtml;
}

function conectarEventosAdmin(tablaPagos) {
    document.querySelectorAll('.btn-del-san').forEach(b => b.onclick = (e) => {
        if(confirm("¿Eliminar este San?")) ejecutarPostSheets('eliminarSan', { sanId: e.target.dataset.id }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
    });

    document.querySelectorAll('.btn-del-cliente').forEach(b => b.onclick = (e) => {
        if(confirm("¿Remover cliente?")) ejecutarPostSheets('eliminarCliente', { clienteId: e.target.dataset.id }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
    });

    document.querySelectorAll('.btn-del-prod').forEach(b => b.onclick = (e) => {
        if(confirm("¿Remover producto?")) ejecutarPostSheets('eliminarProducto', { productoId: e.target.dataset.id }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
    });

    tablaPagos.querySelectorAll('.sel-cambiar-estado').forEach(sel => {
        sel.onchange = (e) => {
            const r = DB.registrosTurnos.find(x => x.Registro_ID == e.target.dataset.id);
            ejecutarPostSheets('registrarPago', { registroId: e.target.dataset.id, nuevoEstado: e.target.value, comprobante: r.Comprobante || '' }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
        };
    });

    tablaPagos.querySelectorAll('.btn-ver-comp').forEach(btn => {
        btn.onclick = (e) => {
            const modal = document.getElementById('modal-premium');
            document.getElementById('modal-titulo').innerText = "Validar Recibo";
            document.getElementById('modal-cuerpo').innerHTML = `
                <div style="text-align:center; display:flex; flex-direction:column; gap:10px;">
                    <p>Referencia/Link: <code>${e.target.dataset.link}</code></p>
                    <button class="btn-danger" id="rej-comp">Rechazar Comprobante</button>
                </div>
            `;
            modal.classList.add('modal-active');
            document.getElementById('rej-comp').onclick = () => {
                modal.classList.remove('modal-active');
                ejecutarPostSheets('eliminarComprobante', { registroId: e.target.dataset.id }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
            };
        };
    });

    document.querySelectorAll('.btn-apr-nuevo').forEach(b => b.onclick = async (e) => {
        const d = e.target.dataset;
        const clave = Math.floor(1000 + Math.random() * 9000).toString();
        window.mostrarCarga();
        await ejecutarPostSheets('crearCliente', { id: "C"+Date.now().toString().slice(-3), nombre: d.nombre, telefono: d.tel, contrasena: clave }, () => {}, () => {}, () => {});
        await ejecutarPostSheets('resolverSolicitudNuevo', { solicitudId: d.id }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
        alert(`Aprobado. Clave asignada: ${clave}`);
    });
}