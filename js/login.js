document.getElementById('formlogin').addEventListener('submit', async function(e) {
  e.preventDefault(); // IMPORTANTE: Esto evita que la página se recargue sola

  // 1. Capturamos los datos
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  // 2. Enviamos al servidor (Apps Script)
  // Usamos el 'fetch' para enviar los datos como un paquete JSON
  const respuesta = await fetch('https://script.google.com/macros/s/AKfycbwnwrfBQNALcaYD4mWSy5FcFtWHkAdO_0hea7HkRxUomBdH_Wmt_e0hb-sfwLfcvCsT8Q/exec', {
    method: 'POST',
    body: JSON.stringify({ usuario: usuario, password: password })
  });

  // 3. Recibimos la respuesta del servidor
  const datos = await respuesta.json();

  // 4. Lógica de redirección
  if (datos.autenticado === 2) {
    window.location.href = 'admin.html'; // Cambia la dirección
  } else {
    if (datos.autenticado === 1) {
       window.location.href = 'cliente.html'; // Cambia la dirección 
    }
    else {
        alert("Usuario o contraseña incorrectos");
    }
  }
});