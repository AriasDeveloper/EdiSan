// CONFIGURACIÓN GENERAL
const SPREADSHEET_ID = "1jWAFC8CIPSUFu4bEOLKk-UYjxX0aFrn_Nz..."; // Se detecta automáticamente, pero puedes dejarlo fijo
const ADMIN_PASSWORD = "TuClaveAdminAqui"; // Cambia esto por tu contraseña premium de administrador

// Habilitar CORS y recibir peticiones del Frontend
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  let action = e.parameter.action;
  let response;
  
  try {
    if (!action && e.postData && e.postData.contents) {
      let data = JSON.parse(e.postData.contents);
      action = data.action;
      e.parameter = data; // Mapear datos para lectura uniforme
    }
    
    switch(action) {
      case "getSanesYProductos":
        response = getSanesYProductos();
        break;
      case "solicitarNuevo":
        response = registrarSolicitudNuevo(e.parameter);
        break;
      case "solicitarInscrito":
        response = registrarSolicitudInscrito(e.parameter);
        break;
      case "loginCliente":
        response = loginCliente(e.parameter);
        break;
      case "getDatosCliente":
        response = getDatosCliente(e.parameter);
        break;
      case "subirComprobante":
        response = subirComprobante(e.parameter);
        break;
      // ACCIONES DE ADMINISTRACIÓN (Validan Password)
      case "getDatosAdmin":
        response = getDatosAdmin(e.parameter);
        break;
      case "procesarSolicitudNuevo":
        response = procesarSolicitudNuevo(e.parameter);
        break;
      case "procesarSolicitudInscrito":
        response = procesarSolicitudInscrito(e.parameter);
        break;
      default:
        response = { error: true, message: "Acción no válida o no especificada" };
    }
  } catch (err) {
    response = { error: true, message: "Error en el servidor: " + err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. LEER SANES Y PRODUCTOS PARA LA VITRINA PÚBLICA
function getSanesYProductos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Leer Sanes
  const hojaSanes = ss.getSheetByName("Sanes");
  const datosSanes = hojaSanes.getDataRange().getValues();
  let sanes = [];
  
  // Actualizar estados "Lleno" dinámicamente antes de enviar al cliente
  actualizarEstadosSanes(ss);
  
  for(let i = 1; i < datosSanes.length; i++) {
    sanes.push({
      id: datosSanes[i][0],
      nombre: datosSanes[i][1],
      cuota: datosSanes[i][2],
      fechaInicio: datosSanes[i][3],
      totalTurnos: datosSanes[i][4],
      estado: datosSanes[i][5],
      ciclo: datosSanes[i][6],
      imagen: datosSanes[i][7]
    });
  }
  
  // Leer Productos
  const hojaProductos = ss.getSheetByName("Productos");
  const datosProd = hojaProductos.getDataRange().getValues();
  let productos = [];
  for(let i = 1; i < datosProd.length; i++) {
    if(datosProd[i][6] === "Activo") {
      productos.push({
        id: datosProd[i][0],
        nombre: datosProd[i][1],
        descripcion: datosProd[i][2],
        precio: datosProd[i][3],
        imagen: datosProd[i][4],
        stock: datosProd[i][5]
      });
    }
  }
  
  return { sanes: sanes, productos: productos };
}

// LÓGICA DE ACTUALIZACIÓN AUTOMÁTICA DE ESTADO "LLENO"
function actualizarEstadosSanes(ss) {
  const hojaSanes = ss.getSheetByName("Sanes");
  const hojaRegistros = ss.getSheetByName("Registros_de_turnos");
  
  const datosSanes = hojaSanes.getDataRange().getValues();
  const datosReg = hojaRegistros.getDataRange().getValues();
  
  for(let i = 1; i < datosSanes.length; i++) {
    let sanId = datosSanes[i][0];
    let totalMax = datosSanes[i][4];
    
    // Contar cuántos ya están registrados en este San
    let ocupados = 0;
    for(let j = 1; j < datosReg.length; j++) {
      if(datosReg[j][1] === sanId) ocupados++;
    }
    
    if(ocupados >= totalMax && datosSanes[i][5] !== "Lleno") {
      hojaSanes.getCell(i + 1, 6).setValue("Lleno");
    } else if (ocupados < totalMax && datosSanes[i][5] === "Lleno") {
      hojaSanes.getCell(i + 1, 6).setValue("Activo");
    }
  }
}

// 2. REGISTRAR SOLICITUD DE CLIENTE NUEVO (Desde la Vitrina)
function registrarSolicitudNuevo(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("Solicitudes_Nuevos");
  
  let idNueva = "SOL-" + Math.floor(1000 + Math.random() * 9000);
  hoja.appendRow([
    idNueva,
    params.nombre,
    params.telefono,
    params.sanId,
    params.turnoDeseado
  ]);
  
  return { success: true, message: "Solicitud enviada a La Patrona correctamente." };
}

// 3. REGISTRAR SOLICITUD DE CLIENTE YA INSCRITO (Desde Cuenta Privada)
function registrarSolicitudInscrito(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("Solicitudes_Inscritos");
  
  let idPropuesta = "PROP-" + Math.floor(1000 + Math.random() * 9000);
  hoja.appendRow([
    idPropuesta,
    params.clienteId,
    params.sanId,
    new Date(),
    params.turnoDeseado // Columna H en tu flujo lógico
  ]);
  
  return { success: true, message: "Tu propuesta de turno ha sido enviada a Edimar." };
}

// 4. LOGIN DE CUENTA PRIVADA
function loginCliente(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("Clientes");
  const datos = hoja.getDataRange().getValues();
  
  for(let i = 1; i < datos.length; i++) {
    if(datos[i][2].toString() === params.telefono.toString() && datos[i][3].toString() === params.contrasena.toString()) {
      return { 
        success: true, 
        cliente: { id: datos[i][0], nombre: datos[i][1], telefono: datos[i][2] } 
      };
    }
  }
  return { success: false, message: "Teléfono o Contraseña incorrectos." };
}

// 5. OBTENER INFORMACIÓN DE LA CUENTA PRIVADA DEL CLIENTE
function getDatosCliente(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaReg = ss.getSheetByName("Registros_de_turnos");
  const hojaSanes = ss.getSheetByName("Sanes");
  
  const datosReg = hojaReg.getDataRange().getValues();
  const datosSanes = hojaSanes.getDataRange().getValues();
  
  let misTurnos = [];
  
  for(let i = 1; i < datosReg.length; i++) {
    if(datosReg[i][2] === params.clienteId) {
      let sanId = datosReg[i][1];
      let infoSan = datosSanes.find(r => r[0] === sanId);
      
      misTurnos.push({
        registroId: datosReg[i][0],
        sanNombre: infoSan ? infoSan[1] : "San Desconocido",
        cuota: infoSan ? infoSan[2] : 0,
        turno: datosReg[i][3],
        fechaLimite: datosReg[i][4],
        estadoPago: datosReg[i][5],
        comprobante: datosReg[i][6]
      });
    }
  }
  return { turnos: misTurnos };
}

// 6. ENVIAR COMPROBANTE DE PAGO
function subirComprobante(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("Registros_de_turnos");
  const datos = hoja.getDataRange().getValues();
  
  for(let i = 1; i < datos.length; i++) {
    if(datos[i][0] === params.registroId) {
      hoja.getCell(i + 1, 7).setValue(params.comprobante); // Columna Comprobante
      hoja.getCell(i + 1, 6).setValue("En revisión"); // Pasa a revisión de la Patrona
      return { success: true, message: "Comprobante registrado. Esperando confirmación." };
    }
  }
  return { success: false, message: "Registro no encontrado." };
}

// ==========================================
// SECCIÓN ADMINISTRATIVA (EDIMAR)
// ==========================================

function getDatosAdmin(params) {
  if(params.password !== ADMIN_PASSWORD) return { error: true, message: "Acceso Denegado." };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let nuevos = ss.getSheetByName("Solicitudes_Nuevos").getDataRange().getValues();
  let inscritos = ss.getSheetByName("Solicitudes_Inscritos").getDataRange().getValues();
  let turnos = ss.getSheetByName("Registros_de_turnos").getDataRange().getValues();
  let clientes = ss.getSheetByName("Clientes").getDataRange().getValues();
  
  return {
    solicitudesNuevos: nuevos.slice(1),
    solicitudesInscritos: inscritos.slice(1),
    registrosTurnos: turnos.slice(1),
    listaClientes: clientes.slice(1)
  };
}

// APROBAR CLIENTE NUEVO (Crea usuario + calcula ciclo automático)
function procesarSolicitudNuevo(params) {
  if(params.password !== ADMIN_PASSWORD) return { error: true, message: "No autorizado." };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Crear Cliente Oficial
  const hojaClientes = ss.getSheetByName("Clientes");
  let clienteId = "CLI" + Math.floor(5000 + Math.random() * 4000);
  let contrasenaAuto = Math.floor(1000 + Math.random() * 9000).toString(); // Clave de 4 dígitos automática
  
  hojaClientes.appendRow([clienteId, params.nombre, params.telefono, contrasenaAuto]);
  
  // 2. Calcular Fecha Límite basado en Ciclo del San
  let fechaLimite = calcularFechaSegunCiclo(ss, params.sanId, params.turnoAsignado);
  
  // 3. Insertar en Registros de Turnos
  const hojaReg = ss.getSheetByName("Registros_de_turnos");
  let regId = "REG" + Math.floor(1000 + Math.random() * 9000);
  hojaReg.appendRow([
    regId,
    params.sanId,
    clienteId,
    params.turnoAsignado,
    fechaLimite,
    "pendiente",
    ""
  ]);
  
  // 4. Limpiar de la bandeja de solicitudes
  eliminarFilaPorId(ss, "Solicitudes_Nuevos", 0, params.solicitudId);
  
  return { success: true, message: "Cliente creado y turno asignado con éxito." };
}

// APROBAR CLIENTE INSCRITO
function procesarSolicitudInscrito(params) {
  if(params.password !== ADMIN_PASSWORD) return { error: true, message: "No autorizado." };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let fechaLimite = calcularFechaSegunCiclo(ss, params.sanId, params.turnoAsignado);
  
  const hojaReg = ss.getSheetByName("Registros_de_turnos");
  let regId = "REG" + Math.floor(1000 + Math.random() * 9000);
  
  hojaReg.appendRow([
    regId,
    params.sanId,
    params.clienteId,
    params.turnoAsignado,
    fechaLimite,
    "pendiente",
    ""
  ]);
  
  eliminarFilaPorId(ss, "Solicitudes_Inscritos", 0, params.propuestaId);
  return { success: true, message: "Propuesta aprobada y turno agendado." };
}

// UTILIDADES INTERNAS: CÁLCULO DE CICLOS DE COBRO AUTOMÁTICO
function calcularFechaSegunCiclo(ss, sanId, turno) {
  const hojaSanes = ss.getSheetByName("Sanes");
  const datos = hojaSanes.getDataRange().getValues();
  
  let fechaInicio = new Date();
  let ciclo = "Semanal";
  
  for(let i = 1; i < datos.length; i++) {
    if(datos[i][0] === sanId) {
      fechaInicio = new Date(datos[i][3]);
      ciclo = datos[i][6];
      break;
    }
  }
  
  let diasAIgualar = 0;
  if (ciclo === "Semanal") diasAIgualar = 7 * (turno - 1);
  else if (ciclo === "Quincenal") diasAIgualar = 15 * (turno - 1);
  else if (ciclo === "Mensual") diasAIgualar = 30 * (turno - 1);
  
  fechaInicio.setDate(fechaInicio.getDate() + diasAIgualar);
  return Utilities.formatDate(fechaInicio, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function eliminarFilaPorId(ss, nombreHoja, columnaIndex, idBuscar) {
  const hoja = ss.getSheetByName(nombreHoja);
  const datos = hoja.getDataRange().getValues();
  for(let i = 1; i < datos.length; i++) {
    if(datos[i][columnaIndex] === idBuscar) {
      hoja.deleteRow(i + 1);
      break;
    }
  }
}