// Esperamos a que todo el HTML cargue
document.addEventListener('DOMContentLoaded', () => {
    const btnMostrar = document.getElementById('mostrarPassword');
    const inputPassword = document.getElementById('password');

    btnMostrar.addEventListener('click', () => {
        // Verificamos el tipo actual del input
        if (inputPassword.type === 'password') {
            // Si es password, lo cambiamos a texto para que se vea
            inputPassword.type = 'text';
            btnMostrar.textContent = '☑︎'; // Cambiamos el icono para indicar que ahora oculta
        } else {
            // Si es texto, lo regresamos a password para ocultarlo
            inputPassword.type = 'password';
            btnMostrar.textContent = '◻︎'; // Regresamos al icono original
        }
    });
});