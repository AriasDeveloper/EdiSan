// ==========================================
// CONFIGURACIÓN DE CONEXIÓN API (VERCEL -> GOOGLE)
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwUuT3PK1sh9z-Pt5pHMNzFmV4euI-n5u-S4zCyu0VaU4tAUUwqwkJCnBOuL6iZsEuQ/exec"; // Termina en /exec

let datosLocales = { sanes: [], productos: [] };
let clienteSesion = null;
let claveAdminValida = "";

const frasesEdimar = [
  "Sincronizando registros con la autorización de La Patrona Edimar...",
  "Consultando balances... Al servicio estricto de La Patrona.",
  "Calculando proyecciones de cobro bajo la supervisión de Edimar...",
  "Accediendo a los libros mayores oficiales de BaseEdimar...",
  "Cargando vitrinas premium... Un momento, por favor.",
  "Estableciendo canal blindado con la base de datos de Google..."
];

// Motor de peticiones HTTP POST unificado hacia Google Apps Script
async function consultarBackend(payload) {
  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      // Cambiamos a 'cors' explícito y añadimos la redirección automática
      mode: "cors", 
      redirect: "follow", 
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    
    return await respuesta.json();
  } catch (error) {
    console.error("Error en comunicación:", error);
    // Quitamos el loader si falla para que no tranque la pantalla
    mostrarLoader(false); 
    alert("Error de conexión con BaseEdimar: Verifique la URL de la API o los permisos.");
    return { success: false, error: error.toString() };
  }
}

document.addEventListener("DOMContentLoaded", function() {
  iniciarRotacionFrases();
  cargarDatosIniciales();
});

function mostrarLoader(activar) {
  const loader = document.getElementById("loader-screen");
  if(activar) {
    loader.style.display = "flex";
    loader.style.opacity = "1";
  } else {
    loader.style.opacity = "0";
    setTimeout(() => { loader.style.display = "none"; }, 500);
  }
}

function iniciarRotacionFrases() {
  setInterval(() => {
    const el = document.getElementById("loader-phrase");
    if(el) {
      el.innerText = frasesEdimar[Math.floor(Math.random() * frasesEdimar.length)];
    }
  }, 3000);
}

async function cargarDatosIniciales() {
  mostrarLoader(true);
  const response = await consultarBackend({ action: "obtenerDatosVitrina" });
  mostrarLoader(false);
  
  if(response.success) {
    datosLocales.sanes = response.sanes;
    datosLocales.productos = response.productos;
    renderizarVitrina();
  } else {
    alert("Fallo en sincronización: " + response.error);
  }
}

function renderizarVitrina() {
  const contSanes = document.getElementById("contenedor-sanes");
  const contProd = document.getElementById("contenedor-productos");
  contSanes.innerHTML = "";
  contProd.innerHTML = "";
  
  datosLocales.sanes.forEach(san => {
    const esLleno = san.Estado === "Lleno";
    const imgUrl = san.Imagen_URL || "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500";
    contSanes.innerHTML += `
      <div class="glass-card">
        <img src="${imgUrl}" class="card-img" alt="San Pack">
        <span class="card-badge ${esLleno ? 'badge-lleno' : 'badge-activo'}">${san.Estado}</span>
        <h3>${san.Nombre_San}</h3>
        <p style="color: var(--text-muted); font-size:0.9rem; margin:0.5rem 0;">Ciclo: <strong>${san.Ciclo}</strong></p>
        <div style="display:flex; justify-content:space-between; margin:1rem 0; align-items:center;">
          <div><span style="font-size:0.8rem; color:var(--text-muted);">Cuota</span><br><strong style="font-size:1.3rem; color:var(--pink-accent);">$${san.Monto_Cuota}</strong></div>
          <div style="text-align:right;"><span style="font-size:0.8rem; color:var(--text-muted);">Límite Cupos</span><br><strong>${san.Total_Turnos} Máx</strong></div>
        </div>
        <button class="btn-premium" ${esLleno ? 'disabled' : ''} onclick="abrirModalSolicitud('${san.San_ID}', '${san.Nombre_San}')">
          ${esLleno ? 'Grupo Completo' : 'Postular por un Turno'}
        </button>
      </div>
    `;
  });

  datosLocales.productos.forEach(prod => {
    if(prod.Estado !== "Activo") return;
    const imgUrl = prod.Imagen_URL || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
    contProd.innerHTML += `
      <div class="glass-card">
        <img src="${imgUrl}" class="card-img" alt="Product Image">
        <h3>${prod.Nombre}</h3>
        <p style="color: var(--text-muted); font-size:0.85rem; margin:0.5rem 0; height:40px; overflow:hidden;">${prod.Descripcion}</p>
        <div style="display:flex; justify-content:space-between; margin:1rem 0; align-items:center;">
          <div><span style="font-size:0.8rem; color:var(--text-muted);">Precio Especial</span><br><strong style="font-size:1.4rem; color:#10b981;">$${prod.Precio}</strong></div>
          <div style="text-align:right;"><span style="font-size:0.8rem; color:var(--text-muted);">Disponibles</span><br><strong>${prod.Stock} Unidades</strong></div>
        </div>
        <button class="btn-premium" style="background: linear-gradient(135deg, #10b981, #059669);" onclick="ejecutarCompraExpress('${prod.Nombre}', '${prod.Precio}')">
          Compra Directa Express
        </button>
      </div>
    `;
  });
}

function ejecutarCompraExpress(nombre, precio) {
  const tlfSoporte = "584140000000"; 
  const txt = encodeURIComponent(`Hola, deseo adquirir de contado el siguiente producto de la vitrina EDISAN:\n\n*Producto:* ${nombre}\n*Precio:* $${precio}\n\nPor favor indíqueme los métodos de pago.`);
  window.open(`https://api.whatsapp.com/send?phone=${tlfSoporte}&text=${txt}`, "_blank");
}

function cambiarVista(vista) {
  document.querySelectorAll(".app-vista").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".btn-nav").forEach(b => b.classList.remove("active"));
  document.getElementById(`vista-${vista}`).classList.add("active");
  document.getElementById(`btn-nav-${vista}`).classList.add("active");
}

async function ejecutarLogin() {
  const tlf = document.getElementById("login-telefono").value;
  const pass = document.getElementById("login-pass").value;
  if(!tlf || !pass) return alert("Por favor complete las entradas de acceso.");
  
  mostrarLoader(true);
  const res = await consultarBackend({ action: "loginCliente", telefono: tlf, contrasena: pass });
  mostrarLoader(false);
  
  if(res.success) {
    clienteSesion = res.cliente;
    document.getElementById("auth-box").style.display = "none";
    document.getElementById("dashboard-box").style.display = "block";
    document.getElementById("client-display-name").innerText = clienteSesion.nombre;
    document.getElementById("client-display-id").innerText = clienteSesion.id;
    cargarDashboardCliente();
  } else {
    alert(res.message);
  }
}

async function cargarDashboardCliente() {
  if(!clienteSesion) return;
  const res = await consultarBackend({ action: "obtenerDashboardCliente", clienteId: clienteSesion.id });
  
  if(res.success) {
    const cont = document.getElementById("contenedor-turnos-cliente");
    cont.innerHTML = "";
    if(res.turnos.length === 0) {
      cont.innerHTML = `<p style="grid-column: 1/-1; color:var(--text-muted);">Usted no registra asignaciones oficiales en ningún San actualmente.</p>`;
      return;
    }
    res.turnos.forEach(t => {
      cont.innerHTML += `
        <div class="glass-card">
          <h4>${t.Nombre_San}</h4>
          <p style="margin:0.3rem 0;">Turno Oficial Asignado: <strong style="color:var(--purple-neon); font-size:1.2rem;">#${t.Numero_Turno}</strong></p>
          <p style="font-size:0.85rem; color:var(--text-muted);">Límite de Cobro: ${t.Fecha_Limite}</p>
          <div style="margin:1rem 0; display:flex; justify-content:space-between; align-items:center;">
            <span class="card-badge" style="background:rgba(255,255,255,0.05); color:#fff;">Estado: ${t.Estado_Pago}</span>
            <span style="font-weight:700; color:var(--pink-accent);">$${t.Monto_Cuota}</span>
          </div>
          <button class="btn-secondary" style="width:100%;" onclick="abrirModalPago('${t.Registro_ID}')">Reportar Pago Móvil / Ref</button>
        </div>
      `;
    });
  }
}

function cerrarSesion() {
  clienteSesion = null;
  document.getElementById("auth-box").style.display = "block";
  document.getElementById("dashboard-box").style.display = "none";
}

function abrirModalSolicitud(sanId, nombreSan) {
  document.getElementById("solicitud-san-id").value = sanId;
  document.getElementById("solicitud-san-nombre").innerText = "Grupo: " + nombreSan;
  document.getElementById("campos-canal-a").style.display = clienteSesion ? "none" : "block";
  document.getElementById("modal-solicitud").style.display = "flex";
}

async function enviarSolicitudCupo() {
  const sanId = document.getElementById("solicitud-san-id").value;
  const turno = document.getElementById("sol-turno").value;
  if(!turno) return alert("Especifique el turno deseado.");

  mostrarLoader(true);
  let res;
  if(clienteSesion) {
    res = await consultarBackend({ action: "registrarSolicitudInscrito", clienteId: clienteSesion.id, sanId: sanId, turnoDeseado: turno });
  } else {
    const nombre = document.getElementById("sol-nombre").value;
    const tlf = document.getElementById("sol-telefono").value;
    if(!nombre || !tlf) { mostrarLoader(false); return alert("Complete los campos de identificación."); }
    res = await consultarBackend({ action: "registrarSolicitudNuevo", nombre: nombre, telefono: tlf, sanId: sanId, turnoDeseado: turno });
  }
  
  mostrarLoader(false);
  cerrarModal('modal-solicitud');
  if(res.success) alert("Postulación registrada en el sistema de BaseEdimar de manera exitosa.");
}

function abrirModalPago(registroId) {
  document.getElementById("reporte-registro-id").value = registroId;
  document.getElementById("modal-pago").style.display = "flex";
}

async function enviarReportePago() {
  const regId = document.getElementById("reporte-registro-id").value;
  const comp = document.getElementById("reporte-comprobante").value;
  if(!comp) return alert("Escriba la referencia de la operación.");

  mostrarLoader(true);
  const res = await consultarBackend({ action: "reportarPagoCliente", registroId: regId, comprobante: comp });
  mostrarLoader(false);
  
  cerrarModal('modal-pago');
  if(res.success) {
    alert("Estatus cambiado a 'En revisión'.");
    cargarDashboardCliente();
  }
}

function cerrarModal(id) { document.getElementById(id).style.display = "none"; }
function abrirLoginAdmin() { document.getElementById("modal-admin-auth").style.display = "flex"; }

async function autenticarAdmin() {
  const pass = document.getElementById("admin-clave-input").value;
  mostrarLoader(true);
  const res = await consultarBackend({ action: "verificarClaveAdmin", clave: pass });
  mostrarLoader(false);
  
  if(res.autenticado) {
    claveAdminValida = pass;
    cerrarModal('modal-admin-auth');
    cargarPanelAdmin();
  } else {
    alert("Acceso denegado.");
  }
}

async function cargarPanelAdmin() {
  mostrarLoader(true);
  const res = await consultarBackend({ action: "obtenerDatosAdmin", clave: claveAdminValida });
  mostrarLoader(false);
  
  if(res.success) {
    document.getElementById("panel-admin-abierto").style.display = "block";
    const tA = document.getElementById("tabla-canal-a");
    tA.innerHTML = "";
    res.solNuevos.forEach(s => {
      tA.innerHTML += `
        <tr>
          <td>${s.Solicitud_ID}</td>
          <td>${s.Nombre_Completo}</td>
          <td>${s.Telefono}</td>
          <td>${s.San_ID}</td>
          <td>${s.Turno_Deseado}</td>
          <td><input type="number" id="inp-turno-${s.Solicitud_ID}" value="${s.Turno_Deseado}" style="width:60px;"></td>
          <td><button class="btn-premium" style="padding:0.4rem;" onclick="procesarAprobacion('${s.Solicitud_ID}', true, '${s.San_ID}', '${s.Nombre_Completo}', '${s.Telefono}', null)">Aprobar</button></td>
        </tr>`;
    });

    const tB = document.getElementById("tabla-canal-b");
    tB.innerHTML = "";
    res.solInscritos.forEach(p => {
      tB.innerHTML += `
        <tr>
          <td>${p.Propuesta_ID}</td>
          <td>${p.Cliente_ID}</td>
          <td>${p.San_ID}</td>
          <td>${p.Fecha_Solicitud}</td>
          <td>${p.Turno_Deseado}</td>
          <td><input type="number" id="inp-turno-${p.Propuesta_ID}" value="${p.Turno_Deseado}" style="width:60px;"></td>
          <td><button class="btn-premium" style="padding:0.4rem;" onclick="procesarAprobacion('${p.Propuesta_ID}', false, '${p.San_ID}', null, null, '${p.Cliente_ID}')">Aprobar</button></td>
        </tr>`;
    });
  }
}

async function procesarAprobacion(solicitudId, esNuevo, sanId, nombre, telefono, clienteId) {
  const turnoAsignado = document.getElementById(`inp-turno-${solicitudId}`).value;
  const config = { solicitudId, esNuevo, sanId, nombre, telefono, clienteId, turnoAsignado };
  
  mostrarLoader(true);
  const res = await consultarBackend({ action: "procesarAprobacionAdmin", clave: claveAdminValida, config });
  mostrarLoader(false);
  
  if(res.success) {
    alert("Operación aprobada y asentada.");
    cargarPanelAdmin();
    cargarDatosIniciales();
  } else {
    alert(res.message);
  }
}

function cerrarPanelAdmin() { document.getElementById("panel-admin-abierto").style.display = "none"; }
</script>