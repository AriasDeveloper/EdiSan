// ==========================================================================
// ⚙️ CONFIGURACIÓN GENERAL DEL FRONTEND
// ==========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec"; // Pega aquí la URL que te dio Google Apps Script al implementar

// Frases premium y jocosas de "La Patrona Edimar" para las pantallas de carga
const FRASES_PATRONA = [
    "Consultando los libros contables de La Patrona...",
    "Verificando cuentas... ¡Que a Edimar no se le escapa ni un centavo!",
    "Sincronizando saldo... La Patrona está revisando tu estado de cuenta.",
    "Cargando... Un momento, Edimar está firmando las autorizaciones.",
    "Validando datos en la bóveda de EDISAN... Bajo estricta supervisión real.",
    "Procesando flujo de caja... Todo fríamente calculado por La Patrona."
];

let globalSanes = [];
let clienteAutenticado = null;
let fraseInterval = null;

// Ejecutar al cargar la página por completo
document.addEventListener("DOMContentLoaded", () => {
    inicializarGlows();
    cargarVitrinaPublica();
});

// ==========================================================================
// 👑 LOGICA DEL PANEL DE CARGA (Loader Premium Fullscreen)
// ==========================================================================
function mostrarCarga() {
    const screen = document.getElementById("loading-screen");
    const textNode = document.getElementById("loading-phrase");
    
    // Poner una frase aleatoria inicial
    textNode.innerText = FRASES_PATRONA[Math.floor(Math.random() * FRASES_PATRONA.length)];
    screen.classList.remove("hidden");

    // Rotar frases elegantemente cada 2.5 segundos mientras carga
    fraseInterval = setInterval(() => {
        textNode.style.opacity = 0;
        setTimeout(() => {
            textNode.innerText = FRASES_PATRONA[Math.floor(Math.random() * FRASES_PATRONA.length)];
            textNode.style.opacity = 1;
        }, 300);
    }, 2500);
}

function ocultarCarga() {
    const screen = document.getElementById("loading-screen");
    clearInterval(fraseInterval);
    screen.classList.add("hidden");
}

// Alternar pestañas del menú superior de forma fluida
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    // Encontrar el botón correspondiente para marcarlo activo
    const btnActive = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (btnActive) btnActive.classList.add('active');
}

// Sutil efecto de movimiento extra interactivo en los halos de luz difusos
function inicializarGlows() {
    document.addEventListener("mousemove", (e) => {
        const sphere = document.querySelector(".glow-3");
        if(sphere) {
            const x = (e.clientX - window.innerWidth / 2) * 0.05;
            const y = (e.clientY - window.innerHeight / 2) * 0.05;
            sphere.style.transform = `translate(${x}px, ${y}px)`;
        }
    });
}

// ==========================================================================
// 📊 RENDERIZADO DINÁMICO DESDE BACKEND (Sanes y Productos)
// ==========================================================================
async function cargarVitrinaPublica() {
    mostrarCarga();
    try {
        const res = await fetch(`${WEB_APP_URL}?action=getSanesYProductos`);
        const data = await res.json();
        
        globalSanes = data.sanes;
        renderizarSanes(data.sanes);
        renderizarProductos(data.productos);
    } catch (err) {
        console.error("Error al sincronizar vitrina:", err);
    } finally {
        ocultarCarga();
    }
}

function renderizarSanes(sanes) {
    const container = document.getElementById("sanes-container");
    container.innerHTML = "";

    sanes.forEach(san => {
        const esLleno = san.estado === "Lleno";
        const badgeClass = esLleno ? "badge-lleno" : "badge-activo";
        const badgeText = esLleno ? "Lleno" : "Disponibles";
        
        const card = document.createElement("div");
        card.className = "premium-card";
        card.innerHTML = `
            <div class="card-img-wrapper">
                ${san.imagen ? `<img src="${san.imagen}" alt="${san.nombre}">` : `<i class="ph ph-hand-coins"></i>`}
                <span class="card-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="card-body">
                <h3>${san.nombre}</h3>
                <div class="card-info-row">
                    <span class="text-muted">Cuota:</span>
                    <strong style="color: var(--purple-glow); font-size: 1.2rem;">$${san.cuota}</strong>
                </div>
                <div class="card-info-row">
                    <span class="text-muted">Ciclo de Cobro:</span>
                    <span>${san.ciclo}</span>
                </div>
                <div class="card-info-row">
                    <span class="text-muted">Capacidad Total:</span>
                    <span>${san.totalTurnos} puestos</span>
                </div>
                <button class="btn-primary" ${esLleno ? 'disabled' : ''} onclick="abrirFlujoInscripcion('${san.id}', ${san.totalTurnos})">
                    ${esLleno ? '<i class="ph ph-lock"></i> Grupo Completo' : '<i class="ph ph-paper-plane-tilt"></i> Solicitar Cupo'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderizarProductos(productos) {
    const container = document.getElementById("productos-container");
    container.innerHTML = "";

    productos.forEach(prod => {
        const card = document.createElement("div");
        card.className = "premium-card";
        card.innerHTML = `
            <div class="card-img-wrapper">
                ${prod.imagen ? `<img src="${prod.imagen}" alt="${prod.nombre}">` : `<i class="ph ph-package"></i>`}
            </div>
            <div class="card-body">
                <h3>${prod.nombre}</h3>
                <p class="text-muted" style="font-size: 0.9rem; min-height: 40px;">${prod.descripcion}</p>
                <div class="card-info-row" style="margin-top: auto;">
                    <span class="text-muted">Precio Contado:</span>
                    <strong style="color: #10b981; font-size: 1.3rem;">$${prod.precio}</strong>
                </div>
                <button class="btn-primary" style="background: linear-gradient(135deg, #25d366, #128c7e);" onclick="comprarPorWhatsApp('${prod.nombre}', ${prod.precio})">
                    <i class="ph-fill ph-whatsapp-logo"></i> Comprar de Contado
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Compra rápida redirigiendo a WhatsApp de contado
function comprarPorWhatsApp(nombreProducto, precio) {
    const telefonoDestino = "584120000000"; // Agrega aquí el WhatsApp oficial tuyo o de Edimar
    const mensaje = encodeURIComponent(`¡Hola! Me interesa adquirir de contado el producto "${nombreProducto}" por un monto de $${precio}. ¿Cómo coordinamos el despacho?`);
    window.open(`https://wa.me/${telefonoDestino}?text=${mensaje}`, '_blank');
}

// ==========================================================================
// 🛡️ ACCESO DE ADMINISTRACIÓN FLOTANTE (Edimar)
// ==========================================================================
function openAdminModal() {
    document.getElementById("admin-auth-modal").classList.add("active");
}

function closeAdminModal() {
    document.getElementById("admin-auth-modal").classList.remove("active");
    document.getElementById("admin-password-input").value = "";
}

async function validateAdminAccess() {
    const passInput = document.getElementById("admin-password-input").value;
    if(!passInput) return alert("Por favor, ingresa la clave.");

    mostrarCarga();
    try {
        const res = await fetch(`${WEB_APP_URL}?action=getDatosAdmin&password=${encodeURIComponent(passInput)}`);
        const data = await res.json();
        
        if(data.error) {
            alert("Contraseña de Administrador incorrecta.");
        } else {
            closeAdminModal();
            abrirPanelControlAdmin(data, passInput);
        }
    } catch(err) {
        alert("Error de conexión al validar privilegios.");
    } finally {
        ocultarCarga();
    }
}

function abrirPanelControlAdmin(datosInstancia, passValido) {
    document.getElementById("admin-panel-modal").classList.add("active");
    // Aquí puedes renderizar las tablas internas de Solicitudes_Nuevos y Solicitudes_Inscritos usando datosInstancia
    console.log("Datos de administración cargados con éxito bajo firma de La Patrona.", datosInstancia);
}

function closeAdminPanel() {
    document.getElementById("admin-panel-modal").classList.remove("active");
}

// ==========================================================================
// 🔐 SISTEMA SELECTIVO DE SOLICITUDES Y LOGIN (Clientes)
// ==========================================================================
function abrirFlujoInscripcion(sanId, totalMax) {
    if (clienteAutenticado) {
        // Canal B: Cliente ya registrado e ingresado
        let turnoPropuesto = prompt(`Introduce el número de turno que deseas (1 al ${totalMax}):`);
        if(!turnoPropuesto || turnoPropuesto < 1 || turnoPropuesto > totalMax) return alert("Turno inválido.");
        
        enviarSolicitudInscrito(sanId, turnoPropuesto);
    } else {
        // Canal A: Cliente nuevo sin credenciales
        let nombre = prompt("Ingresa tu Nombre Completo para la aprobación del sistema:");
        let telefono = prompt("Ingresa tu número de Teléfono celular:");
        let turnoPropuesto = prompt(`Introduce el turno que deseas reservar (1 al ${totalMax}):`);
        
        if(!nombre || !telefono || !turnoPropuesto) return alert("Todos los campos son obligatorios.");
        enviarSolicitudNuevo(nombre, telefono, sanId, turnoPropuesto);
    }
}

async function enviarSolicitudNuevo(nombre, telefono, sanId, turno) {
    mostrarCarga();
    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Evita bloqueos de origen cruzado en Google Apps Script
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "solicitarNuevo", nombre, telefono, sanId, turnoDeseado: turno })
        });
        alert("Solicitud enviada a lista de espera. La Patrona validará tu perfil.");
    } catch(e) {
        alert("Error al enviar registro.");
    } finally {
        ocultarCarga();
    }
}

async function enviarSolicitudInscrito(sanId, turno) {
    mostrarCarga();
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "solicitarInscrito", clienteId: clienteAutenticado.id, sanId, turnoDeseado: turno })
        });
        alert("Tu propuesta de turno ha sido anexada para la revisión de Edimar.");
    } catch(e) {
        alert("Error.");
    } finally {
        ocultarCarga();
    }
}

// CONTROL DE LOGUEO CUENTA PRIVADA
async function handleLogin(e) {
    e.preventDefault();
    const telefono = document.getElementById("login-telefono").value;
    const contrasena = document.getElementById("login-pass").value;

    mostrarCarga();
    try {
        const res = await fetch(`${WEB_APP_URL}?action=loginCliente&telefono=${telefono}&contrasena=${contrasena}`);
        const data = await res.json();
        
        if (data.success) {
            clienteAutenticado = data.cliente;
            document.getElementById("login-box").classList.add("hidden");
            document.getElementById("client-dashboard").classList.remove("hidden");
            document.getElementById("client-name").innerText = `Bienvenido, ${data.cliente.nombre}`;
            document.getElementById("client-id").innerText = `ID de Cuenta: ${data.cliente.id}`;
            // Cambiar visualización del botón de navegación para denotar sesión iniciada
            document.querySelector(".btn-private").innerHTML = `<i class="ph-fill ph-user-circle" style="color: var(--accent-success)"></i> Mi Cuenta`;
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Error al validar credenciales.");
    } finally {
        ocultarCarga();
    }
}

function handleLogout() {
    clienteAutenticado = null;
    document.getElementById("login-form").reset();
    document.getElementById("client-dashboard").classList.add("hidden");
    document.getElementById("login-box").classList.remove("hidden");
    document.querySelector(".btn-private").innerHTML = `<i class="ph ph-user-gear"></i> Cuenta Privada`;
}