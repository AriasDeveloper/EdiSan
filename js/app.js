// js/app.js
import { API_CONFIG, ADMIN_CONFIG, FRASES_CARGA } from './config.js';

// Estructura de datos global sincronizada con Sheets
let DB = { 
    sanes: [], 
    clientes: [], 
    registrosTurnos: [], 
    solicitudesNuevos: [], 
    solicitudesInscritos: [],
    productos: [] 
};
let clienteLogueado = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacionSecreta();
    inicializarTabsAdmin();
    inicializarFormularios();
    
    document.getElementById('btn-cerrar-modal').onclick = () => {
        document.getElementById('modal-premium').classList.remove('modal-active');
    };
    
    // Carga inicial de datos desde la nube
    cargarDatosDesdeSheets();
});

// ==========================================================================
// PANTALLA DE CARGA (Glassmorphism + Frases personalizadas)
// ==========================================================================
function mostrarCarga() {
    const fraseAleatoria = FRASES_CARGA[Math.floor(Math.random() * FRASES_CARGA.length)];
    document.getElementById('texto-carga-divertido').innerText = fraseAleatoria;
    document.getElementById('pantalla-carga').classList.add('modal-active');
}

function ocultarCarga() { 
    document.getElementById('pantalla-carga').classList.remove('modal-active'); 
}

// ==========================================================================
// SINCRONIZACIÓN CON EL SERVIDOR (GET / POST)
// ==========================================================================
async function cargarDatosDesdeSheets() {
    mostrarCarga();
    try {
        const respuesta = await fetch(API_CONFIG.URL_APPS_SCRIPT);
        const resultado = await respuesta.json();
        
        if (resultado.status === "success") {
            DB = resultado.data;
            
            // Cambiar automáticamente estados vencidos localmente
            verificarFechasVencidas();

            // Renderizar vistas del cliente y catálogo público
            renderizarOfertasPublicas();
            renderizarProductosVitrinas();
            
            // Si el administrador está viendo el panel, refrescamos sus datos
            if (document.getElementById('seccion-admin').classList.contains('view-active')) {
                renderizarAdminTodo();
            }
            
            // Si el cliente está logueado, actualizamos su espacio privado
            if (clienteLogueado) {
                clienteLogueado = DB.clientes.find(c => c.Cliente_ID === clienteLogueado.Cliente_ID) || clienteLogueado;
                renderizarEspacioPrivadoCliente();
            }
        } else {
            mostrarToast("Error en la estructura de datos del servidor", "error");
        }
    } catch (e) { 
        mostrarToast("Error de sincronización con la nube", "error"); 
        console.error(e);
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
        mostrarToast("Cambio registrado de forma segura", "success");
        // Recarga tras un breve delay para que impacte en Sheets
        setTimeout(cargarDatosDesdeSheets, 1200);
    } catch (e) { 
        mostrarToast("Fallo al escribir en la base de datos", "error"); 
        ocultarCarga(); 
    }
}

function verificarFechasVencidas() {
    const hoy = new Date();
    DB.registrosTurnos.forEach(reg => {
        if (reg.Estado_Pago === 'pendiente' && reg.Fecha_Limite) {
            const limite = new Date(reg.Fecha_Limite);
            if (hoy > limite) {
                reg.Estado_Pago = 'atrasado'; 
            }
        }
    });
}

// ==========================================================================
// CONTROL DE ACCESOS Y NAVEGACIÓN SECRETA
// ==========================================================================
function inicializarNavegacionSecreta() {
    const btnLlaveAdmin = document.getElementById('btn-llave-admin');
    const seccionAdmin = document.getElementById('seccion-admin');
    const seccionCliente = document.getElementById('seccion-cliente');
    const btnCerrarAdmin = document.getElementById('btn-cerrar-admin');

    btnLlaveAdmin.onclick = () => {
        const pass = prompt("Introduce la clave de acceso del Administrador:");
        if (pass === ADMIN_CONFIG.CLAVE_ACCESO) {
            seccionCliente.classList.remove('view-active');
            seccionAdmin.classList.add('view-active');
            renderizarAdminTodo(); 
            
            // CORRECCIÓN: Forzar la activación visual de la primera sub-pestaña al entrar
            document.getElementById('tab-admin-sanes').click();
            
            mostrarToast("Acceso verificado. ¡Hola Patrona!", "success");
        } else if (pass !== null) {
            mostrarToast("Clave incorrecta", "error");
        }
    };

    btnCerrarAdmin.onclick = () => {
        seccionAdmin.classList.remove('view-active');
        seccionCliente.classList.add('view-active');
    };

    document.getElementById('btn-ir-a-login').onclick = () => abrirModalLoginCliente();
    
    document.getElementById('btn-logout-cliente').onclick = () => {
        clienteLogueado = null;
        document.getElementById('cliente-vista-privada').classList.add('oculto');
        document.getElementById('cliente-vista-publica').classList.remove('oculto');
        mostrarToast("Sesión cerrada", "info");
    };
}

function abrirModalLoginCliente() {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Área de Clientes Premium";
    
    let opciones = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    if(!opciones) opciones = `<option value="">No hay clientes registrados</option>`;

    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-autenticar" class="premium-form">
            <div class="form-group"><label>Selecciona tu Usuario</label><select id="login-id">${opciones}</select></div>
            <div class="form-group"><label>Tu Contraseña Privada</label><input type="password" id="login-pass" required></div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Entrar al Sistema</button>
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
            mostrarToast("Bienvenido de vuelta", "success");
        } else {
            mostrarToast("Contraseña incorrecta", "error");
        }
    };
}

function inicializarTabsAdmin() {
    const tabs = ['sanes', 'clientes', 'puestos', 'solicitudes', 'productos'];
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
// RENDERIZADO INTERFAZ CLIENTES (CON IMÁGENES Y PRODUCTOS)
// ==========================================================================
function renderizarOfertasPublicas() {
    const contenedor = document.getElementById('contenedor-ofertas-publicas');
    contenedor.innerHTML = '';
    
    DB.sanes.forEach(san => {
        const ocupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
        const lleno = ocupados >= parseInt(san.Total_Turnos);

        const imagenHtml = san.Imagen_URL ? `
            <div style="width:100%; height:140px; border-radius:10px; background-image: url('${san.Imagen_URL}'); background-size:cover; background-position:center; margin-bottom:12px;"></div>
        ` : '';

        const div = document.createElement('div');
        div.className = 'glass-card';
        div.innerHTML = `
            ${imagenHtml}
            <h4 style="color:var(--morado-brillante); font-size:1.15rem;">${san.Nombre_San}</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom: 8px;">Ciclo de pago: ${san.Ciclo || 'Mensual'}</p>
            <div style="margin: 12px 0; font-size:0.9rem; line-height:1.5;">
                <div>Cuota Fija: <strong style="color:var(--oro-brillante);">$${san.Monto_Cuota}</strong></div>
                <div>Disponibilidad: <strong>${ocupados} / ${san.Total_Turnos} Puestos</strong></div>
            </div>
            <button class="btn-solicitar btn-primary" style="width:100%; justify-content:center;" ${lleno ? 'disabled' : ''}>
                ${lleno ? 'GRUPO LLENO' : 'Postularme al San'}
            </button>
        `;

        div.querySelector('.btn-solicitar').onclick = () => {
            abrirModalInscripcionPublico(san.San_ID, san.Nombre_San);
        };
        contenedor.appendChild(div);
    });
}

function renderizarProductosVitrinas() {
    const contenedorCliente = document.getElementById('contenedor-productos-cliente');
    if (!contenedorCliente) return;

    if (DB.productos.length === 0) {
        contenedorCliente.innerHTML = `<p style="color:var(--texto-secundario); grid-column: 1/-1; text-align:center;">No hay productos exhibidos actualmente.</p>`;
        return;
    }

    contenedorCliente.innerHTML = DB.productos.map(p => `
        <div class="glass-card animate-fade" style="text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <img src="${p.Imagen_URL}" style="width:100%; height:160px; object-fit:cover; border-radius:10px; border: 1px solid var(--borde-cristal);">
                <h4 style="margin-top:12px; color:#fff; font-size:1.1rem;">${p.Nombre}</h4>
                <p style="font-size:0.85rem; color:var(--texto-secundario); margin:6px 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.Descripcion}</p>
            </div>
            <div>
                <div style="color:var(--oro-brillante); font-weight:bold; font-size:1.3rem; margin:10px 0;">$${p.Precio}</div>
                <button class="btn-primary" style="width:100%; justify-content:center;" onclick="alert('Ponte en contacto directo con la Patrona (Edimar) para adquirir este producto.')">Adquirir Producto</button>
            </div>
        </div>
    `).join('');
}

function abrirModalInscripcionPublico(sanId, nombreSan) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = `Inscripción: ${nombreSan}`;
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-solicitar-nuevo" class="premium-form">
            <div class="form-group"><label>Tu Nombre y Apellido</label><input type="text" id="sol-nombre" required></div>
            <div class="form-group"><label>Número de WhatsApp / Teléfono</label><input type="text" id="sol-telef" placeholder="Ej. +58412..." required></div>
            <p style="font-size:0.8rem; color:var(--texto-secundario); line-height:1.4;">Nota: Tu información pasará a una lista de espera. Te llegará una clave de acceso una vez la propuesta sea aprobada.</p>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:10px;">Enviar Solicitud Directa</button>
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
    const tablaPuestos = document.getElementById('tabla-puestos-inscritos');
    const misPuestos = DB.registrosTurnos.filter(r => r.Cliente_ID == clienteLogueado.Cliente_ID);
    
    if(misPuestos.length === 0) {
        tablaPuestos.innerHTML = `<p style="color:var(--texto-secundario);">No tienes puestos asignados en ningún San activo.</p>`;
    } else {
        let rows = misPuestos.map(p => {
            const s = DB.sanes.find(x => x.San_ID == p.San_ID) || { Nombre_San: 'Desconocido' };
            return `<tr><td><b>${s.Nombre_San}</b></td><td>Turno Nº ${p.Numero_Turno}</td><td><span class="badge-estado ${p.Estado_Pago}">${p.Estado_Pago.toUpperCase()}</span></td></tr>`;
        }).join('');
        tablaPuestos.innerHTML = `<table class="premium-table"><thead><tr><th>San</th><th>Turno</th><th>Tu Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const listaPagar = document.getElementById('lista-cuotas-pagar');
    listaPagar.innerHTML = '';
    
    const cuotasPendientes = misPuestos.filter(p => p.Estado_Pago !== 'pagado');
    if(cuotasPendientes.length === 0) {
        listaPagar.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--texto-secundario);">¡Felicidades! Estás al día con todos tus pagos.</td></tr>`;
    } else {
        cuotasPendientes.forEach(cuota => {
            const s = DB.sanes.find(x => x.San_ID == cuota.San_ID) || { Nombre_San: '-', Monto_Cuota: 0 };
            const tr = document.createElement('tr');
            const vencimientoLimpio = cuota.Fecha_Limite ? cuota.Fecha_Limite.split('T')[0] : 'Por definir';
            
            tr.innerHTML = `
                <td><b>${s.Nombre_San}</b> (T-${cuota.Numero_Turno})</td>
                <td style="color:var(--oro-brillante); font-weight:bold;">$${s.Monto_Cuota}</td>
                <td><span style="color:#ef4444;">${vencimientoLimpio}</span></td>
                <td><button class="btn-primary btn-subir-recibo" style="padding:5px 12px; font-size:0.85rem;">Subir Recibo</button></td>
            `;
            tr.querySelector('.btn-subir-recibo').onclick = () => abrirModalSubirComprobante(cuota.Registro_ID);
            listaPagar.appendChild(tr);
        });
    }

    // CORRECCIÓN: Mostrar Sanes Disponibles dentro del Panel Privado del Cliente
    const contenedorPrivado = document.getElementById('contenedor-ofertas-privadas');
    contenedorPrivado.innerHTML = '';
    
    const sanesDisponibles = DB.sanes.filter(san => !misPuestos.some(m => m.San_ID == san.San_ID));
    if(sanesDisponibles.length === 0) {
        contenedorPrivado.innerHTML = `<p style="color:var(--texto-secundario); padding:10px; grid-column: 1/-1; text-align:center;">Estás participando en todos los grupos disponibles.</p>`;
    } else {
        sanesDisponibles.forEach(san => {
            const ocupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
            const completo = ocupados >= parseInt(san.Total_Turnos);
            const imagenHtml = san.Imagen_URL ? `<div style="width:100%; height:140px; border-radius:10px; background-image: url('${san.Imagen_URL}'); background-size:cover; background-position:center; margin-bottom:12px;"></div>` : '';
            
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.innerHTML = `
                ${imagenHtml}
                <h4>${san.Nombre_San}</h4>
                <p style="font-size:0.9rem; margin:5px 0; color:var(--texto-secundario);">Cuota: <b>$${san.Monto_Cuota}</b> (${san.Ciclo})</p>
                <button class="btn-primary btn-proponer" style="width:100%; margin-top:8px; justify-content:center;" ${completo ? 'disabled' : ''}>
                    ${completo ? 'Lleno' : 'Solicitar Entrada'}
                </button>
            `;
            
            if(!completo) {
                div.querySelector('.btn-proponer').onclick = () => {
                    const passConfirmacion = prompt("Introduce tu contraseña de cuenta para enviar la propuesta a la patrona:");
                    if (passConfirmacion === String(clienteLogueado.Contrasena)) {
                        ejecutarPostSheets('propuestaInscrito', {
                            id: "PROP" + Date.now().toString().slice(-4),
                            clienteId: clienteLogueado.Cliente_ID,
                            sanId: san.San_ID
                        });
                    } else if(passConfirmacion !== null) {
                        alert("Verificación fallida. Contraseña incorrecta.");
                    }
                };
            }
            contenedorPrivado.appendChild(div);
        });
    }

    // CORRECCIÓN: Insertar y pintar la Vitrina de Productos abajo en el área privada
    let seccionProductosPrivada = document.getElementById('productos-cliente-privado');
    if (!seccionProductosPrivada) {
        seccionProductosPrivada = document.createElement('div');
        seccionProductosPrivada.id = 'productos-cliente-privado';
        seccionProductosPrivada.innerHTML = `
            <h3 class="premium-title" style="margin-top: 4rem;">🛍️ Catálogo de Productos Disponibles</h3>
            <div id="contenedor-productos-cliente-privado" class="grid-premium"></div>
        `;
        document.getElementById('cliente-vista-privada').appendChild(seccionProductosPrivada);
    }
    
    const contenedorProductosPrivados = document.getElementById('contenedor-productos-cliente-privado');
    if (DB.productos.length === 0) {
        contenedorProductosPrivados.innerHTML = `<p style="color:var(--texto-secundario); grid-column: 1/-1; text-align:center;">No hay productos exhibidos actualmente.</p>`;
    } else {
        contenedorProductosPrivados.innerHTML = DB.productos.map(p => `
            <div class="glass-card animate-fade" style="text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <img src="${p.Imagen_URL}" style="width:100%; height:160px; object-fit:cover; border-radius:10px; border: 1px solid var(--borde-cristal);">
                    <h4 style="margin-top:12px; color:#fff; font-size:1.1rem;">${p.Nombre}</h4>
                    <p style="font-size:0.85rem; color:var(--texto-secundario); margin:6px 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.Descripcion}</p>
                </div>
                <div>
                    <div style="color:var(--oro-brillante); font-weight:bold; font-size:1.3rem; margin:10px 0;">$${p.Precio}</div>
                    <button class="btn-primary" style="width:100%; justify-content:center;" onclick="alert('Ponte en contacto directo con la Patrona (Edimar) para adquirir este producto.')">Adquirir Producto</button>
                </div>
            </div>
        `).join('');
    }
}

function abrirModalSubirComprobante(registroId) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Cargar Comprobante de Pago";
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-subir-comprobante" class="premium-form">
            <div class="form-group"><label>Escribe el Número de Referencia o URL del Captura</label><input type="text" id="comprobante-link" placeholder="Ej. Ref: 492042 o Enlace Imgur" required></div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Enviar a Revisión</button>
        </form>
    `;
    modal.classList.add('modal-active');
    document.getElementById('form-subir-comprobante').onsubmit = (e) => {
        e.preventDefault();
        modal.classList.remove('modal-active');
        ejecutarPostSheets('registrarPago', { 
            registroId: registroId, 
            nuevoEstado: 'pendiente', 
            comprobante: document.getElementById('comprobante-link').value 
        });
    };
}

// ==========================================================================
// INTERFAZ CONTROL DEL ADMINISTRADOR (LA PATRONA)
// ==========================================================================
function renderizarAdminTodo() {
    document.getElementById('sel-puesto-san').innerHTML = DB.sanes.map(s => `<option value="${s.San_ID}">${s.Nombre_San} (${s.Ciclo})</option>`).join('');
    document.getElementById('sel-puesto-cliente').innerHTML = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');

    document.getElementById('sel-puesto-san').onchange = (e) => actualizarDesplegableTurnos(e.target.value);
    if(DB.sanes.length > 0) actualizarDesplegableTurnos(DB.sanes[0].San_ID);

    // Tabla de Sanes Activos
    document.getElementById('lista-admin-sanes-tabla').innerHTML = DB.sanes.map(s => {
        const o = DB.registrosTurnos.filter(r => r.San_ID == s.San_ID).length;
        return `<tr>
            <td><b>${s.Nombre_San}</b></td>
            <td>$${s.Monto_Cuota}</td>
            <td>${s.Ciclo || 'Mensual'}</td>
            <td>${o} / ${s.Total_Turnos}</td>
            <td><button class="btn-danger btn-del-san" data-id="${s.San_ID}" style="padding:3px 8px; font-size:0.8rem;">Eliminar</button></td>
        </tr>`;
    }).join('');

    // Tabla de Clientes Activos
    document.getElementById('lista-admin-clientes-tabla').innerHTML = DB.clientes.map(c => `
        <tr>
            <td>${c.Cliente_ID}</td>
            <td><b>${c.Nombre_Completo}</b></td>
            <td><code>${c.Contrasena}</code></td>
            <td><button class="btn-danger btn-del-cliente" data-id="${c.Cliente_ID}" style="padding:3px 8px; font-size:0.8rem;">Eliminar</button></td>
        </tr>
    `).join('');

    // Tabla de Productos en el Inventario Admin
    const tablaAdminProd = document.getElementById('tabla-admin-productos');
    if(tablaAdminProd) {
        tablaAdminProd.innerHTML = DB.productos.map(p => `
            <tr>
                <td><img src="${p.Imagen_URL}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid var(--borde-cristal);"></td>
                <td><b>${p.Nombre}</b><br><small style="color:gray;">${p.Descripcion}</small></td>
                <td style="color:var(--oro-brillante); font-weight:bold;">$${p.Precio}</td>
                <td>${p.Stock} unds</td>
                <td><button class="btn-danger btn-del-prod" data-id="${p.Producto_ID}" style="padding:3px 8px; font-size:0.8rem;">Eliminar</button></td>
            </tr>
        `).join('');
    }

    // Matriz de pagos global
    const tablaPagos = document.getElementById('tabla-admin-pagos-global');
    tablaPagos.innerHTML = DB.registrosTurnos.map(reg => {
        const san = DB.sanes.find(s => s.San_ID == reg.San_ID) || { Nombre_San: '-', Fecha_Inicio: '' };
        const cli = DB.clientes.find(c => c.Cliente_ID == reg.Cliente_ID) || { Nombre_Completo: '-' };
        let compHtml = reg.Comprobante ? `<button class="btn-secondary btn-ver-comp" data-link="${reg.Comprobante}" data-id="${reg.Registro_ID}" style="padding:3px 8px; font-size:0.75rem;">Ver Recibo</button>` : '<i style="color:gray">Ninguno</i>';
        const vencimientoUnificado = san.Fecha_Inicio ? san.Fecha_Inicio.split('T')[0] : 'Sin fecha';

        return `<tr>
            <td><b>${san.Nombre_San}</b></td>
            <td>${cli.Nombre_Completo}</td>
            <td>Turno ${reg.Numero_Turno}</td>
            <td><b>${vencimientoUnificado}</b></td>
            <td><span class="badge-estado ${reg.Estado_Pago}">${reg.Estado_Pago}</span></td>
            <td>${compHtml}</td>
            <td>
                <select class="sel-cambiar-estado" data-id="${reg.Registro_ID}" style="padding:2px 5px; font-size:0.85rem; background:#000; color:#fff; border:1px solid var(--borde-cristal); border-radius:4px;">
                    <option value="pendiente" ${reg.Estado_Pago==='pendiente'?'selected':''}>Pendiente</option>
                    <option value="pagado" ${reg.Estado_Pago==='pagado'?'selected':''}>Pagado</option>
                    <option value="atrasado" ${reg.Estado_Pago==='atrasado'?'selected':''}>Atrasado</option>
                </select>
            </td>
        </tr>`;
    }).join('');

    // Listas de Espera
    document.getElementById('tabla-espera-nuevos').innerHTML = DB.solicitudesNuevos.map(sn => {
        const s = DB.sanes.find(x => x.San_ID == sn.San_ID) || { Nombre_San: '-' };
        return `<tr>
            <td><b>${sn.Nombre_Completo}</b></td>
            <td>${sn.Telefono}</td>
            <td>${s.Nombre_San}</td>
            <td>
                <button class="btn-primary btn-apr-nuevo" data-id="${sn.Solicitud_ID}" data-nombre="${sn.Nombre_Completo}" data-tel="${sn.Telefono}" style="padding:3px 8px; font-size:0.8rem;">Aceptar</button>
                <button class="btn-danger btn-rec-nuevo" data-id="${sn.Solicitud_ID}" style="padding:3px 6px; font-size:0.8rem;">X</button>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('tabla-espera-inscritos').innerHTML = DB.solicitudesInscritos.map(si => {
        const c = DB.clientes.find(x => x.Cliente_ID == si.Cliente_ID) || { Nombre_Completo: '-' };
        const s = DB.sanes.find(x => x.San_ID == si.San_ID) || { Nombre_San: '-' };
        return `<tr>
            <td><b>${c.Nombre_Completo}</b></td>
            <td>${s.Nombre_San}</td>
            <td>
                <button class="btn-primary btn-apr-inscrito" data-id="${si.Propuesta_ID}" style="padding:3px 8px; font-size:0.8rem;">Aceptar</button>
                <button class="btn-danger btn-rec-inscrito" data-id="${si.Propuesta_ID}" style="padding:3px 6px; font-size:0.8rem;">X</button>
            </td>
        </tr>`;
    }).join('');

    conectarEventosPanelAdmin(tablaPagos);
}

function actualizarDesplegableTurnos(sanId) {
    const selectTurnos = document.getElementById('num-puesto-turno');
    const sanSeleccionado = DB.sanes.find(s => s.San_ID == sanId);
    if(!sanSeleccionado) return;

    const limiteTurnos = parseInt(sanSeleccionado.Total_Turnos);
    const turnosOcupados = DB.registrosTurnos.filter(r => r.San_ID == sanId).map(r => parseInt(r.Numero_Turno));

    let opcionesHtml = '';
    for (let i = 1; i <= limiteTurnos; i++) {
        if (!turnosOcupados.includes(i)) {
            opcionesHtml += `<option value="${i}">Turno ${i} (Disponible)</option>`;
        } else {
            opcionesHtml += `<option value="${i}" disabled>Turno ${i} (Ocupado 🚫)</option>`;
        }
    }
    selectTurnos.innerHTML = opcionesHtml || `<option value="">Grupo Lleno</option>`;
}

function conectarEventosPanelAdmin(tablaPagos) {
    document.querySelectorAll('.btn-del-san').forEach(b => b.onclick = (e) => {
        if(confirm("¿Eliminar este grupo de ahorro?")) ejecutarPostSheets('eliminarSan', { sanId: e.target.dataset.id });
    });

    document.querySelectorAll('.btn-del-cliente').forEach(b => b.onclick = (e) => {
        if(confirm("¿Remover a este cliente? Se revocará su acceso.")) ejecutarPostSheets('eliminarCliente', { clienteId: e.target.dataset.id });
    });

    document.querySelectorAll('.btn-del-prod').forEach(b => b.onclick = (e) => {
        if(confirm("¿Eliminar este producto del catálogo?")) ejecutarPostSheets('eliminarProducto', { productoId: e.target.dataset.id });
    });

    tablaPagos.querySelectorAll('.btn-ver-comp').forEach(btn => {
        btn.onclick = (e) => {
            const link = e.target.dataset.link;
            const regId = e.target.dataset.id;
            const modal = document.getElementById('modal-premium');
            
            document.getElementById('modal-titulo').innerText = "Verificación de Recibo";
            document.getElementById('modal-cuerpo').innerHTML = `
                <div style="text-align:center; display:flex; flex-direction:column; gap:16px;">
                    <p style="font-size:1.1rem;">Comprobante: <code>${link}</code></p>
                    ${link.startsWith('http') ? `<a href="${link}" target="_blank" class="btn-primary" style="justify-content:center;">Abrir en pestaña nueva</a>` : ''}
                    <hr style="border:0; border-top:1px solid var(--borde-cristal);">
                    <button class="btn-danger" id="action-eliminar-comprobante" style="width:100%; justify-content:center;"><span class="material-icons-round">delete</span> Rechazar y Eliminar Comprobante</button>
                </div>
            `;
            modal.classList.add('modal-active');
            
            document.getElementById('action-eliminar-comprobante').onclick = () => {
                if(confirm("¿Deseas rechazar este pago? El estado volverá instantáneamente a pendiente.")) {
                    modal.classList.remove('modal-active');
                    ejecutarPostSheets('eliminarComprobante', { registroId: regId });
                }
            };
        };
    });

    tablaPagos.querySelectorAll('.sel-cambiar-estado').forEach(sel => {
        sel.onchange = (e) => {
            const r = DB.registrosTurnos.find(x => x.Registro_ID == e.target.dataset.id);
            ejecutarPostSheets('registrarPago', { 
                registroId: e.target.dataset.id, 
                nuevoEstado: e.target.value, 
                comprobante: r.Comprobante || '' 
            });
        };
    });

    document.querySelectorAll('.btn-rec-nuevo').forEach(b => b.onclick = (e) => ejecutarPostSheets('resolverSolicitudNuevo', { solicitudId: e.target.dataset.id }));
    document.querySelectorAll('.btn-rec-inscrito').forEach(b => b.onclick = (e) => ejecutarPostSheets('resolverPropuestaInscrito', { propuestaId: e.target.dataset.id }));

    document.querySelectorAll('.btn-apr-nuevo').forEach(b => b.onclick = async (e) => {
        const d = e.target.dataset;
        const nuevoClienteId = "C" + Date.now().toString().slice(-3);
        const claveGenerada = Math.floor(1000 + Math.random() * 9000).toString();
        
        mostrarCarga();
        await fetch(API_CONFIG.URL_APPS_SCRIPT, { method: 'POST', body: JSON.stringify({ action: 'crearCliente', payload: { id: nuevoClienteId, nombre: d.nombre, telefono: d.tel, contrasena: claveGenerada } })});
        await fetch(API_CONFIG.URL_APPS_SCRIPT, { method: 'POST', body: JSON.stringify({ action: 'resolverSolicitudNuevo', payload: { solicitudId: d.id } })});
        
        alert(`¡Aprobado!\nCliente: ${d.nombre}\nClave Temporal de Acceso: ${claveGenerada}`);
        setTimeout(cargarDatosDesdeSheets, 500);
    });

    document.querySelectorAll('.btn-apr-inscrito').forEach(b => b.onclick = async (e) => {
        mostrarCarga();
        await fetch(API_CONFIG.URL_APPS_SCRIPT, { method: 'POST', body: JSON.stringify({ action: 'resolverPropuestaInscrito', payload: { propuestaId: e.target.dataset.id } })});
        alert("Propuesta aceptada. Procede a asignarle su puesto correspondiente.");
        setTimeout(cargarDatosDesdeSheets, 500);
    });
}

// ==========================================================================
// SUBMIT Y PROCESAMIENTO DE FORMULARIOS DIRECTOS
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
            ciclo: document.getElementById('san-ciclo').value,
            fechaInicio: document.getElementById('san-fecha-inicio').value,
            imagenUrl: document.getElementById('san-imagen').value
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

    const formProducto = document.getElementById('form-crear-producto');
    if (formProducto) {
        formProducto.onsubmit = (e) => {
            e.preventDefault();
            ejecutarPostSheets('crearProducto', {
                id: "P" + Date.now().toString().slice(-4),
                nombre: document.getElementById('prod-nombre').value,
                descripcion: document.getElementById('prod-desc').value,
                precio: parseFloat(document.getElementById('prod-precio').value),
                imagenUrl: document.getElementById('prod-img').value,
                stock: parseInt(document.getElementById('prod-stock').value)
            });
            e.target.reset();
        };
    }

    document.getElementById('btn-guardar-puesto').onclick = () => {
        const sanId = document.getElementById('sel-puesto-san').value;
        const turno = document.getElementById('num-puesto-turno').value;
        
        if(!turno) {
            mostrarToast("No hay turnos disponibles para asignar", "error");
            return;
        }

        const sanSeleccionado = DB.sanes.find(s => s.San_ID == sanId);
        const fechaDelSan = sanSeleccionado.Fecha_Inicio ? sanSeleccionado.Fecha_Inicio.split('T')[0] : "2026-01-01";

        ejecutarPostSheets('assignarPuesto', {
            id: "R" + Date.now().toString().slice(-4),
            sanId: sanId,
            clienteId: document.getElementById('sel-puesto-cliente').value,
            turno: parseInt(turno),
            fechaLimite: fechaDelSan, 
            estado: "pendiente"
        });
    };
}

function mostrarToast(mensaje, tipo = "success") {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: rgba(11, 7, 28, 0.96); 
        border-left: 4px solid ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#c084fc'}; 
        color: #fff; 
        padding: 14px 22px; 
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        font-size: 0.9rem;
        backdrop-filter: blur(8px);
        transition: all 0.3s ease;
    `;
    toast.innerText = mensaje; 
    contenedor.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}