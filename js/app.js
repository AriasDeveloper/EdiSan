// js/app.js
import { ADMIN_CONFIG, FRASES_CARGA } from './config.js';
import { DB, cargarDatosDesdeSheets, ejecutarPostSheets } from './api.js';

let clienteLogueado = null;

// Exponer funciones globalmente para el entorno
window.mostrarCarga = mostrarCarga;
window.ocultarCarga = ocultarCarga;
window.mostrarToast = mostrarToast;
window.recargarManejador = () => cargarDatosDesdeSheets(mostrarCarga, ocultarCarga, refrescarTodaLaUI);

// Iniciar carga de datos al abrir la app
mostrarCarga();

document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacionEstructural();
    inicializarTabsAdmin();
    configurarEnviosFormulariosAdmin();
    
    document.getElementById('btn-cerrar-modal').onclick = () => {
        document.getElementById('modal-premium').classList.remove('modal-active');
    };
    
    window.recargarManejador();
});

function mostrarCarga() {
    const txt = document.getElementById('texto-carga-divertido');
    const panta = document.getElementById('pantalla-carga');
    if (txt && FRASES_CARGA) {
        txt.innerText = FRASES_CARGA[Math.floor(Math.random() * FRASES_CARGA.length)];
    }
    if (panta) panta.classList.add('modal-active');
}

function ocultarCarga() {
    const panta = document.getElementById('pantalla-carga');
    if (panta) panta.classList.remove('modal-active');
}

function refrescarTodaLaUI() {
    renderizarOfertasPublicas();
    renderizarVitrinaProductosPublica();
    
    if (document.getElementById('seccion-admin').classList.contains('view-active')) {
        renderizarAdminTodo();
    }
    if (clienteLogueado) {
        // Actualizar datos del cliente logueado por si hubo cambios en el backend
        const actualizado = DB.clientes.find(c => c.Cliente_ID == clienteLogueado.Cliente_ID);
        if (actualizado) clienteLogueado = actualizado;
        renderizarEspacioPrivadoCliente();
    }
}

// ==========================================
// FORMULARIOS DE CREACIÓN (PANEL ADMIN)
// ==========================================
function configurarEnviosFormulariosAdmin() {
    
    // 1. Crear Nuevo San (Corrección de guardado de Monto y Fecha)
    document.getElementById('form-crear-san').onsubmit = (e) => {
        e.preventDefault();
        
        const datosSan = {
            id: "SAN" + Date.now().toString().slice(-4),
            nombre: document.getElementById('san-nombre').value,
            monto: parseFloat(document.getElementById('san-monto').value),
            fecha: document.getElementById('san-fecha').value,
            turnos: 3
        };

        ejecutarPostSheets('crearSan', datosSan, mostrarCarga, () => {
            ocultarCarga();
            mostrarToast("¡San aperturado con éxito!", "success");
            window.recargarManejador();
        });
        e.target.reset();
    };

    // 2. Crear Cliente Manualmente
    document.getElementById('form-crear-cliente').onsubmit = (e) => {
        e.preventDefault();
        
        const datosCliente = {
            id: "CLI" + Date.now().toString().slice(-4),
            nombre: document.getElementById('cli-nombre').value,
            telefono: document.getElementById('cli-telefono').value,
            contrasena: document.getElementById('cli-pass').value
        };

        ejecutarPostSheets('crearCliente', datosCliente, mostrarCarga, () => {
            ocultarCarga();
            mostrarToast("Cliente registrado en la base de datos", "success");
            window.recargarManejador();
        });
        e.target.reset();
    };

    // 3. Crear y Publicar Producto
    document.getElementById('form-crear-producto').onsubmit = (e) => {
        e.preventDefault();
        
        const datosProducto = {
            id: "PROD" + Date.now().toString().slice(-4),
            nombre: document.getElementById('prod-nombre').value,
            precio: parseFloat(document.getElementById('prod-precio').value),
            imagen: document.getElementById('prod-imagen').value || "https://placehold.co/150"
        };

        ejecutarPostSheets('crearProducto', datosProducto, mostrarCarga, () => {
            ocultarCarga();
            mostrarToast("Producto agregado a la vitrina", "success");
            window.recargarManejador();
        });
        e.target.reset();
    };
}

// ==========================================
// NAVEGACIÓN Y AUTENTICACIÓN
// ==========================================
function inicializarNavegacionEstructural() {
    // Ingreso con llave de seguridad al panel de Edimar
    document.getElementById('btn-llave-admin').onclick = () => {
        const pass = prompt("Clave de la Directiva:");
        if (pass === ADMIN_CONFIG.CLAVE_ACCESO) {
            document.getElementById('seccion-cliente').classList.remove('view-active');
            document.getElementById('seccion-admin').classList.add('view-active');
            renderizarAdminTodo();
            document.querySelector('.tab-trigger[data-tab="sanes"]').click();
            mostrarToast("Sesión de Administración activa", "success");
        } else if (pass !== null) {
            mostrarToast("Contraseña incorrecta", "error");
        }
    };

    document.getElementById('btn-cerrar-admin').onclick = () => {
        document.getElementById('seccion-admin').classList.remove('view-active');
        document.getElementById('seccion-cliente').classList.add('view-active');
    };

    document.getElementById('btn-ir-a-login').onclick = () => abrirModalLogin();

    document.getElementById('btn-logout-cliente').onclick = () => {
        clienteLogueado = null;
        document.getElementById('cliente-vista-privada').classList.add('oculto');
        document.getElementById('cliente-vista-publica').style.display = "block";
        mostrarToast("Sesión de cliente cerrada", "info");
    };
}

function inicializarTabsAdmin() {
    const triggers = document.querySelectorAll('.tab-trigger');
    triggers.forEach(btn => {
        btn.onclick = () => {
            triggers.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content-admin').forEach(c => c.classList.add('oculto'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.getAttribute('data-tab')}`).classList.remove('oculto');
        };
    });
}

function abrirModalLogin() {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Área Privada de Clientes";
    let opciones = (DB.clientes || []).map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-autenticar" class="premium-form">
            <div class="form-group"><label>Selecciona tu Usuario</label><select id="login-id">${opciones}</select></div>
            <div class="form-group"><label>Contraseña</label><input type="password" id="login-pass" required></div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Entrar</button>
        </form>
    `;
    modal.classList.add('modal-active');

    document.getElementById('form-autenticar').onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;
        const c = DB.clientes.find(cli => cli.Cliente_ID == id && String(cli.Contrasena) === String(pass));

        if (c) {
            clienteLogueado = c;
            modal.classList.remove('modal-active');
            document.getElementById('cliente-vista-publica').style.display = "none";
            document.getElementById('cliente-vista-privada').classList.remove('oculto');
            document.getElementById('txt-bienvenida-cliente').innerText = `Hola, ${c.Nombre_Completo}`;
            renderizarEspacioPrivadoCliente();
            mostrarToast("Sesión iniciada correctamente", "success");
        } else {
            mostrarToast("Contraseña incorrecta", "error");
        }
    };
}

// ==========================================
// RENDERS DE LA VISTA PÚBLICA / CLIENTE
// ==========================================
function renderizarOfertasPublicas() {
    const cont = document.getElementById('contenedor-ofertas-publicas');
    if (!cont || !DB.sanes) return;
    
    cont.innerHTML = DB.sanes.map(san => {
        const ocupados = (DB.registrosTurnos || []).filter(r => r.San_ID == san.San_ID).length;
        const lleno = ocupados >= parseInt(san.Total_Turnos || 3);
        return `
            <div class="glass-card">
                <h4 style="color:var(--morado-brillante); font-size:1.1rem;">${san.Nombre_San}</h4>
                <p style="font-size:0.85rem; color:var(--texto-secundario);">Cuota: <b>$${san.Monto_Cuota}</b></p>
                <p style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom:12px;">Puestos: ${ocupados} / ${san.Total_Turnos || 3}</p>
                <button class="btn-primary btn-ins" data-id="${san.San_ID}" data-nom="${san.Nombre_San}" style="width:100%; justify-content:center;" ${lleno ? 'disabled':''}>
                    ${lleno ? 'GRUPO LLENO' : 'Solicitar Cupo'}
                </button>
            </div>
        `;
    }).join('');

    cont.querySelectorAll('.btn-ins').forEach(b => {
        b.onclick = () => abrirModalInscripcionPublico(b.getAttribute('data-id'), b.getAttribute('data-nom'));
    });
}

function renderizarVitrinaProductosPublica() {
    const cont = document.getElementById('contenedor-productos-cliente');
    if (!cont || !DB.productos) return;
    cont.innerHTML = DB.productos.map(p => `
        <div class="glass-card text-center">
            <img src="${p.Imagen_URL}" style="width:100%; max-height:140px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
            <h4 style="color:#fff; margin-bottom:4px;">${p.Nombre_Producto}</h4>
            <span style="color:var(--oro-brillante); font-weight:700;">$${p.Precio_Venta}</span>
        </div>
    `).join('');
}

function abrirModalInscripcionPublico(sanId, nombreSan) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = `Unirse a ${nombreSan}`;
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-solicitar-nuevo" class="premium-form">
            <div class="form-group"><label>Nombre Completo</label><input type="text" id="sol-nombre" required></div>
            <div class="form-group"><label>WhatsApp / Teléfono</label><input type="text" id="sol-telef" required></div>
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
        }, mostrarCarga, () => {
            ocultarCarga();
            mostrarToast("Solicitud enviada a revisión", "success");
            window.recargarManejador();
        });
    };
}

function renderizarEspacioPrivadoCliente() {
    const misPuestos = (DB.registrosTurnos || []).filter(r => r.Cliente_ID == clienteLogueado.Cliente_ID);
    const tabla = document.getElementById('tabla-puestos-inscritos');
    
    if (misPuestos.length === 0) {
        tabla.innerHTML = `<p style="color:var(--texto-secundario);">No tienes puestos confirmados en este ciclo.</p>`;
    } else {
        let filas = misPuestos.map(p => {
            const s = DB.sanes.find(x => x.San_ID == p.San_ID) || { Nombre_San: '-' };
            return `<tr><td><b>${s.Nombre_San}</b></td><td>Turno ${p.Numero_Turno}</td><td><span class="badge-estado ${p.Estado_Pago}">${p.Estado_Pago}</span></td></tr>`;
        }).join('');
        tabla.innerHTML = `<table class="premium-table"><thead><tr><th>San</th><th>Turno</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table>`;
    }

    const listaPagar = document.getElementById('lista-cuotas-pagar');
    listaPagar.innerHTML = '';
    misPuestos.filter(p => p.Estado_Pago !== 'pagado').forEach(cuota => {
        const s = DB.sanes.find(x => x.San_ID == cuota.San_ID) || { Nombre_San: '-', Monto_Cuota: 0 };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${s.Nombre_San}</b></td>
            <td style="color:var(--oro-brillante); font-weight:bold;">$${s.Monto_Cuota}</td>
            <td><span style="color:#ef4444;">Fijada</span></td>
            <td><button class="btn-primary btn-subir" style="padding:4px 8px; font-size:0.8rem;">Subir Recibo</button></td>
        `;
        tr.querySelector('.btn-subir').onclick = () => {
            const ref = prompt("Ingresa el número de referencia del pago:");
            if (ref) {
                ejecutarPostSheets('registrarPago', { registroId: cuota.Registro_ID, nuevoEstado: 'pendiente', comprobante: ref }, mostrarCarga, () => {
                    mostrarToast("Comprobante enviado a Edimar", "success");
                    window.recargarManejador();
                });
            }
        };
        listaPagar.appendChild(tr);
    });
}

// ==========================================
// RENDERS GENERALES DEL PANEL DE ADMIN
// ==========================================
function renderizarAdminTodo() {
    // 1. Matriz General de Control de Pagos y Estados
    const tbodyPagos = document.getElementById('tbody-matriz-pagos');
    tbodyPagos.innerHTML = (DB.registrosTurnos || []).map(reg => {
        const san = DB.sanes.find(s => s.San_ID == reg.San_ID) || { Nombre_San: 'Desconocido' };
        const cli = DB.clientes.find(c => c.Cliente_ID == reg.Cliente_ID) || { Nombre_Completo: 'Desconocido' };
        return `
            <tr>
                <td><b>${san.Nombre_San}</b></td>
                <td>${cli.Nombre_Completo}</td>
                <td>Turno ${reg.Numero_Turno}</td>
                <td><span class="badge-estado ${reg.Estado_Pago}">${reg.Estado_Pago}</span></td>
                <td><span style="font-size:0.85rem;">${reg.Comprobante_Pago || 'Ninguno'}</span></td>
                <td>
                    <select class="sel-est-adm" data-id="${reg.Registro_ID}" title="Cambiar Estado">
                        <option value="pendiente" ${reg.Estado_Pago==='pendiente'?'selected':''}>Pendiente</option>
                        <option value="pagado" ${reg.Estado_Pago==='pagado'?'selected':''}>Pagado</option>
                        <option value="atrasado" ${reg.Estado_Pago==='atrasado'?'selected':''}>Atrasado</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');

    tbodyPagos.querySelectorAll('.sel-est-adm').forEach(s => {
        s.onchange = (e) => {
            ejecutarPostSheets('actualizarEstadoPago', { registroId: s.getAttribute('data-id'), estado: e.target.value }, mostrarCarga, () => {
                mostrarToast("Estado de pago modificado", "success");
                window.recargarManejador();
            });
        };
    });

    // 2. Tabla para Eliminar Sanes
    document.getElementById('tbody-lista-sanes-eliminar').innerHTML = (DB.sanes || []).map(s => `
        <tr>
            <td>${s.San_ID}</td>
            <td><b>${s.Nombre_San}</b></td>
            <td>$${s.Monto_Cuota}</td>
            <td>${s.Fecha_Inicio || 'N/A'}</td>
            <td><button class="btn-secondary btn-del-san" data-id="${s.San_ID}" style="color:#ef4444;"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');
    document.querySelectorAll('.btn-del-san').forEach(b => {
        b.onclick = () => {
            if (confirm("¿Estás seguro de que deseas eliminar este San por completo?")) {
                ejecutarPostSheets('eliminarSan', { sanId: b.getAttribute('data-id') }, mostrarCarga, () => {
                    mostrarToast("San eliminado", "info");
                    window.recargarManejador();
                });
            }
        };
    });

    // 3. Directorio de Clientes y Borrado
    document.getElementById('tbody-lista-clientes').innerHTML = (DB.clientes || []).map(c => `
        <tr>
            <td>${c.Cliente_ID}</td>
            <td><b>${c.Nombre_Completo}</b></td>
            <td>${c.Telefono}</td>
            <td><button class="btn-secondary btn-del-cli" data-id="${c.Cliente_ID}" style="color:#ef4444;"><i class="fa-solid fa-user-minus"></i></button></td>
        </tr>
    `).join('');
    document.querySelectorAll('.btn-del-cli').forEach(b => {
        b.onclick = () => {
            if (confirm("¿Eliminar este cliente de la base de datos de EDISAN?")) {
                ejecutarPostSheets('eliminarCliente', { clienteId: b.getAttribute('data-id') }, mostrarCarga, () => {
                    mostrarToast("Cliente dado de baja", "info");
                    window.recargarManejador();
                });
            }
        };
    });

    // 4. Inventario de Productos Comerciales y Borrado
    document.getElementById('tbody-lista-productos').innerHTML = (DB.productos || []).map(p => `
        <tr>
            <td>${p.Producto_ID}</td>
            <td><b>${p.Nombre_Producto}</b></td>
            <td>$${p.Precio_Venta}</td>
            <td><button class="btn-secondary btn-del-prod" data-id="${p.Producto_ID}" style="color:#ef4444;"><i class="fa-solid fa-eraser"></i></button></td>
        </tr>
    `).join('');
    document.querySelectorAll('.btn-del-prod').forEach(b => {
        b.onclick = () => {
            if (confirm("¿Retirar este producto de la vitrina?")) {
                ejecutarPostSheets('eliminarProducto', { productoId: b.getAttribute('data-id') }, mostrarCarga, () => {
                    mostrarToast("Producto eliminado del stock", "info");
                    window.recargarManejador();
                });
            }
        };
    });

    // Actualizar Selectores del Asignador Manual de Turnos
    document.getElementById('admin-select-cliente').innerHTML = (DB.clientes || []).map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    document.getElementById('admin-select-san').innerHTML = (DB.sanes || []).map(s => `<option value="${s.San_ID}">${s.Nombre_San}</option>`).join('');

    document.getElementById('btn-admin-asignar-manual').onclick = () => {
        const cId = document.getElementById('admin-select-cliente').value;
        const sId = document.getElementById('admin-select-san').value;
        const tNum = parseInt(document.getElementById('admin-input-turno').value);
        
        ejecutarPostSheets('asignarTurnoManual', { id: "REG" + Date.now().toString().slice(-4), clienteId: cId, sanId: sId, turno: tNum }, mostrarCarga, () => {
            mostrarToast("Turno asignado de forma manual", "success");
            window.recargarManejador();
        });
    };

    renderizarTablasSolicitudes();
}

// ==========================================
// SUB-MÓDULO: CONTROL DE SOLICITUDES DE ACCESO
// ==========================================
function renderizarTablasSolicitudes() {
    
    // 1. Nuevos Clientes (Aprobación crítica corregida con refresco forzado)
    document.getElementById('tbody-solicitudes-nuevos').innerHTML = (DB.solicitudesNuevos || []).map(sol => {
        const san = DB.sanes.find(s => s.San_ID == sol.San_ID) || { Nombre_San: '-' };
        return `
            <tr>
                <td><b>${sol.Nombre_Completo}</b></td>
                <td>${sol.Telefono}</td>
                <td>${san.Nombre_San}</td>
                <td><button class="btn-primary btn-ap-n" data-id="${sol.Solicitud_ID}" data-nom="${sol.Nombre_Completo}" data-tel="${sol.Telefono}" data-san="${sol.San_ID}" style="padding:4px 8px; font-size:0.8rem;">Aprobar</button></td>
            </tr>
        `;
    }).join('');

    document.getElementById('tbody-solicitudes-nuevos').querySelectorAll('.btn-ap-n').forEach(b => {
        b.onclick = () => {
            const pass = prompt(`Crea una contraseña de acceso para ${b.getAttribute('data-nom')}:`, "EDISAN" + Math.floor(1000 + Math.random() * 9000));
            if (pass) {
                const payload = {
                    solicitudId: b.getAttribute('data-id'),
                    nombre: b.getAttribute('data-nom'),
                    telefono: b.getAttribute('data-tel'),
                    sanId: b.getAttribute('data-san'),
                    contrasena: pass
                };

                // Pasamos 'mostrarCarga' correctamente como segundo parámetro
                ejecutarPostSheets('procesarAprobacionNuevo', payload, mostrarCarga, () => {
                    ocultarCarga();
                    mostrarToast(`Cliente ${payload.nombre} aprobado y guardado`, "success");
                    setTimeout(() => { window.recargarManejador(); }, 800);
                });
            }
        };
    });

    // 2. Solicitudes de Clientes ya Existentes que quieren entrar a un nuevo San
    document.getElementById('tbody-solicitudes-inscritos').innerHTML = (DB.solicitudesInscritos || []).map(sol => {
        const c = DB.clientes.find(x => x.Cliente_ID == sol.Cliente_ID) || { Nombre_Completo: '-' };
        const s = DB.sanes.find(x => x.San_ID == sol.San_ID) || { Nombre_San: '-' };
        return `
            <tr>
                <td><b>${c.Nombre_Completo}</b></td>
                <td>${s.Nombre_San}</td>
                <td><button class="btn-primary btn-ap-i" data-id="${sol.Solicitud_ID}" data-cli="${sol.Cliente_ID}" data-san="${sol.San_ID}" style="padding:4px 8px; font-size:0.8rem;">Conceder Cupo</button></td>
            </tr>
        `;
    }).join('');

    document.getElementById('tbody-solicitudes-inscritos').querySelectorAll('.btn-ap-i').forEach(b => {
        b.onclick = () => {
            ejecutarPostSheets('procesarAprobacionInscrito', { 
                solicitudId: b.getAttribute('data-id'), 
                clienteId: b.getAttribute('data-cli'), 
                sanId: b.getAttribute('data-san') 
            }, mostrarCarga, () => {
                mostrarToast("Cupo asignado en el grupo", "success");
                setTimeout(() => { window.recargarManejador(); }, 800);
            });
        };
    });
}

function mostrarToast(mensaje, tipo = "success") {
    const cont = document.getElementById('toast-container');
    if (!cont) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.style.cssText = "background:rgba(15,10,32,0.95); border-left:4px solid " + (tipo === 'success' ? '#22c55e' : '#ef4444') + "; color:#fff; padding:12px 18px; border-radius:8px; font-size:0.85rem; box-shadow:0 8px 24px rgba(0,0,0,0.4); font-weight:500; min-width:220px; text-align:center;";
    toast.innerText = mensaje;
    cont.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
}