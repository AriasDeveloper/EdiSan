// js/app.js
import { API_CONFIG, SAN_ESTADOS, CUOTA_ESTADOS } from './config.js';

// Estado global sincronizado
let DB = { sanes: [], clientes: [], registrosTurnos: [] };
let clienteLogueado = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacion();
    inicializarTabsAdmin();
    inicializarFormularios();
    
    // Cerrar modal
    document.getElementById('btn-cerrar-modal').onclick = () => {
        document.getElementById('modal-premium').classList.remove('modal-active');
    };

    // Cargar datos iniciales desde Google Sheets
    cargarDatosDesdeSheets();
});

// ==========================================================================
// CONTROL DE CARGA DESDE GOOGLE SHEETS
// ==========================================================================
async function cargarDatosDesdeSheets() {
    const icon = document.getElementById('sync-icon');
    const text = document.getElementById('sync-text');
    const indicator = document.getElementById('sheets-sync-indicator');
    
    icon.classList.add('icon-spin');
    indicator.classList.add('cargando');
    text.innerText = "Sincronizando...";

    try {
        const respuesta = await fetch(API_CONFIG.URL_APPS_SCRIPT);
        const resultado = await respuesta.json();
        
        if (resultado.status === "success") {
            DB = resultado.data;
            
            // Renderizados globales
            renderizarOfertasPublicas();
            renderizarAdminTodo();
            if(clienteLogueado) renderizarEspacioPrivadoCliente();

            icon.classList.remove('icon-spin');
            indicator.classList.remove('cargando');
            icon.innerText = "cloud_done";
            text.innerText = "Sincronizado";
        } else {
            throw new Error(resultado.message);
        }
    } catch (error) {
        console.error(error);
        icon.classList.remove('icon-spin');
        icon.innerText = "cloud_off";
        text.innerText = "Error de enlace";
        mostrarToast("Error de conexión con Sheets", "error");
    }
}

// Envíos de escritura POST a Sheets
async function ejecutarPostSheets(accion, payload) {
    const icon = document.getElementById('sync-icon');
    icon.classList.add('icon-spin');
    
    try {
        await fetch(API_CONFIG.URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors', // Evita bloqueos de seguridad de navegador en Web Apps
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: accion, payload: payload })
        });
        
        mostrarToast("Operación enviada a la nube", "success");
        // Forzar recarga pasados 1.5s para dar tiempo de procesamiento en Sheets
        setTimeout(cargarDatosDesdeSheets, 1500);
    } catch (e) {
        mostrarToast("Error al guardar registro", "error");
        icon.classList.remove('icon-spin');
    }
}

// ==========================================================================
// SISTEMA DE NAVEGACIÓN Y LOGINS
// ==========================================================================
function inicializarNavegacion() {
    const btnCliente = document.getElementById('btn-vista-cliente');
    const btnAdmin = document.getElementById('btn-vista-admin');
    const secCliente = document.getElementById('seccion-cliente');
    const secAdmin = document.getElementById('seccion-admin');

    btnCliente.onclick = () => {
        btnAdmin.classList.remove('active'); btnCliente.classList.add('active');
        secAdmin.classList.remove('view-active'); secCliente.classList.add('view-active');
    };
    btnAdmin.onclick = () => {
        btnCliente.classList.remove('active'); btnAdmin.classList.add('active');
        secCliente.classList.remove('view-active'); secAdmin.classList.add('view-active');
    };

    // Botón Lanzador de Login de Clientes
    document.getElementById('btn-ir-a-login').onclick = () => {
        abrirModalLoginCliente();
    };

    document.getElementById('btn-logout-cliente').onclick = () => {
        clienteLogueado = null;
        document.getElementById('cliente-vista-privada').classList.add('oculto');
        document.getElementById('cliente-vista-publica').classList.remove('oculto');
        mostrarToast("Sesión cerrada", "info");
    };
}

function abrirModalLoginCliente() {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Ingreso Clientes Certificados";
    
    let opcionesClientes = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-autenticar" class="premium-form">
            <div class="form-group">
                <label>Selecciona tu Nombre</label>
                <select id="login-id">${opcionesClientes}</select>
            </div>
            <div class="form-group">
                <label>Contraseña</label>
                <input type="password" id="login-pass" required>
            </div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Ver mi Actividad</button>
        </form>
    `;
    modal.classList.add('modal-active');

    document.getElementById('form-autenticar').onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;

        const clienteEncontrado = DB.clientes.find(c => c.Cliente_ID == id && String(c.Contrasena) === String(pass));

        if (clienteEncontrado) {
            clienteLogueado = clienteEncontrado;
            modal.classList.remove('modal-active');
            document.getElementById('cliente-vista-publica').classList.add('oculto');
            document.getElementById('cliente-vista-privada').classList.remove('oculto');
            document.getElementById('txt-bienvenida-cliente').innerText = `Hola, ${clienteEncontrado.Nombre_Completo}`;
            renderizarEspacioPrivadoCliente();
            mostrarToast("Sesión autorizada", "success");
        } else {
            mostrarToast("Contraseña incorrecta", "error");
        }
    };
}

function inicializarTabsAdmin() {
    const tabs = ['sanes', 'clientes', 'puestos'];
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

// ==========================================================================
// RENDERIZADOS DE VISTA CLIENTE
// ==========================================================================
function renderizarOfertasPublicas() {
    const contenedor = document.getElementById('contenedor-ofertas-publicas');
    contenedor.innerHTML = '';
    
    const disponibles = DB.sanes.filter(s => s.Estado === 'Reclutando');
    if(disponibles.length === 0) {
        contenedor.innerHTML = `<p style="color:var(--texto-secundario);">No hay grupos en reclutamiento en este momento.</p>`;
        return;
    }

    disponibles.forEach(san => {
        const div = document.createElement('div');
        div.className = 'glass-card animate-fade-in';
        div.innerHTML = `
            <h4 style="color:var(--morado-brillante);">${san.Nombre_San}</h4>
            <div style="margin: 10px 0; font-size:0.9rem;">
                <div>Cuota Fija: <strong>$${san.Monto_Cuota}</strong></div>
                <div>Turnos Totales: <strong>${san.Total_Turnos} Puestos</strong></div>
            </div>
            <button class="btn-secondary btn-inscripcion-publica" style="width:100%; justify-content:center;">Inscribirme</button>
        `;
        // Botón Inscribirse Público Lanzador
        div.querySelector('.btn-inscripcion-publica').onclick = () => {
            if(!clienteLogueado) {
                mostrarToast("Inicia sesión primero para unirte a este San", "info");
                abrirModalLoginCliente();
            }
        };
        contenedor.appendChild(div);
    });
}

function renderizarEspacioPrivadoCliente() {
    // 1. Puestos adquiridos
    const tablaPuestos = document.getElementById('tabla-puestos-inscritos');
    const misPuestos = DB.registrosTurnos.filter(r => r.Cliente_ID == clienteLogueado.Cliente_ID);
    
    if(misPuestos.length === 0) {
        tablaPuestos.innerHTML = `<p style="color:var(--texto-secundario);">No tienes puestos asignados todavía.</p>`;
    } else {
        let rows = misPuestos.map(p => {
            const sanInfo = DB.sanes.find(s => s.San_ID == p.San_ID) || { Nombre_San: 'Desconocido' };
            return `<tr>
                <td><b>${sanInfo.Nombre_San}</b></td>
                <td>Puesto Nº ${p.Numero_Turno}</td>
                <td><span class="badge-estado ${p.Estado_Pago}">${p.Estado_Pago.toUpperCase()}</span></td>
            </tr>`;
        }).join('');
        
        tablaPuestos.innerHTML = `<table class="premium-table"><thead><tr><th>San</th><th>Turno</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    // 2. Cuotas por pagar (Pendientes / Atrasadas)
    const listaPagar = document.getElementById('lista-cuotas-pagar');
    listaPagar.innerHTML = '';
    const pendientes = misPuestos.filter(p => p.Estado_Pago !== 'pagado');

    pendientes.forEach(cuota => {
        const sanInfo = DB.sanes.find(s => s.San_ID == cuota.San_ID) || { Nombre_San: 'Desconocido', Monto_Cuota: 0 };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${sanInfo.Nombre_San} (T-${cuota.Numero_Turno})</td>
            <td style="color:var(--oro-brillante); font-weight:bold;">$${sanInfo.Monto_Cuota}</td>
            <td><button class="btn-primary btn-subir-recibo" style="padding:4px 10px;">Subir Recibo</button></td>
        `;
        
        tr.querySelector('.btn-subir-recibo').onclick = () => {
            abrirModalSubirComprobante(cuota.Registro_ID);
        };
        listaPagar.appendChild(tr);
    });
}

function abrirModalSubirComprobante(registroId) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Cargar Comprobante de Pago";
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-subir-comprobante" class="premium-form">
            <div class="form-group">
                <label>Enlace del Comprobante (O Referencia)</label>
                <input type="text" id="comprobante-link" placeholder="Ej: Link de drive, imgur o número de referencia" required>
            </div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Enviar Recibo</button>
        </form>
    `;
    modal.classList.add('modal-active');

    document.getElementById('form-subir-comprobante').onsubmit = (e) => {
        e.preventDefault();
        const link = document.getElementById('comprobante-link').value;
        modal.classList.remove('modal-active');
        ejecutarPostSheets('registrarPago', { registroId: registroId, nuevoEstado: 'pendiente', comprobante: link });
    };
}

// ==========================================================================
// INTERFAZ DE ADMINISTRACIÓN COMPLETA (CRUD)
// ==========================================================================
function renderizarAdminTodo() {
    // A. Llenar selects de asignación
    const selSan = document.getElementById('sel-puesto-san');
    const selCli = document.getElementById('sel-puesto-cliente');
    
    selSan.innerHTML = DB.sanes.map(s => `<option value="${s.San_ID}">${s.Nombre_San} ($${s.Monto_Cuota})</option>`).join('');
    selCli.innerHTML = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');

    // B. Tabla de Sanes + Eliminar Sanes
    const tablaSanes = document.getElementById('lista-admin-sanes-tabla');
    tablaSanes.innerHTML = DB.sanes.map(s => `
        <tr>
            <td><b>${s.Nombre_San}</b></td>
            <td>$${s.Monto_Cuota}</td>
            <td>${s.Total_Turnos}</td>
            <td><button class="btn-danger btn-del-san" data-id="${s.San_ID}" style="padding:2px 8px;">Eliminar</button></td>
        </tr>
    `).join('');

    tablaSanes.querySelectorAll('.btn-del-san').forEach(btn => {
        btn.onclick = (e) => {
            if(confirm("¿Seguro que deseas eliminar este San por completo?")) {
                ejecutarPostSheets('eliminarSan', { sanId: e.target.dataset.id });
            }
        };
    });

    // C. Tabla de Clientes
    document.getElementById('lista-admin-clientes-tabla').innerHTML = DB.clientes.map(c => `
        <tr><td>${c.Cliente_ID}</td><td>${c.Nombre_Completo}</td><td><code>${c.Contrasena}</code></td></tr>
    `).join('');

    // D. Tabla de Matriz Global de Pagos + Visualizador de Comprobante
    const tablaPagos = document.getElementById('tabla-admin-pagos-global');
    tablaPagos.innerHTML = '';

    DB.registrosTurnos.forEach(reg => {
        const san = DB.sanes.find(s => s.San_ID == reg.San_ID) || { Nombre_San: '-' };
        const cli = DB.clientes.find(c => c.Cliente_ID == reg.Cliente_ID) || { Nombre_Completo: '-' };
        
        const tr = document.createElement('tr');
        
        // Revisar si existe link de comprobante
        let comprobanteHtml = `<span style="color:var(--texto-secundario); font-size:0.85rem;">Ninguno</span>`;
        if (reg.Comprobante) {
            comprobanteHtml = `<button class="btn-secondary btn-ver-comprobante" data-link="${reg.Comprobante}" style="padding:2px 6px; font-size:0.75rem;">Ver Recibo</button>`;
        }

        tr.innerHTML = `
            <td>${san.Nombre_San}</td>
            <td>${cli.Nombre_Completo}</td>
            <td>Puesto ${reg.Numero_Turno}</td>
            <td><span class="badge-estado ${reg.Estado_Pago}">${reg.Estado_Pago}</span></td>
            <td>${comprobanteHtml}</td>
            <td>
                <select class="sel-cambiar-estado" data-id="${reg.Registro_ID}" style="background:#110c2c; color:white; font-size:0.8rem; padding:4px; border-radius:4px; border:1px solid var(--borde-cristal);">
                    <option value="pendiente" ${reg.Estado_Pago==='pendiente'?'selected':''}>Pendiente</option>
                    <option value="pagado" ${reg.Estado_Pago==='pagado'?'selected':''}>Pagado</option>
                    <option value="atrasado" ${reg.Estado_Pago==='atrasado'?'selected':''}>Atrasado</option>
                </select>
            </td>
        `;

        // Evento para ver el recibo en el modal
        if (reg.Comprobante) {
            tr.querySelector('.btn-ver-comprobante').onclick = (e) => {
                const link = e.target.dataset.link;
                const modal = document.getElementById('modal-premium');
                document.getElementById('modal-titulo').innerText = "Visualizador de Comprobante";
                
                if(link.startsWith('http')) {
                    document.getElementById('modal-cuerpo').innerHTML = `
                        <p style="margin-bottom:10px; font-size:0.9rem;">El cliente adjuntó una URL externa:</p>
                        <a href="${link}" target="_blank" class="btn-primary" style="width:100%; justify-content:center;">Abrir Comprobante en pestaña nueva</a>
                    `;
                } else {
                    document.getElementById('modal-cuerpo').innerHTML = `
                        <div class="glass-card" style="padding:15px; text-align:center;">
                            <label style="color:var(--texto-secundario); display:block; margin-bottom:5px;">Referencia aportada:</label>
                            <h2 style="color:var(--oro-brillante);">${link}</h2>
                        </div>
                    `;
                }
                modal.classList.add('modal-active');
            };
        }

        // Evento para cambiar estados de pago directo desde el select
        tr.querySelector('.sel-cambiar-estado').onchange = (e) => {
            ejecutarPostSheets('registrarPago', { registroId: e.target.dataset.id, nuevoEstado: e.target.value, comprobante: reg.Comprobante || '' });
        };

        tablaPagos.appendChild(tr);
    });
}

// ==========================================================================
// FORMULARIOS DE ACCIÓN (CREACIONES)
// ==========================================================================
function inicializarFormularios() {
    // Guardar Nuevo San desde el Admin
    document.getElementById('form-crear-san').onsubmit = (e) => {
        e.preventDefault();
        const nuevoSan = {
            id: "S" + Date.now().toString().slice(-4),
            nombre: document.getElementById('san-nombre').value,
            montoCuota: parseFloat(document.getElementById('san-monto').value),
            totalTurnos: parseInt(document.getElementById('san-turnos').value),
            estado: "Reclutando"
        };
        ejecutarPostSheets('crearSan', nuevoSan);
        e.target.reset();
    };

    // Guardar Nuevo Cliente desde el Admin
    document.getElementById('form-crear-cliente').onsubmit = (e) => {
        e.preventDefault();
        const nuevoCli = {
            id: "C" + Date.now().toString().slice(-4),
            nombre: document.getElementById('cli-nombre').value,
            telefono: document.getElementById('cli-telefono').value,
            contrasena: document.getElementById('cli-pass').value
        };
        ejecutarPostSheets('crearCliente', nuevoCli);
        e.target.reset();
    };

    // Asignar Puesto de San a Cliente
    document.getElementById('btn-guardar-puesto').onclick = () => {
        const puesto = {
            id: "R" + Date.now().toString().slice(-4),
            sanId: document.getElementById('sel-puesto-san').value,
            clienteId: document.getElementById('sel-puesto-cliente').value,
            turno: parseInt(document.getElementById('num-puesto-turno').value),
            fechaLimite: "2026-07-01", // Fecha base o dinámica calculable
            estado: "pendiente"
        };
        
        if(!puesto.turno) { mostrarToast("Digita un número de turno", "error"); return; }
        ejecutarPostSheets('asignarPuesto', puesto);
    };
}

function mostrarToast(mensaje, tipo = "success") {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    let color = tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#9333ea';
    
    toast.style.cssText = `background:rgba(15,10,35,0.95); backdrop-filter:blur(8px); border-left:4px solid ${color}; color:white; padding:12px 20px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.5); font-size:0.9rem; animation:fadeIn 0.3s ease;`;
    toast.innerText = mensaje;
    contenedor.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
}