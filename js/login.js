document.getElementById('formlogin').addEventListener('submit', async function(e) {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  try {
    const respuesta = await fetch('https://script.google.com/macros/s/AKfycbwnwrfBQNALcaYD4mWSy5FcFtWHkAdO_0hea7HkRxUomBdH_Wmt_e0hb-sfwLfcvCsT8Q/exec', {
      method: 'POST',
      body: JSON.stringify({ usuario: usuario, password: password })
    });

    const datos = await respuesta.json();

    if (datos.autenticado === 2) {
      window.location.href = 'admin.html';
    } else if (datos.autenticado === 1) {
      window.location.href = 'cliente.html';
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Hubo un problema de conexión con el servidor.");
  }
});