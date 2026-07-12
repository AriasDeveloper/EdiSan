const formulario = document.getElementById('formlogin');

formulario.addEventListener('submit', async (event) => {
  event.preventDefault(); // Detenemos el envío normal del formulario

  // 1. Recogemos los datos del HTML
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  // 2. Usamos nuestra función "mensajera"
  const resultado = await enviarDatosAlServidor({ usuario, password });

  // 3. Decidimos qué hacer
  if (resultado.autenticado) {
    alert("¡Bienvenido, " + resultado.rol + "!");
    // Aquí iría tu lógica de redirección
  } else {
    alert("Error: " + resultado.mensaje);
  }
});