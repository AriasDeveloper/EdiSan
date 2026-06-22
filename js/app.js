// js/app.js
import { API_CONFIG, ADMIN_CONFIG, FRASES_CARGA } from './config.js';

let DB = { sanes: [], clientes: [], registrosTurnos: [], solicitudesNuevos: [], solicitudesInscritos: [] };
let clienteLogueado = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacionSecreta();
    inicializarTabsAdmin();
    inicializarFormularios();
    
    document.getElementById('btn-cerrar-modal').onclick = () => {
        document.getElementById('modal-premium').classList.remove('modal-active');
    };
    cargarDatosDesdeSheets();
});

// PANTALLA DE CARGA CON FRASES
function mostrarCarga() {
    const frase = FRASES_CARGA[Math.floor(Math.random() * FRASES_CARGA.length)];
    document.getElementById('texto-carga-divertido').innerText = frase;
    document.getElementById('pantalla-carga').classList.add('modal-active');
}
function ocultarCarga() { document.getElementById('pantalla-carga').classList.remove('modal-active'); }

async function cargarDatosDesdeSheets() {
    mostrarCarga();
    try {
        const r = await fetch(API_CONFIG.URL_APPS_SCRIPT);
        const res = await r.json();
        if (res.status === "success") {
            DB = res.data;
            
            // Punto 5: Cambiar automáticamente a atrasado si la fecha expiró y sigue pendiente
            verificarFechasVencidas();

            renderizarOfertasPublicas();
            renderizarAdminTodo();
            if(clienteLogueado) renderizarEspacioPrivadoCliente();
        }
    } catch (e) { mostrarToast("Error de sincronización", "error"); }
    finally { ocultarCarga(); }
}

async function ejecutarPostSheets(accion, payload) {
    mostrarCarga();
    try {
        await fetch(API_CONFIG.URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: accion, payload: payload })
        });
        mostrarToast("Petición procesada", "success");
        setTimeout(cargarDatosDesdeSheets, 1500);
    } catch (e) { mostrarToast("Error", "error"); ocultarCarga(); }
}

function verificarFechasVencidas() {
    const hoy = new Date();
    DB.registrosTurnos.forEach(reg => {
        if (reg.Estado_Pago === 'pendiente' && reg.Fecha_Limite) {
            const limite = new Date(reg.Fecha_Limite);
            if (hoy > limite) {
                reg.Estado_Pago = 'atrasado'; // Mutación local visual rápida antes de confirmar
            }
        }
    });
}

// ==========================================================================
// VISTA CLIENTES: INSCRIPCIONES Y PROPUESTAS
// ==========================================================================
function renderizarOfertasPublicas() {
    const contenedor = document.getElementById('contenedor-ofertas-publicas');
    contenedor.innerHTML = '';
    
    DB.sanes.forEach(san => {
        const ocupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
        const lleno = ocupados >= parseInt(san.Total_Turnos);

        const div = document.createElement('div');
        div.className = 'glass-card';
        div.innerHTML = `
            <h4 style="color:var(--morado-brillante);">${san.Nombre_San}</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario);">Ciclo: ${san.Ciclo || 'Mensual'}</p>
            <div style="margin:10px 0; font-size:0.9rem;">
                <div>Cuota: <strong>$${san.Monto_Cuota}</strong></div>
                <div>Llenado: <strong>${ocupados} / ${san.Total_Turnos}</strong></div>
            </div>
            <button class="btn-solicitar btn-primary" style="width:100%; justify-content:center;" ${lleno ? 'disabled' : ''}>
                ${lleno ? 'COMPLETADO' : 'Inscribirme Ahora'}
            </button>
        `;

        div.querySelector('.btn-solicitar').onclick = () => {
            abrirModalInscripcionPublico(san.San_ID, san.Nombre_San);
        };
        contenedor.appendChild(div);
    });
}

// Punto 1: Formulario para usuarios no registrados que solicitan entrar
function abrirModalInscripcionPublico(sanId, nombreSan) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = `Unirse a ${nombreSan}`;
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-solicitar-nuevo" class="premium-form">
            <div class="form-group"><label>Tu Nombre Completo</label><input type="text" id="sol-nombre" required></div>
            <div class="form-group"><label>Número de Teléfono</label><input type="text" id="sol-telef" placeholder="+58..." required></div>
            <p style="font-size:0.8rem; color:var(--texto-secundario); margin-bottom:12px;">Tu información será enviada a la patrona para su aprobación.</p>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Enviar Solicitud</button>
        </form>
    `;
    modal.classList.add('modal-active');
    document.getElementById('form-solicitar-nuevo').onsubmit = (e) => {
        e.preventDefault();
        modal.classList.remove('modal-active');
        ejecutarPostSheets('solicitarNuevo', {
            id: "REQ" + Date.now().toString().slice(-4),
            nombre: document.getElementById('sol-nombre').value,
            telefono: document.getElementById('sol-telef').value,
            sanId: sanId
        });
    };
}

function renderizarEspacioPrivadoCliente() {
    // Render de puestos que ya posee
    const tablaPuestos = document.getElementById('tabla-puestos-inscritos');
    const misPuestos = DB.registrosTurnos.filter(r => r.Cliente_ID == clienteLogueado.Cliente_ID);
    
    tablaPuestos.innerHTML = misPuestos.length === 0 ? `<p>Ningún puesto asignado.</p>` : 
        `<table class="premium-table"><thead><tr><th>San</th><th>Turno</th><th>Estado</th></tr></thead><tbody>` +
        misPuestos.map(p => {
            const s = DB.sanes.find(x => x.San_ID == p.San_ID) || { Nombre_San: '-' };
            return `<tr><td><b>${s.Nombre_San}</b></td><td>Turno ${p.Numero_Turno}</td><td><span class="badge-estado ${p.Estado_Pago}">${p.Estado_Pago}</span></td></tr>`;
        }).join('') + `</tbody></table>`;

    // Render de cuotas pendientes
    const listaPagar = document.getElementById('lista-cuotas-pagar');
    listaPagar.innerHTML = '';
    misPuestos.filter(p => p.Estado_Pago !== 'pagado').forEach(cuota => {
        const s = DB.sanes.find(x => x.San_ID == cuota.San_ID) || { Nombre_San: '-', Monto_Cuota: 0 };
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.Nombre_San} (T-${cuota.Numero_Turno})</td><td>$${s.Monto_Cuota}</td><td>${cuota.Fecha_Limite ? cuota.Fecha_Limite.split('T')[0] : '-'}</td><td><button class="btn-primary btn-subir">Subir Recibo</button></td>`;
        tr.querySelector('.btn-subir').onclick = () => abrirModalSubirComprobante(cuota.Registro_ID);
        listaPagar.appendChild(tr);
    });

    // Punto 2: Sanes para clientes registrados (Pide confirmación de contraseña)
    const contenedorPrivado = document.getElementById('contenedor-ofertas-privadas');
    contenedorPrivado.innerHTML = '';
    DB.sanes.forEach(san => {
        const yaTiene = misPuestos.some(m => m.San_ID == san.San_ID);
        if(yaTiene) return;

        const div = document.createElement('div');
        div.className = 'glass-card';
        div.innerHTML = `<h4>${san.Nombre_San}</h4><p>Cuota: $${san.Monto_Cuota}</p><button class="btn-primary btn-proponer" style="width:100%; margin-top:10px;">Solicitar Cupo</button>`;
        
        div.querySelector('.btn-proponer').onclick = () => {
            const pass = prompt("Para confirmar la solicitud, introduce tu contraseña de cliente:");
            if (pass === String(clienteLogueado.Contrasena)) {
                ejecutarPostSheets('propuestaInscrito', {
                    id: "PROP" + Date.now().toString().slice(-4),
                    clienteId: clienteLogueado.Cliente_ID,
                    sanId: san.San_ID
                });
            } else if(pass !== null) {
                alert("Contraseña de cliente incorrecta.");
            }
        };
        contenedorPrivado.appendChild(div);
    });
}

function abrirModalSubirComprobante(registroId) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Enviar Comprobante de Pago";
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-subir-comprobante" class="premium-form">
            <div class="form-group"><label>Enlace o código de transferencia</label><input type="text" id="comprobante-link" required></div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Enviar</button>
        </form>
    `;
    modal.classList.add('modal-active');
    document.getElementById('form-subir-comprobante').onsubmit = (e) => {
        e.preventDefault();
        modal.classList.remove('modal-active');
        ejecutarPostSheets('registrarPago', { registroId: registroId, nuevoEstado: 'pendiente', comprobante: document.getElementById('comprobante-link').value });
    };
}

// ==========================================================================
// INTERFAZ DE ADMINISTRACIÓN (LA PATRONA)
// ==========================================================================
function renderizarAdminTodo() {
    // Selector de Sanes para asignación manual
    document.getElementById('sel-puesto-san').innerHTML = DB.sanes.map(s => `<option value="${s.San_ID}">${s.Nombre_San} (${s.Ciclo})</option>`).join('');
    document.getElementById('sel-puesto-cliente').innerHTML = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');

    // Tabla de Sanes
    document.getElementById('lista-admin-sanes-tabla').innerHTML = DB.sanes.map(s => `
        <tr><td><b>${s.Nombre_San}</b></td><td>$${s.Monto_Cuota}</td><td>${s.Ciclo || 'Mensual'}</td><td>${DB.registrosTurnos.filter(r=>r.San_ID==s.San_ID).length} / ${s.Total_Turnos}</td><td><button class="btn-danger btn-del-san" data-id="${s.San_ID}">Eliminar</button></td></tr>
    `).join('');

    // Tabla de Clientes
    document.getElementById('lista-admin-clientes-tabla').innerHTML = DB.clientes.map(c => `<tr><td>${c.Cliente_ID}</td><td>${c.Nombre_Completo}</td><td><code>${c.Contrasena}</code></td></tr>`).join('');

    // Matriz de pagos global
    const tablaPagos = document.getElementById('tabla-admin-pagos-global');
    tablaPagos.innerHTML = DB.registrosTurnos.map(reg => {
        const san = DB.sanes.find(s => s.San_ID == reg.San_ID) || { Nombre_San: '-' };
        const cli = DB.clientes.find(c => c.Cliente_ID == reg.Cliente_ID) || { Nombre_Completo: '-' };
        let compHtml = reg.Comprobante ? `<button class="btn-secondary btn-ver-comp" data-link="${reg.Comprobante}" data-id="${reg.Registro_ID}">Ver Recibo</button>` : 'Ninguno';
        
        return `<tr>
            <td>${san.Nombre_San}</td>
            <td>${cli.Nombre_Completo}</td>
            <td>T-${reg.Numero_Turno}</td>
            <td>${reg.Fecha_Limite ? reg.Fecha_Limite.split('T')[0] : '-'}</td>
            <td><span class="badge-estado ${reg.Estado_Pago}">${reg.Estado_Pago}</span></td>
            <td>${compHtml}</td>
            <td>
                <select class="sel-cambiar-estado" data-id="${reg.Registro_ID}">
                    <option value="pendiente" ${reg.Estado_Pago==='pendiente'?'selected':''}>Pendiente</option>
                    <option value="pagado" ${reg.Estado_Pago==='pagado'?'selected':''}>Pagado</option>
                    <option value="atrasado" ${reg.Estado_Pago==='atrasado'?'selected':''}>Atrasado</option>
                </select>
            </td>
        </tr>`;
    }).join('');

    // Punto 3: Visualizador con opción de eliminar comprobante
    tablaPagos.querySelectorAll('.btn-ver-comp').forEach(btn => {
        btn.onclick = (e) => {
            const link = e.target.dataset.link;
            const regId = e.target.dataset.id;
            const modal = document.getElementById('modal-premium');
            document.getElementById('modal-titulo').innerText = "Validación de Recibo";
            document.getElementById('modal-cuerpo').innerHTML = `
                <div style="text-align:center; display:flex; flex-direction:column; gap:15px;">
                    <p>Referencia del Cliente: <strong>${link}</strong></p>
                    ${link.startsWith('http') ? `<a href="${link}" target="_blank" class="btn-primary" style="justify-content:center;">Abrir Link de Imagen</a>` : ''}
                    <hr style="border:1px solid var(--borde-cristal);">
                    <button class="btn-danger" id="btn-eliminar-recibo-action" style="width:100%; justify-content:center;"><span class="material-icons-round">delete</span> Rechazar y Eliminar Comprobante</button>
                </div>
            `;
            modal.classList.add('modal-active');
            
            document.getElementById('btn-eliminar-recibo-action').onclick = () => {
                if(confirm("¿Seguro que deseas rechazar este recibo? Volverá a estar pendiente.")) {
                    modal.classList.remove('modal-active');
                    ejecutarPostSheets('eliminarComprobante', { registroId: regId });
                }
            };
        };
    });

    tablaPagos.querySelectorAll('.sel-cambiar-estado').forEach(sel => {
        sel.onchange = (e) => {
            const r = DB.registrosTurnos.find(x => x.Registro_ID == e.target.dataset.id);
            ejecutarPostSheets('registrarPago', { registroId: e.target.dataset.id, nuevoEstado: e.target.value, comprobante: r.Comprobante || '' });
        };
    });

    // PANELES DE APROBACIÓN (LISTA DE ESPERA)
    document.getElementById('tabla-espera-nuevos').innerHTML = DB.solicitudesNuevos.map(sn => {
        const s = DB.sanes.find(x => x.San_ID == sn.San_ID) || { Nombre_San: '-' };
        return `<tr>
            <td>${sn.Nombre_Completo}</td>
            <td>${sn.Telefono}</td>
            <td>${s.Nombre_San}</td>
            <td>
                <button class="btn-primary btn-apr-n" data-id="${sn.Solicitud_ID}" data-nombre="${sn.Nombre_Completo}" data-tel="${sn.Telefono}" data-san="${sn.San_ID}" style="padding:4px 8px;">Aceptar</button>
                <button class="btn-danger btn-rec-n" data-id="${sn.Solicitud_ID}" style="padding:4px 8px;">X</button>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('tabla-espera-inscritos').innerHTML = DB.solicitudesInscritos.map(si => {
        const c = DB.clientes.find(x => x.Cliente_ID == si.Cliente_ID) || { Nombre_Completo: '-' };
        const s = DB.sanes.find(x => x.San_ID == si.San_ID) || { Nombre_San: '-' };
        return `<tr>
            <td>${c.Nombre_Completo}</td>
            <td>${s.Nombre_San}</td>
            <td>
                <button class="btn-primary btn-apr-i" data-id="${si.Propuesta_ID}" data-cli="${si.Cliente_ID}" data-san="${si.San_ID}" style="padding:4px 8px;">Aceptar</button>
                <button class="btn-danger btn-rec-i" data-id="${si.Propuesta_ID}" style="padding:4px 8px;">X</button>
            </td>
        </tr>`;
    }).join('');

    // Eventos Aprobaciones
    conectarEventosAprobacion();
}

function conectarEventosAprobacion() {
    // Rechazar Nuevo
    document.querySelectorAll('.btn-rec-n').forEach(b => b.onclick = (e) => ejecutarPostSheets('resolverSolicitudNuevo', { solicitudId: e.target.dataset.id }));
    // Rechazar Inscrito
    document.querySelectorAll('.btn-rec-i').forEach(b => b.onclick = (e) => ejecutarPostSheets('resolverPropuestaInscrito', { propuestaId: e.target.dataset.id }));

    // Aceptar Nuevo (Crea cliente, le genera clave aleatoria y limpia la solicitud)
    document.querySelectorAll('.btn-apr-n').forEach(b => b.onclick = async (e) => {
        const d = e.target.dataset;
        const nuevoClienteId = "C" + Date.now().toString().slice(-3);
        const claveGenerada = Math.floor(1000 + Math.random() * 9000).toString(); // Clave de 4 dígitos para agilizar
        
        mostrarCarga();
        // 1. Guardar cliente
        await fetch(API_CONFIG.URL_APPS_SCRIPT, { method: 'POST', body: JSON.stringify({ action: 'crearCliente', payload: { id: nuevoClienteId, nombre: d.nombre, telefono: d.tel, contrasena: claveGenerada } })});
        // 2. Limpiar de solicitudes
        await fetch(API_CONFIG.URL_APPS_SCRIPT, { method: 'POST', body: JSON.stringify({ action: 'resolverSolicitudNuevo', payload: { solicitudId: d.id } })});
        
        alert(`¡Cliente Creado!\nNombre: ${d.nombre}\nClave Asignada: ${claveGenerada}\nAsigna su puesto ahora desde el panel de asignaciones.`);
        setTimeout(cargarDatosDesdeSheets, 500);
    });

    // Aceptar Inscrito (Limpia la propuesta para proceder a asignarle puesto)
    document.querySelectorAll('.btn-apr-i').forEach(b => b.onclick = async (e) => {
        const d = e.target.dataset;
        mostrarCarga();
        await fetch(API_CONFIG.URL_APPS_SCRIPT, { method: 'POST', body: JSON.stringify({ action: 'resolverPropuestaInscrito', payload: { propuestaId: d.id } })});
        alert("Propuesta aceptada. Procede a fijarle su número de turno y su fecha de cobro.");
        setTimeout(cargarDatosDesdeSheets, 500);
    });
}

// ==========================================================================
// FORMULARIOS DE CREACIÓN Y ASIGNACIÓN (Punto 4)
// ==========================================================================
function inicializarFormularios() {
    document.getElementById('form-crear-san').onsubmit = (e) => {
        e.preventDefault();
        ejecutarPostSheets('crearSan', {
            id: "S" + Date.now().toString().slice(-4),
            nombre: document.getElementById('san-nombre').value,
            montoCuota: parseFloat(document.getElementById('san-monto').value),
            totalTurnos: parseInt(document.getElementById('san-turnos').value),
            estado: "Reclutando",
            ciclo: document.getElementById('san-ciclo').value
        });
        e.target.reset();
    };

    document.getElementById('form-crear-cliente').onsubmit = (e) => {
        e.preventDefault();
        ejecutarPostSheets('crearCliente', {
            id: "C" + Date.now().toString().slice(-4),
            nombre: document.getElementById('cli-nombre').value,
            telefono: document.getElementById('cli-telefono').value,
            contrasena: document.getElementById('cli-pass').value
        });
        e.target.reset();
    };

    document.getElementById('btn-guardar-puesto').onclick = () => {
        const fecha = document.getElementById('date-puesto-limite').value;
        if(!fecha) { mostrarToast("Fija una fecha límite", "error"); return; }
        
        ejecutarPostSheets('asignarPuesto', {
            id: "R" + Date.now().toString().slice(-4),
            sanId: document.getElementById('sel-puesto-san').value,
            clienteId: document.getElementById('sel-puesto-cliente').value,
            turno: parseInt(document.getElementById('num-puesto-turno').value),
            fechaLimite: fecha,
            estado: "pendiente"
        });
    };
}

function inicializarNavegacionSecreta() {
    const btnLlaveAdmin = document.getElementById('btn-llave-admin');
    const seccionAdmin = document.getElementById('seccion-admin');
    const seccionCliente = document.getElementById('seccion-cliente');
    const btnCerrarAdmin = document.getElementById('btn-cerrar-admin');

    btnLlaveAdmin.onclick = () => {
        const pass = prompt("Clave Maestra de Administrador:");
        if (pass === ADMIN_CONFIG.CLAVE_ACCESO) {
            seccionCliente.classList.remove('view-active');
            seccionAdmin.classList.add('view-active'); // <-- Corregido .classList.add
            
            // Forzamos el renderizado inmediato de los datos de la administración
            renderizarAdminTodo(); 
            mostrarToast("Acceso de administrador verificado", "success");
        } else if (pass !== null) {
            mostrarToast("Clave incorrecta", "error");
        }
    };

    btnCerrarAdmin.onclick = () => {
        seccionAdmin.classList.remove('view-active');
        seccionCliente.classList.add('view-active');
    };

    // Asegurar los flujos del Login del Cliente
    document.getElementById('btn-ir-a-login').onclick = () => abrirModalLoginCliente();
    
    document.getElementById('btn-logout-cliente').onclick = () => {
        clienteLogueado = null;
        document.getElementById('cliente-vista-privada').classList.add('oculto');
        document.getElementById('cliente-vista-publica').classList.remove('oculto');
        mostrarToast("Sesión de cliente cerrada", "info");
    };
}

function inicializarTabsAdmin() {
    const tabs = ['sanes', 'clientes', 'puestos', 'solicitudes'];
    tabs.forEach(t => {
        document.getElementById(`tab-admin-${t}`).onclick = (e) => {
            tabs.forEach(x => {
                document.getElementById(`sub-panel-${x}`).classList.add('oculto');
                document.getElementById(`tab-admin-${x}`).className = 'btn-secondary';
            });
            document.getElementById(`sub-panel-${t}`).classList.remove('oculto');
            e.target.className = 'btn-primary';
        };
    });
}

function mostrarToast(m, t = "success") {
    const c = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.style.cssText = `background:rgba(15,10,35,0.95); border-left:4px solid ${t==='success'?'#10b981':'#ef4444'}; color:white; padding:12px 20px; border-radius:8px;`;
    toast.innerText = m; c.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}