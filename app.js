// ==========================================================================
// 1. CONTROL DEL PANEL DE PESTAÑAS Y MENÚ RETRÁCTIL
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Escuchar los clics del menú para cambiar de pestaña
    const enlacesMenu = document.querySelectorAll("nav ul li a");
    const secciones = document.querySelectorAll("main section");

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener("click", (evento) => {
            evento.preventDefault();

            // 1. Quitar la clase 'active' de todos los enlaces
            enlacesMenu.forEach(link => link.classList.remove("active"));
            // 2. Añadir 'active' al enlace en el que hicimos clic
            enlace.classList.add("active");

            // 3. Ocultar todas las secciones del contenido principal
            secciones.forEach(seccion => seccion.style.display = "none");

            // 4. Obtener el ID de la pestaña desde el atributo 'href' (ej: #sanes)
            const destinoId = enlace.getAttribute("href");
            const seccionDestino = document.querySelector(destinoId);
            
            // 5. Mostrar únicamente la sección seleccionada
            if (seccionDestino) {
                seccionDestino.style.display = "block";
            }
        });
    });

    // Iniciar la web mostrando solo la primera pestaña (Sanes) y ocultando el resto
    secciones.forEach((seccion, indice) => {
        seccion.style.display = indice === 0 ? "block" : "none";
    });

    // CONFIGURACIÓN DEL MENÚ RETRÁCTIL
    // Añadimos un botón flotante o atajo para colapsar el menú de pestañas
    const barraNavegacion = document.querySelector("nav");
    
    // Creamos dinámicamente un botón en el HTML para encoger/estirar el menú
    const botonRetractil = document.createElement("button");
    botonRetractil.innerText = "◀";
    botonRetractil.style.cssText = "position:absolute; bottom:20px; right:-15px; width:30px; height:30px; border-radius:50%; background:#9d4edd; color:white; border:none; cursor:pointer; z-index:200;";
    barraNavegacion.appendChild(botonRetractil);

    botonRetractil.addEventListener("click", () => {
        barraNavegacion.classList.toggle("collapsed");
        // Cambiar la flecha dependiendo del estado del menú
        if (barraNavegacion.classList.contains("collapsed")) {
            botonRetractil.innerText = "▶";
        } else {
            botonRetractil.innerText = "◀";
        }
    });
});


// ==========================================================================
// 2. LOGICA DE LOS FORMULARIOS (MOSTRAR / OCULTAR)
// ==========================================================================

// Por defecto, ocultamos todos los contenedores de formularios al cargar la página
const ocultarTodosLosFormularios = () => {
    const formularios = document.querySelectorAll("[id*='container']");
    formularios.forEach(form => form.style.display = "none");
};

// Ejecutar el ocultado inicial cuando cargue la app
window.addEventListener("load", ocultarTodosLosFormularios);

// Función reutilizable para abrir un formulario específico
const abrirFormulario = (idContenedor) => {
    ocultarTodosLosFormularios(); // Cerramos cualquier otro abierto para mantener la pantalla limpia
    const formulario = document.getElementById(idContenedor);
    if (formulario) {
        formulario.style.display = "block";
        formulario.scrollIntoView({ behavior: 'smooth' }); // Desplazamiento suave hacia el formulario
    }
};

// Vincular los botones de "Cancelar" de todos los formularios para que los cierren
document.querySelectorAll("form button[type='button']").forEach(boton => {
    boton.addEventListener("click", ocultarTodosLosFormularios);
});


// ==========================================================================
// 3. CONEXIÓN E INTERCEPCIÓN DE DATOS (MOLDE GOOGLE APPS SCRIPT)
// ==========================================================================

// Capturar el envío de cualquier formulario de la página
document.querySelectorAll("form").forEach(formulario => {
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault(); // Evita que la página se recargue

        // Recolectar todos los inputs del formulario actual de manera automática
        const campos = formulario.querySelectorAll("input, textarea, select");
        let datosFila = {};

        campos.forEach((input, indice) => {
            // Usamos el marcador o un nombre genérico basado en su orden si no tienen atributo 'name'
            const nombreColumna = input.previousElementSibling ? input.previousElementSibling.innerText.replace(":", "") : `Columna_${indice}`;
            datosFila[nombreColumna] = input.value;
        });

        console.log("Datos listos para enviarse a BaseEdimar (Google Sheets):", datosFila);

        // AQUÍ CONECTAREMOS CON GOOGLE APPS SCRIPT MÁS ADELANTE:
        // El comando real que usarás será:
        // google.script.run.withSuccessHandler(respuesta => { ... }).guardarFilaEnSheets(datosFila);

        alert("¡Conexión simulada con éxito! Datos listos para guardarse en el Sheets.");
        formulario.reset(); // Limpia los campos del formulario
        ocultarTodosLosFormularios(); // Cierra el formulario
    });
});