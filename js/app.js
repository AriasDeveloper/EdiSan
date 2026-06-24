// js/app.js
import { ADMIN_CONFIG, FRASES_CARGA } from './config.js';
import { DB, cargarDatosDesdeSheets, ejecutarPostSheets } from './api.js';
import { renderSidebar = () => {}, renderizarOfertasPublicas, renderizarProductosVitrinas, renderizarEspacioPrivadoCliente, clienteLogueado, fijarClienteLogueado } from './ui-cliente.js';
import { inicializarTabsAdmin, renderizarAdminTodo } from './ui-admin.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inyectar funciones globales para que las promesas de los sub-módulos puedan llamarlas
    window.mostrarCarga = mostrarCarga;
    window.ocultarCarga = ocultarCarga;
    window.mostrarToast = mostrarToast;
    window.recargarManejador = () => cargarDatosDesdeSheets(mostrarCarga, ocultarCarga, refrescarTodaLaUI);

    inicializarNavegacionEstructural();
    inicializarTabsAdmin();
    inicializarFormularios();
    
    document.getElementById('btn-cerrar-modal').onclick = () => {
        document.getElementById('modal-premium').classList.remove('modal-active');
    };
    
    window.recargarManejador();
});

function mostrarCarga() {
    const frase = FRASES_CARGA[Math.floor(Math.random() * FRASES_CARGA.length)];
    document.getElementById('texto-carga-divertido').innerText = frase;
    document.getElementById('pantalla-carga').classList.add('modal-active');
}

function ocultarCarga() { 
    document.getElementById('pantalla-carga').classList.remove('modal-active'); 
}

function refrescarTodaLaUI() {
    renderizarOfertasPublicas();
    renderizarProductosVitrinas('contenedor-productos-cliente');
    
    if (document.getElementById('seccion-admin').classList.contains('view-active')) {
        renderizarAdminTodo();
    }
    if (clienteLogueado) {
        const actualizado = DB.clientes.find(c => c.Cliente_ID === clienteLogueado.Cliente_ID);
        if (actualizado) fijarClienteLogueado(actualizado);
        renderizarEspacioPrivadoCliente();
    }
}

function inicializarNavegacionEstructural() {
    const btnLlaveAdmin = document.getElementById('btn-llave-admin');
    const seccionAdmin = document.getElementById('seccion-admin');
    const seccionCliente = document.getElementById('seccion-cliente');

    btnLlaveAdmin.onclick = () => {
        const pass = prompt("Introduce la clave de acceso del Administrador:");
        if (pass === ADMIN_CONFIG.CLAVE_ACCESO) {
            seccionCliente.classList.remove('view-active');
            seccionAdmin.classList.add('view-active');
            
            // Renderiza y fuerza la activación visual de la pestaña de Sanes
            renderizarAdminTodo(); 
            const tabSanes = document.getElementById('tab-admin-sanes');
            if (tabSanes) tabSanes.click();
            
            mostrarToast("¡Hola Patrona Edimar!", "success");
        } else if (pass !== null) {
            mostrarToast("Clave incorrecta", "error");
        }
    };

    document.getElementById('btn-cerrar-admin').onclick = () => {
        seccionAdmin.classList.remove('view-active');
        seccionCliente.classList.add('view-active');
    };

    document.getElementById('btn-ir-a-login').onclick = () => abrirModalLogin();
    
    document.getElementById('btn-logout-cliente').onclick = () => {
        fijarClienteLogueado(null);
        document.getElementById('cliente-vista-privada').classList.add('oculto');
        document.getElementById('cliente-vista-publica').classList.remove('oculto');
        mostrarToast("Sesión cerrada", "info");
    };
}

function abrirModalLogin() {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Área de Clientes Premium";
    let opciones = DB.clientes.map(c => `<option value="${c.Cliente_ID}">${c.Nombre_Completo}</option>`).join('');
    
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-autenticar" class="premium-form" title="Inicio de sesión de usuarios">
            <div class="form-group">
                <label for="login-id">Usuario registrado</label>
                <select id="login-id" name="login-id" title="Selecciona tu nombre de usuario de la lista">${opciones}</select>
            </div>
            <div class="form-group">
                <label for="login-pass">Contraseña privada</label>
                <input type="password" id="login-pass" name="login-pass" placeholder="••••••••" title="Introduce tu contraseña de acceso" required>
            </div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:10px;">Entrar</button>
        </form>
    `;
    modal.classList.add('modal-active');

    document.getElementById('form-autenticar').onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;
        const cliente = DB.clientes.find(c => c.Cliente_ID == id && String(c.Contrasena) === String(pass));

        if (cliente) {
            fijarClienteLogueado(cliente);
            modal.classList.remove('modal-active');
            document.getElementById('cliente-vista-publica').classList.add('oculto');
            document.getElementById('cliente-vista-privada').classList.remove('oculto');
            document.getElementById('txt-bienvenida-cliente').innerText = `Hola, ${cliente.Nombre_Completo}`;
            renderizarEspacioPrivadoCliente();
            mostrarToast("Sesión iniciada con éxito", "success");
        } else {
            mostrarToast("Contraseña incorrecta", "error");
        }
    };
}

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
        }, mostrarCarga, ocultarCarga, window.recargarManejador);
        e.target.reset();
    };

    // Botón de asignación manual de puestos
    document.getElementById('btn-guardar-puesto').onclick = () => {
        const sanId = document.getElementById('sel-puesto-san').value;
        const turno = document.getElementById('num-puesto-turno').value;
        if(!turno) return mostrarToast("No hay turnos libres", "error");

        const sanSeleccionado = DB.sanes.find(s => s.San_ID == sanId);
        ejecutarPostSheets('assignarPuesto', {
            id: "R" + Date.now().toString().slice(-4),
            sanId: sanId,
            clienteId: document.getElementById('sel-puesto-cliente').value,
            turno: parseInt(turno),
            fechaLimite: sanSeleccionado.Fecha_Inicio ? sanSeleccionado.Fecha_Inicio.split('T')[0] : "2026-01-01", 
            estado: "pendiente"
        }, mostrarCarga, ocultarCarga, window.recargarManejador);
    };
}

function mostrarToast(mensaje, tipo = "success") {
    const contenedor = document.getElementById('toast-container');
    if(!contenedor) return;
    const toast = document.createElement('div');
    toast.style.cssText = `background: rgba(11, 7, 28, 0.96); border-left: 4px solid ${tipo === 'success' ? '#10b981' : '#ef4444'}; color: #fff; padding: 14px 22px; border-radius: 10px; font-size: 0.9rem; margin-bottom: 8px;`;
    toast.innerText = mensaje; 
    contenedor.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}