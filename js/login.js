document.addEventListener('DOMContentLoaded', () => {
    const usuarioGuardado = localStorage.getItem('usuarioGuardado');
    const inputUsuario = document.getElementById('usuario');
    const checkboxRecordar = document.getElementById('recordarme');

    // Si encontramos un usuario en el "bloc de notas", lo ponemos en el formulario
    if (usuarioGuardado) {
        inputUsuario.value = usuarioGuardado;
        checkboxRecordar.checked = true; // Marcamos el checkbox como activo
    }
});
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
        // Si el checkbox está marcado, guardamos el usuario
        if (document.getElementById('recordarme').checked) {
            localStorage.setItem('usuarioGuardado', usuario);
        } else {
            // Si no está marcado, borramos cualquier usuario previo
            localStorage.removeItem('usuarioGuardado');
        }
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