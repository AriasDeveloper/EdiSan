// Añadir al inicio de js/app.js:
import { API_CONFIG, SAN_ESTADOS, CUOTA_ESTADOS } from './config.js';
// js/app.js

// ==========================================================================
// 1. CONFIGURACIÓN Y ESTADO GLOBAL TEMPORAL (MOCK DATA)
// ==========================================================================
// Nota: Una vez conectado Apps Script, estas variables se llenarán con los datos reales de tu Sheets.
let CONFIG = {
    URL_APPS_SCRIPT: "AQUÍ_IRÁ_TU_URL_DE_EMISIÓN_DE_APPS_SCRIPT",
};

let estadoApp = {
    rolActual: 'cliente', // 'cliente' o 'admin'
    sanes: [
        { id: "S001", nombre: "San Oro Julio", montoCuota: 50, totalTurnos: 12, fechaInicio: "2026-07-01", estado: "Reclutando" },
        { id: "S002", nombre: "San Premium Express", montoCuota: 100, totalTurnos: 10, fechaInicio: "2026-06-15", estado: "Activo" }
    ],
    misCuotas: [
        { turno: "Turno 1", monto: 50, fecha: "2026-07-01", estado: "pagado" },
        { turno: "Turno 2", monto: 50, fecha: "2026-08-01", estado: "pendiente" },
        { turno: "Turno 3", monto: 50, fecha: "2026-09-01", estado: "pendiente" }
    ]
};

// ==========================================================================
// 2. INICIALIZADOR DE LA APP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    configurarNavegacion();
    configurarFormularios();
    configurarModal();
    
    // Renderizado inicial (Vista cliente por defecto)
    renderizarVistaCliente();
    renderizarVistaAdmin();
    
    mostrarToast("¡Bienvenido a EDISAN Premium!", "info");
});

// ==========================================================================
// 3. CONTROL DE INTERFAZ Y ANIMACIONES (Transiciones de Roles)
// ==========================================================================
function configurarNavegacion() {
    const btnCliente = document.getElementById('btn-vista-cliente');
    const btnAdmin = document.getElementById('btn-vista-admin');
    const seccionCliente = document.getElementById('seccion-cliente');
    const seccionAdmin = document.getElementById('seccion-admin');

    btnCliente.addEventListener('click', () => {
        if(estadoApp.rolActual === 'cliente') return;
        estadoApp.rolActual = 'cliente';
        
        cambiarPestanaAnimada(btnCliente, btnAdmin, seccionCliente, seccionAdmin);
    });

    btnAdmin.addEventListener('click', () => {
        if(estadoApp.rolActual === 'admin') return;
        estadoApp.rolActual = 'admin';
        
        cambiarPestanaAnimada(btnAdmin, btnCliente, seccionAdmin, seccionCliente);
    });
}

function cambiarPestanaAnimada(btnActivar, btnDesactivar, seccionActivar, seccionDesactivar) {
    // Intercambio de clases activas en botones
    btnDesactivar.classList.remove('active');
    btnActivar.classList.add('active');

    // Desvanecimiento de salida fluido
    seccionDesactivar.style.opacity = '0';
    seccionDesactivar.style.transform = 'translateY(15px)';
    
    setTimeout(() => {
        seccionDesactivar.classList.remove('view-active');
        
        // Entrada fluida de la nueva sección
        seccionActivar.classList.add('view-active');
        // Pequeño timeout para que el navegador registre el despliegue antes de animar la opacidad
        setTimeout(() => {
            seccionActivar.style.opacity = '1';
            seccionActivar.style.transform = 'translateY(0)';
        }, 50);
    }, 400); // Sincronizado con el tiempo del CSS
}

// ==========================================================================
// 4. RENDERIZADO DINÁMICO DE DATOS (Estilo Premium)
// ==========================================================================
function renderizarVistaCliente() {
    // 1. Línea de tiempo de progreso del San del cliente
    const contenedorProgreso = document.getElementById('cliente-san-progreso');
    contenedorProgreso.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <p style="color: var(--texto-secundario); font-size: 0.9rem;">Progreso de Fondos del Grupo:</p>
            <div style="background: rgba(0,0,0,0.3); height: 10px; border-radius: 5px; overflow: hidden; border: 1px solid var(--borde-cristal);">
                <div style="background: linear-gradient(90deg, var(--morado-premium), var(--morado-brillante)); width: 65%; height: 100%; box-shadow: 0 0 10px var(--morado-brillante);"></div>
            </div>
            <span style="font-size: 0.85rem; color: var(--morado-brillante); text-align: right;">65% Completado</span>
        </div>
    `;

    // 2. Tabla de Cuotas del Cliente
    const tablaCuotas = document.getElementById('tabla-cuotas-cliente');
    tablaCuotas.innerHTML = '';
    
    estadoApp.misCuotas.forEach(cuota => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td style="font-weight: 600;">${cuota.turno}</td>
            <td style="color: var(--morado-brillante); font-weight: bold;">$${cuota.monto}</td>
            <td>${cuota.fecha}</td>
            <td><span class="badge-estado ${cuota.estado}">${cuota.estado.toUpperCase()}</span></td>
        `;
        tablaCuotas.appendChild(fila);
    });

    // 3. Catálogo de Ofertas Disponibles
    const contenedorOfertas = document.getElementById('contenedor-ofertas');
    contenedorOfertas.innerHTML = '';
    
    const sanesDisponibles = estadoApp.sanes.filter(s => s.estado === 'Reclutando');
    sanesDisponibles.forEach(san => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'glass-card animate-fade-in';
        tarjeta.style.borderLeft = '4px solid var(--morado-premium)';
        tarjeta.innerHTML = `
            <h4 style="margin-bottom: 8px; font-size: 1.1rem;">${san.nombre}</h4>
            <p style="font-size: 0.85rem; color: var(--texto-secundario); margin-bottom: 12px;">Cuota fija accesible para asegurar tu base de ahorro.</p>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 15px;">
                <span>Cuota: <strong style="color: var(--oro-brillante);">$${san.montoCuota}</strong></span>
                <span>Turnos: <strong>${san.totalTurnos}</strong></span>
            </div>
            <button class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem; width: 100%; justify-content: center;">Inscribirme Ahora</button>
        `;
        contenedorOfertas.appendChild(tarjeta);
    });
}

function renderizarVistaAdmin() {
    // Tabla de Control Global de Administración
    const tablaGlobal = document.getElementById('tabla-control-global');
    tablaGlobal.innerHTML = '';

    estadoApp.sanes.forEach(san => {
        const fila = document.createElement('tr');
        const badgeColor = san.estado === 'Activo' ? 'pagado' : 'pendiente';
        fila.innerHTML = `
            <td style="font-weight: 600; color: white;">${san.nombre}</td>
            <td>
                <div style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom:4px;">Recaudado 8/12</div>
                <div style="background: rgba(0,0,0,0.4); height: 6px; border-radius:3px;">
                    <div style="background: var(--oro-premium); width: 66%; height:100%;"></div>
                </div>
            </td>
            <td style="color: var(--color-atrasado); font-weight: bold;">2 retrasos</td>
            <td>${san.fechaInicio}</td>
            <td>
                <span class="badge-estado ${badgeColor}" style="cursor: pointer; margin-right: 8px;">${san.estado}</span>
                <button class="btn-secondary" style="padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white; cursor: pointer;">Gestionar</button>
            </td>
        `;
        tablaGlobal.appendChild(fila);
    });
}

// ==========================================================================
// 5. CAPTURA DE FORMULARIOS Y LOGICA DE NEGOCIO
// ==========================================================================
function configurarFormularios() {
    const formCrearSan = document.getElementById('form-crear-san');
    
    formCrearSan.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nuevoSan = {
            id: "S" + Date.now().toString().slice(-3),
            nombre: document.getElementById('san-nombre').value,
            montoCuota: parseFloat(document.getElementById('san-monto').value),
            totalTurnos: parseInt(document.getElementById('san-turnos').value),
            fechaInicio: document.getElementById('san-fecha').value,
            estado: "Reclutando"
        };

        // Simulación de acción (Frontend inmediato)
        estadoApp.sanes.push(nuevoSan);
        renderizarVistaAdmin();
        renderizarVistaCliente();
        formCrearSan.reset();
        mostrarToast(`¡${nuevoSan.nombre} creado con éxito!`, "success");

        // ENLACE FUTURO CON GOOGLE SHEETS:
        // await enviarDatosAGoogleSheets('crearSan', nuevoSan);
    });

    document.getElementById('btn-forzar-sync').addEventListener('click', () => {
        mostrarToast("Sincronizando con Google Sheets...", "info");
        // Aquí llamarás a la carga completa desde Sheets
    });
}

// ==========================================================================
// 6. CONTROL DEL MODAL PREMIUM Y NOTIFICACIONES TOAST
// ==========================================================================
function configurarModal() {
    const modal = document.getElementById('modal-premium');
    const btnReportar = document.getElementById('btn-reportar-pago');
    const btnCerrar = document.getElementById('btn-cerrar-modal');

    btnReportar.addEventListener('click', () => {
        document.getElementById('modal-titulo').innerText = "Reportar Comprobante de Pago";
        document.getElementById('modal-cuerpo').innerHTML = `
            <form class="premium-form" style="margin-top: 15px;">
                <div class="form-group">
                    <label>Selecciona el turno correspondiente</label>
                    <select style="width:100%; background:rgba(0,0,0,0.4); border:1px solid var(--borde-cristal); padding:12px; border-radius:8px; color:white;">
                        <option>Turno 2 - Fecha Límite: 2026-08-01</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Referencia de Pago / Captura</label>
                    <input type="text" placeholder="Ej. Ref: #8923472" required>
                </div>
                <button type="button" id="btn-enviar-comprobante" class="btn-primary" style="width:100%; justify-content:center; margin-top:10px;">Enviar a Revisión de Admin</button>
            </form>
        `;
        
        modal.classList.add('modal-active');
        
        document.getElementById('btn-enviar-comprobante').addEventListener('click', () => {
            modal.classList.remove('modal-active');
            mostrarToast("Comprobante enviado. El administrador lo verificará.", "success");
        });
    });

    btnCerrar.addEventListener('click', () => modal.classList.remove('modal-active'));
    modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('modal-active'); });
}

// Lanzador de Notificaciones Elegantes flotantes
function mostrarToast(mensaje, tipo = "success") {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let colorBorde = tipo === 'success' ? varObtener('--color-pagado') : tipo === 'error' ? varObtener('--color-atrasado') : varObtener('--morado-premium');
    
    toast.style.cssText = `
        background: rgba(15, 10, 35, 0.9);
        backdrop-filter: blur(8px);
        border-left: 4px solid ${colorBorde};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        font-size: 0.9rem;
        font-weight: 500;
        animation: fadeIn 0.3s ease forwards;
    `;
    
    toast.innerText = mensaje;
    contenedor.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function varObtener(nombreVar) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombreVar).trim();
}

// ==========================================================================
// 7. PUENTE DE CONEXIÓN FETCH (GOOGLE APPS SCRIPT)
// ==========================================================================
async function enviarDatosAGoogleSheets(accion, datos) {
    const indicador = document.getElementById('sheets-sync-indicator');
    indicador.style.color = varObtener('--color-pendiente');
    indicador.querySelector('.sync-text').innerText = "Sincronizando...";

    try {
        const respuesta = await fetch(CONFIG.URL_APPS_SCRIPT, {
            method: 'POST',
            mode: 'no-cors', // Dependiendo de la estructura de tu WebApp
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: accion, payload: datos })
        });
        
        indicador.style.color = varObtener('--color-pagado');
        indicador.querySelector('.sync-text').innerText = "Conectado a Sheets";
        return respuesta;
    } catch (error) {
        console.error("Error en sincronización:", error);
        indicador.style.color = varObtener('--color-atrasado');
        indicador.querySelector('.sync-text').innerText = "Error de Red";
        mostrarToast("No se pudo guardar en la nube.", "error");
    }
}