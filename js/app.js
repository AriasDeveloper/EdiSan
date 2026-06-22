// js/app.js
import { API_CONFIG, ADMIN_CONFIG, FRASES_CARGA } from './config.js';

let DB = { sanes: [], clientes: [], registrosTurnos: [] };
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

// ==========================================================================
// GESTIÓN DE LA PANTALLA DE CARGA (Punto 5)
// ==========================================================================
function mostrarCarga() {
    const pantalla = document.getElementById('pantalla-carga');
    const texto = document.getElementById('texto-carga-divertido');
    
    // Elige una frase divertida aleatoria de la lista
    const fraseAleatoria = FRASES_CARGA[Math.floor(Math.random() * FRASES_CARGA.length)];
    texto.innerText = fraseAleatoria;
    
    pantalla.classList.add('modal-active');
}

function ocultarCarga() {
    document.getElementById('pantalla-carga').classList.remove('modal-active');
}

async function cargarDatosDesdeSheets() {
    mostrarCarga();
    try {
        const respuesta = await fetch(API_CONFIG.URL_APPS_SCRIPT);
        const resultado = await respuesta.json();
        
        if (resultado.status === "success") {
            DB = resultado.data;
            renderizarOfertasPublicas();
            renderizarAdminTodo();
            if(clienteLogueado) renderizarEspacioPrivadoCliente();
        }
    } catch (error) {
        mostrarToast("Error al conectar con Sheets", "error");
    } finally {
        ocultarCarga();
    }
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
        mostrarToast("Operación guardada en la nube", "success");
        setTimeout(cargarDatosDesdeSheets, 1500);
    } catch (e) {
        mostrarToast("Error en la operación", "error");
        ocultarCarga();
    }
}

// ==========================================================================
// ACCESO PRIVADO ADMINISTRADOR (Punto 4)
// ==========================================================================
function inicializarNavegacionSecreta() {
    const btnLlaveAdmin = document.getElementById('btn-llave-admin');
    const seccionAdmin = document.getElementById('seccion-admin');
    const seccionCliente = document.getElementById('seccion-cliente');
    const btnCerrarAdmin = document.getElementById('btn-cerrar-admin');

    // Botón invisible/discreto para admin
    btnLlaveAdmin.onclick = () => {
        const passIngresada = prompt("Introduce la clave de acceso de Administrador:");
        if (passIngresada === ADMIN_CONFIG.CLAVE_ACCESO) {
            seccionCliente.classList.remove('view-active');
            seccionAdmin.classList.add('view-active');
            mostrarToast("Acceso de administrador verificado", "success");
        } else if (passIngresada !== null) {
            mostrarToast("Clave incorrecta", "error");
        }
    };

    btnCerrarAdmin.onclick = () => {
        seccionAdmin.classList.remove('view-active');
        seccionCliente.classList.add('view-active');
    };

    // Botones del Login de Cliente
    document.getElementById('btn-ir-a-login').onclick = () => abrirModalLoginCliente();
    document.getElementById('btn-logout-cliente').onclick = () => {
        clienteLogueado = null;
        document.getElementById('cliente-vista-privada').classList.add('oculto');
        document.getElementById('cliente-vista-publica').classList.remove('oculto');
        mostrarToast("Sesión de cliente cerrada", "info");
    };
}

function abrirModalLoginCliente() {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Acceso Clientes Certificados";
    let opciones = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-autenticar" class="premium-form">
            <div class="form-group"><label>Tu Nombre</label><select id="login-id">${opciones}</select></div>
            <div class="form-group"><label>Contraseña</label><input type="password" id="login-pass" required></div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Ingresar</button>
        </form>
    `;
    modal.classList.add('modal-active');

    document.getElementById('form-autenticar').onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;
        const cliente = DB.clientes.find(c => c.Cliente_ID == id && String(c.Contrasena) === String(pass));

        if (cliente) {
            clienteLogueado = cliente;
            modal.classList.remove('modal-active');
            document.getElementById('cliente-vista-publica').classList.add('oculto');
            document.getElementById('cliente-vista-privada').classList.remove('oculto');
            document.getElementById('txt-bienvenida-cliente').innerText = `Hola, ${cliente.Nombre_Completo}`;
            renderizarEspacioPrivadoCliente();
        } else {
            mostrarToast("Contraseña incorrecta", "error");
        }
    };
}

function inicializarTabsAdmin() {
    ['sanes', 'clientes', 'puestos'].forEach(t => {
        document.getElementById(`tab-admin-${t}`).onclick = (e) => {
            ['sanes', 'clientes', 'puestos'].forEach(x => {
                document.getElementById(`sub-panel-${x}`).classList.add('oculto');
                document.getElementById(`tab-admin-${x}`).className = 'btn-secondary';
            });
            document.getElementById(`sub-panel-${t}`).classList.remove('oculto');
            e.target.className = 'btn-primary';
        };
    });
}

// ==========================================================================
// CONTROL DE RESERVA Y LOGICA DE PUESTOS LLENOS (Punto 2)
// ==========================================================================
function renderizarOfertasPublicas() {
    const contenedor = document.getElementById('contenedor-ofertas-publicas');
    contenedor.innerHTML = '';
    
    DB.sanes.forEach(san => {
        // Calcular cuántos puestos ya se han comprado en este San
        const puestosOcupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
        const estaLleno = puestosOcupados >= parseInt(san.Total_Turnos);

        const div = document.createElement('div');
        div.className = 'glass-card';
        div.innerHTML = `
            <h4 style="color:var(--morado-brillante);">${san.Nombre_San}</h4>
            <div style="margin: 10px 0; font-size:0.9rem;">
                <div>Cuota: <strong>$${san.Monto_Cuota}</strong></div>
                <div>Llenado: <strong>${puestosOcupados} / ${san.Total_Turnos} Puestos</strong></div>
            </div>
            <button class="btn-inscripcion-publica ${estaLleno ? 'btn-danger' : 'btn-primary'}" style="width:100%; justify-content:center;" ${estaLleno ? 'disabled' : ''}>
                ${estaLleno ? 'GRUPO LLENO' : 'Inscribirme'}
            </button>
        `;
        
        if(!estaLleno) {
            div.querySelector('.btn-inscripcion-publica').onclick = () => {
                if(!clienteLogueado) {
                    mostrarToast("Inicia sesión para solicitar tu ingreso", "info");
                    abrirModalLoginCliente();
                } else {
                    mostrarToast(`Contacta al administrador para que asigne tu cupo en ${san.Nombre_San}`, "info");
                }
            };
        }
        contenedor.appendChild(div);
    });
}

function renderizarEspacioPrivadoCliente() {
    const tablaPuestos = document.getElementById('tabla-puestos-inscritos');
    const misPuestos = DB.registrosTurnos.filter(r => r.Cliente_ID == clienteLogueado.Cliente_ID);
    
    if(misPuestos.length === 0) {
        tablaPuestos.innerHTML = `<p style="color:var(--texto-secundario);">No tienes puestos asignados todavía.</p>`;
    } else {
        let rows = misPuestos.map(p => {
            const sanInfo = DB.sanes.find(s => s.San_ID == p.San_ID) || { Nombre_San: 'Desconocido' };
            return `<tr><td><b>${sanInfo.Nombre_San}</b></td><td>Turno Nº ${p.Numero_Turno}</td><td><span class="badge-estado ${p.Estado_Pago}">${p.Estado_Pago.toUpperCase()}</span></td></tr>`;
        }).join('');
        tablaPuestos.innerHTML = `<table class="premium-table"><thead><tr><th>San</th><th>Turno</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const listaPagar = document.getElementById('lista-cuotas-pagar');
    listaPagar.innerHTML = '';
    misPuestos.filter(p => p.Estado_Pago !== 'pagado').forEach(cuota => {
        const sanInfo = DB.sanes.find(s => s.San_ID == cuota.San_ID) || { Nombre_San: '-', Monto_Cuota: 0 };
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${sanInfo.Nombre_San} (T-${cuota.Numero_Turno})</td><td style="color:var(--oro-brillante); font-weight:bold;">$${sanInfo.Monto_Cuota}</td><td><button class="btn-primary btn-subir-recibo" style="padding:4px 10px;">Subir Recibo</button></td>`;
        tr.querySelector('.btn-subir-recibo').onclick = () => abrirModalSubirComprobante(cuota.Registro_ID);
        listaPagar.appendChild(tr);
    });
}

function abrirModalSubirComprobante(registroId) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Cargar Comprobante de Pago";
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-subir-comprobante" class="premium-form">
            <div class="form-group"><label>Enlace o Referencia del Pago</label><input type="text" id="comprobante-link" required></div>
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

function renderizarAdminTodo() {
    document.getElementById('sel-puesto-san').innerHTML = DB.sanes.map(s => `<option value="${s.San_ID}">${s.Nombre_San}</option>`).join('');
    document.getElementById('sel-puesto-cliente').innerHTML = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');

    // Listado de Sanes en Admin con control de cupos totales
    const tablaSanes = document.getElementById('lista-admin-sanes-tabla');
    tablaSanes.innerHTML = DB.sanes.map(s => {
        const ocupados = DB.registrosTurnos.filter(r => r.San_ID == s.San_ID).length;
        return `<tr>
            <td><b>${s.Nombre_San}</b></td>
            <td>$${s.Monto_Cuota}</td>
            <td>${ocupados} / ${s.Total_Turnos}</td>
            <td><button class="btn-danger btn-del-san" data-id="${s.San_ID}" style="padding:2px 8px;">Eliminar</button></td>
        </tr>`;
    }).join('');

    tablaSanes.querySelectorAll('.btn-del-san').forEach(btn => {
        btn.onclick = (e) => { if(confirm("¿Eliminar este San?")) ejecutarPostSheets('eliminarSan', { sanId: e.target.dataset.id }); };
    });

    document.getElementById('lista-admin-clientes-tabla').innerHTML = DB.clientes.map(c => `<tr><td>${c.Cliente_ID}</td><td>${c.Nombre_Completo}</td><td><code>${c.Contrasena}</code></td></tr>`).join('');

    const tablaPagos = document.getElementById('tabla-admin-pagos-global');
    tablaPagos.innerHTML = DB.registrosTurnos.map(reg => {
        const san = DB.sanes.find(s => s.San_ID == reg.San_ID) || { Nombre_San: '-' };
        const cli = DB.clientes.find(c => c.Cliente_ID == reg.Cliente_ID) || { Nombre_Completo: '-' };
        let compHtml = reg.Comprobante ? `<button class="btn-secondary btn-ver-comp" data-link="${reg.Comprobante}" style="padding:2px 6px; font-size:0.75rem;">Ver Recibo</button>` : 'Ninguno';
        
        return `<tr>
            <td>${san.Nombre_San}</td>
            <td>${cli.Nombre_Completo}</td>
            <td>Turno ${reg.Numero_Turno}</td>
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

    tablaPagos.querySelectorAll('.btn-ver-comp').forEach(btn => {
        btn.onclick = (e) => {
            const link = e.target.dataset.link;
            const modal = document.getElementById('modal-premium');
            document.getElementById('modal-titulo').innerText = "Comprobante de Pago";
            document.getElementById('modal-cuerpo').innerHTML = link.startsWith('http') ? 
                `<a href="${link}" target="_blank" class="btn-primary" style="width:100%; justify-content:center;">Abrir enlace del recibo</a>` : 
                `<div class="glass-card" style="padding:15px; text-align:center;"><h3>${link}</h3></div>`;
            modal.classList.add('modal-active');
        };
    });

    tablaPagos.querySelectorAll('.sel-cambiar-estado').forEach(sel => {
        sel.onchange = (e) => {
            const reg = DB.registrosTurnos.find(r => r.Registro_ID == e.target.dataset.id);
            ejecutarPostSheets('registrarPago', { registroId: e.target.dataset.id, nuevoEstado: e.target.value, comprobante: reg.Comprobante || '' });
        };
    });
}

function inicializarFormularios() {
    document.getElementById('form-crear-san').onsubmit = (e) => {
        e.preventDefault();
        ejecutarPostSheets('crearSan', {
            id: "S" + Date.now().toString().slice(-4),
            nombre: document.getElementById('san-nombre').value,
            montoCuota: parseFloat(document.getElementById('san-monto').value),
            totalTurnos: parseInt(document.getElementById('san-turnos').value),
            estado: "Reclutando"
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

    // Validación estricta antes de asignar puestos (Punto 2)
    document.getElementById('btn-guardar-puesto').onclick = () => {
        const sanId = document.getElementById('sel-puesto-san').value;
        const sanSeleccionado = DB.sanes.find(s => s.San_ID == sanId);
        
        const puestosOcupados = DB.registrosTurnos.filter(r => r.San_ID == sanId).length;
        
        if (puestosOcupados >= parseInt(sanSeleccionado.Total_Turnos)) {
            mostrarToast("¡ERROR! Este San ya alcanzó su límite máximo de puestos", "error");
            return;
        }

        const turno = parseInt(document.getElementById('num-puesto-turno').value);
        if(!turno) { mostrarToast("Asigna un número de turno", "error"); return; }

        ejecutarPostSheets('asignarPuesto', {
            id: "R" + Date.now().toString().slice(-4),
            sanId: sanId,
            clienteId: document.getElementById('sel-puesto-cliente').value,
            turno: turno,
            fechaLimite: "2026-07-01",
            estado: "pendiente"
        });
    };
}

function mostrarToast(m, t = "success") {
    const c = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.style.cssText = `background:rgba(15,10,35,0.95); border-left:4px solid ${t==='success'?'#10b981':t==='error'?'#ef4444':'#9333ea'}; color:white; padding:12px 20px; border-radius:8px; font-size:0.9rem;`;
    toast.innerText = m; c.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}