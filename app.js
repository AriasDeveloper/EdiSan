const API_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec";

let currentUser = null;
let userType = null; // 'client' o 'admin'

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    loadPublicData();
    setupForms();
});

// NAVEGACIÓN ENTRE VISTAS (SPA FLUIDA)
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
}

function initNavigation() {
    document.getElementById('btn-home').addEventListener('click', () => {
        showView('view-home');
        document.getElementById('btn-home').classList.add('active');
    });

    document.getElementById('btn-login-client').addEventListener('click', () => {
        document.getElementById('login-title').innerText = "Acceso Clientes";
        document.getElementById('login-type').value = "client";
        document.getElementById('group-phone').classList.remove('hidden');
        showView('view-login');
    });

    document.getElementById('btn-login-admin').addEventListener('click', () => {
        document.getElementById('login-title').innerText = "Llave de la Patrona";
        document.getElementById('login-type').value = "admin";
        document.getElementById('group-phone').classList.add('hidden');
        showView('view-login');
    });

    document.getElementById('btn-logout').addEventListener('click', logout);

    // Tabs de Administración
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.tab).classList.remove('hidden');
        });
    });
}

// LLAMADAS AL SERVIDOR
async function callAPI(action, data = {}) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ action, ...data })
        });
        return await response.json();
    } catch (error) {
        showToast("Error de conexión con el servidor", "error");
    }
}

// CARGA DE DATOS PÚBLICOS (INDEX)
async function loadPublicData() {
    const res = await callAPI('getPublicData');
    if(res.status === 'success') {
        renderSanes(res.sanes, 'grid-sanes-public', false);
        renderProductos(res.productos, 'grid-productos-public', false);
    }
}

function renderSanes(sanes, containerId, isClientView) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    sanes.forEach(san => {
        container.innerHTML += `
            <div class="card">
                <img src="${san.imagen}" class="card-img" alt="${san.nombre}">
                <div class="card-body">
                    <h4 class="card-title">${san.nombre}</h4>
                    <p class="card-info">Cuota: <b>$${san.cuota}</b> | Ciclo Actual: ${san.ciclo}</p>
                    <p class="card-info">Puestos Libres: ${san.puestos - (san.turnos ? san.turnos.split(',').length : 0)} / ${san.puestos}</p>
                    ${isClientView ? `<button class="btn-primary" onclick="solicitarSan('${san.id}')">Solicitar Cupo</button>` : ''}
                </div>
            </div>
        `;
    });
}

function renderProductos(productos, containerId, isClientView) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    productos.forEach(p => {
        if(p.estado !== 'Agotado') {
            container.innerHTML += `
                <div class="card">
                    <img src="${p.imagen}" class="card-img" alt="${p.nombre}">
                    <div class="card-body">
                        <h4 class="card-title">${p.nombre}</h4>
                        <p class="card-info">${p.descripcion}</p>
                        <p class="card-info" style="color:var(--accent-glow)">Precio: <b>$${p.precio}</b></p>
                        <span class="badge">${p.estado}</span>
                        ${isClientView ? `<button class="btn-primary" style="margin-top:auto;" onclick="solicitarProducto('${p.id}')">Solicitar Compra</button>` : ''}
                    </div>
                </div>
            `;
        }
    });
}

// LOGUEOS Y SESIONES
function setupForms() {
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('login-type').value;
        const pass = document.getElementById('login-pass').value;
        const phone = document.getElementById('login-phone').value;

        const res = await callAPI('login', { type, pass, phone });
        if(res.status === 'success') {
            currentUser = res.user;
            userType = type;
            document.getElementById('btn-logout').classList.remove('hidden');
            if(type === 'client') {
                loadClientPanel();
            } else {
                loadAdminPanel();
            }
        } else {
            showToast(res.message, "error");
        }
    });
    // Manejo del Guardado de Sanes desde el Modal Administrador
    document.getElementById('form-san').addEventListener('submit', async (e) => {
        e.preventDefault();
        const san = {
            id: document.getElementById('san-id').value,
            nombre: document.getElementById('san-name').value,
            cuota: document.getElementById('san-cuota').value,
            fecha: document.getElementById('san-date').value,
            puestos: document.getElementById('san-puestos').value,
            imagen: document.getElementById('san-img').value
        };

        const res = await callAPI('createOrUpdateSan', { san });
        if(res.status === 'success') {
            showToast("¡San guardado con éxito!");
            closeModal('modal-san');
            loadAdminPanel(); // Recarga las tablas del panel
        } else {
            showToast(res.message, "error");
        }
    });
}

async function loadClientPanel() {
    showView('view-client');
    document.getElementById('client-name').innerText = currentUser.nombre;
    const res = await callAPI('getClientData', { clientId: currentUser.id });
    // Aquí renderizarías sus pagos pendientes y sanes activos apuntando a elementos del view-client
}

async function loadAdminPanel() {
    showView('view-admin');
    const res = await callAPI('getAdminData');
    if(res.status === 'success') {
        // Renderizar tablas dinámicas de control absoluto para La Patrona
        renderAdminSanes(res.sanes);
    }
}

function logout() {
    currentUser = null;
    userType = null;
    document.getElementById('btn-logout').classList.add('hidden');
    showView('view-home');
    document.getElementById('btn-home').classList.add('active');
}

// MODALES CONTROL
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); }));
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// TOAST SYSTEMS
function showToast(text, type = "success") {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerText = text;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}