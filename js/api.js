// Esta función es tu "mensajero" personal
async function enviarDatosAlServidor(datos) {
  const url = "https://script.google.com/macros/s/AKfycbwnwrfBQNALcaYD4mWSy5FcFtWHkAdO_0hea7HkRxUomBdH_Wmt_e0hb-sfwLfcvCsT8Q/exec"; // Pon aquí la URL que te dio Google al publicar
  
  const respuesta = await fetch(url, {
    method: 'POST', // El método POST es para enviar datos privados
    mode: 'cors', // A veces necesario con Apps Script, si da error cámbialo a 'cors'
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datos) // Convertimos tus datos a un formato que el servidor entiende
  });

  return await respuesta.json(); // Esperamos a que el servidor responda
}