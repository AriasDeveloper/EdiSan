// js/app.js
import { ADMIN_CONFIG, FRASES_CARGA } from './config.js';
import { DB, cargarDatosDesdeSheets } from './api.js';
import { renderizarOfertasPublicas, renderizarProductosVitrinas, renderizarEspacioPrivadoCliente, clienteLogueado, fijarClienteLogueado } from './ui-cliente.js';
import { inicializarTabsAdmin, renderizarAdminTodo } from './ui-admin.js';

// 1. INYECTAR ENLACES GLOBALES INMEDIATOS PARA LOS SUBMÓDULOS
window.mostrarCarga = mostrarCarga;
window.ocultarCarga = ocultarCarga;
window.mostrarToast = mostrarToast;
window.recargarManejador = () => cargarDatosDesdeSheets(mostrarCarga, ocultarCarga, refrescarTodaLaUI);

// 2. DISPARAR LA PANTALLA DE CARGA DE INMEDIATO (Blindaje contra carga asíncrona)
mostrarCarga();

// 3. CONFIGURAR EL ARRANQUE SEGURO DEL DOM
document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacionEstructural();
    inicializarTabsAdmin();
    inicializarFormulariosBase();
    
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    if (btnCerrarModal) {
        btnCerrarModal.onclick = () => {
            document.getElementById('modal-premium').classList.remove('modal-active');
        };
    }
    
    // Iniciar la descarga de datos desde Google Sheets
    window.recargarManejador();
});

// 4. FUNCIONES DE LA PANTALLA DE CARGA CON CRISTAL DIFUMINADO
function mostrarCarga() {
    const txtCarga = document.getElementById('texto-carga-divertido');
    const pantallaCarga = document.getElementById('pantalla-carga');
    
    if (FRASES_CARGA && FRASES_CARGA.length > 0 && txtCarga) {
        const frase = FRASES_CARGA[Math.floor(Math.random() * FRASES_CARGA.length)];
        txtCarga.innerText = frase;
    }
    if (pantallaCarga) {
        pantallaCarga.classList.add('modal-active');
    }
}

function ocultarCarga() { 
    const pantallaCarga = document.getElementById('pantalla-carga');
    if (pantallaCarga) {
        pantallaCarga.classList.remove('modal-active'); 
    }
}

// 5. REFRESCO DE VISTAS UNIFICADO (Previene desajustes de datos)
function refrescarTodaLaUI() {
    renderizarOfertasPublicas();
    renderizarProductosVitrinas('contenedor-productos-cliente');
    
    // Si la patrona está viendo el panel de administración, refrescar sus tablas de control
    const seccionAdmin = document.getElementById('seccion-admin');
    if (seccionAdmin && seccionAdmin.classList.contains('view-active')) {
        renderizarAdminTodo();
    }
    
    // Si hay un cliente logueado, mantener al día su zona privada
    if (clienteLogueado) {
        const clienteActualizado = DB.clientes.find(c => c.Cliente_ID === clienteLogueado.Cliente_ID);
        if (clienteActualizado) fijarClienteLogueado(clienteActualizado);
        renderizarEspacioPrivadoCliente();
    }
}

// 6. NAVEGACIÓN Y AUTENTICACIÓN (LOGIN) CON ACCESIBILIDAD CORREGIDA
function inicializarNavegacionEstructural() {
    const btnLlaveAdmin = document.getElementById('btn-llave-admin');
    const seccionAdmin = document.getElementById('seccion-admin');
    const seccionCliente = document.getElementById('seccion-cliente');

    if (btnLlaveAdmin && seccionAdmin && seccionCliente) {
        btnLlaveAdmin.onclick = () => {
            const pass = prompt("Introduce la clave de acceso del Administrador:");
            if (pass === ADMIN_CONFIG.CLAVE_ACCESO) {
                seccionCliente.classList.remove('view-active');
                seccionAdmin.classList.add('view-active');
                
                // Forzar renderizado y activar visualmente la primera pestaña (Sanes)
                renderizarAdminTodo();
                const tabSanes = document.querySelector('.tab-trigger[data-tab="sanes"]');
                if (tabSanes) tabSanes.click();
                
                mostrarToast("¡Bienvenida, Patrona Edimar!", "success");
            } else if (pass !== null) {
                mostrarToast("Clave administrativa incorrecta", "error");
            }
        };
    }

    const btnCerrarAdmin = document.getElementById('btn-cerrar-admin');
    if (btnCerrarAdmin) {
        btnCerrarAdmin.onclick = () => {
            seccionAdmin.classList.remove('view-active');
            seccionCliente.classList.add('view-active');
        };
    }

    const btnIrALogin = document.getElementById('btn-ir-a-login');
    if (btnIrALogin) btnIrALogin.onclick = () => abrirModalLogin();
    
    const btnLogoutCliente = document.getElementById('btn-logout-cliente');
    if (btnLogoutCliente) {
        btnLogoutCliente.onclick = () => {
            fijarClienteLogueado(null);
            document.getElementById('cliente-vista-privada').classList.add('oculto');
            document.getElementById('cliente-vista-publica').classList.remove('oculto');
            mostrarToast("Sesión cerrada", "info");
        };
    }
}

// FORMULARIO DE LOGUEO DE CLIENTES TOTALMENTE ACCESIBLE
function abrirModalLogin() {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Área Privada de Clientes";
    
    if (!DB.clientes || DB.clientes.length === 0) {
        document.getElementById('modal-cuerpo').innerHTML = `<p style="color:var(--texto-secundario); text-align:center; padding:10px;">No hay clientes registrados en el sistema para iniciar sesión.</p>`;
        modal.classList.add('modal-active');
        return;
    }

    let opcionesClientes = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-autenticar" class="premium-form" title="Formulario de inicio de sesión de usuario">
            <div class="form-group">
                <label for="login-id">Selecciona tu Usuario</label>
                <select id="login-id" name="login-id" title="Selecciona tu nombre registrado de la lista">${opcionesClientes}</select>
            </div>
            <div class="form-group">
                <label for="login-pass">Contraseña de Acceso</label>
                <input type="password" id="login-pass" name="login-pass" placeholder="••••••••" title="Escribe tu contraseña de cuatro números" required>
            </div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:15px;">Ingresar a mi Cuenta</button>
        </form>
    `;
    modal.classList.add('modal-active');

    document.getElementById('form-autenticar').onsubmit = (e) => {
        e.preventDefault();
        const idSeleccionado = document.getElementById('login-id').value;
        const passIntroducida = document.getElementById('login-pass').value;
        
        const clienteEncontrado = DB.clientes.find(c => c.Cliente_ID == idSeleccionado && String(c.Contrasena) === String(passIntroducida));

        if (clienteEncontrado) {
            fijarClienteLogueado(clienteEncontrado);
            modal.classList.remove('modal-active');
            document.getElementById('cliente-vista-publica').classList.add('oculto');
            document.getElementById('cliente-vista-privada').classList.remove('oculto');
            
            const txtBienvenida = document.getElementById('txt-bienvenida-cliente');
            if (txtBienvenida) txtBienvenida.innerText = `Hola, ${clienteEncontrado.Nombre_Completo}`;
            
            renderizarEspacioPrivadoCliente();
            mostrarToast("Sesión iniciada con éxito", "success");
        } else {
            mostrarToast("Contraseña incorrecta. Verifica e intenta de nuevo.", "error");
        }
    };
}

function inicializarFormulariosBase() {
    // Aquí puedes enlazar listeners estáticos de formularios del index.html si los requieres
}

// 7. COMPONENTE FLOTANTE DE NOTIFICACIONES (TOASTS SYSTEM)
function mostrarToast(mensaje, tipo = "success") {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;
    
    const toast = document.createElement('div');
    const colorBorde = tipo === 'success' ? '#22c55e' : (tipo === 'error' ? '#ef4444' : '#3b82f6');
    
    toast.style.cssText = `
        background: rgba(15, 10, 36, 0.95); 
        border-left: 4px solid ${colorBorde}; 
        color: #fff; 
        padding: 12px 20px; 
        border-radius: 10px; 
        font-size: 0.88rem; 
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border-top: 1px solid rgba(255,255,255,0.05);
    `;
    toast.innerText = mensaje; 
    contenedor.appendChild(toast);
    
    // Auto-destrucción a los 4 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}