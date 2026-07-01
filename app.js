// ==========================================================================
// 1. INTERRUPTOR DE PESTAÑAS Y CONTROL DE SIDEBAR RETRÁCTIL
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const enlacesMenu = document.querySelectorAll("nav ul li a");
    const secciones = document.querySelectorAll("main section");

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener("click", (evento) => {
            evento.preventDefault();

            enlacesMenu.forEach(link => link.classList.remove("active"));
            enlace.classList.add("active");

            secciones.forEach(seccion => seccion.style.display = "none");

            const destinoId = enlace.getAttribute("href");
            const seccionDestino = document.querySelector(destinoId);
            
            if (seccionDestino) {
                seccionDestino.style.display = "block";
            }
        });
    });

    // Estado inicial: solo se visualiza la pestaña de Sanes
    secciones.forEach((seccion, indice) => {
        seccion.style.display = indice === 0 ? "block" : "none";
    });

    // INYECCIÓN Y GESTIÓN DEL BOTÓN DE COLAPSO (RETRÁCTIL)
    const barraNavegacion = document.querySelector("nav");
    const botonRetractil = document.createElement("button");
    botonRetractil.innerText = "◀";
    botonRetractil.style.cssText = "position:absolute; bottom:20px; right:-15px; width:30px; height:30px; border-radius:50%; background:#9d4edd; color:white; border:none; cursor:pointer; z-index:200; font-size:11px; font-weight:bold;";
    barraNavegacion.appendChild(botonRetractil);

    botonRetractil.addEventListener("click", () => {
        barraNavegacion.classList.toggle("collapsed");
        botonRetractil.innerText = barraNavegacion.classList.contains("collapsed") ? "▶" : "◀";
    });
});

// ==========================================================================
// 2. CONTROL DE INTERFAZ DE FORMULARIOS
// ==========================================================================
const ocultarTodosLosFormularios = () => {
    const formularios = document.querySelectorAll("[id*='container']");
    formularios.forEach(form => form.style.display = "none");
};

// Vinculación de seguridad para arranque limpio
window.addEventListener("load", ocultarTodosLosFormularios);

const abrirFormulario = (idContenedor) => {
    ocultarTodosLosFormularios(); 
    const formulario = document.getElementById(idContenedor);
    if (formulario) {
        formulario.style.display = "block";
        formulario.scrollIntoView({ behavior: 'smooth' }); 
    }
};

document.querySelectorAll("form button[type='button']").forEach(boton => {
    boton.addEventListener("click", ocultarTodosLosFormularios);
});

// ==========================================================================
// 3. CAPTURA AUTOMÁTICA DE DATOS
// ==========================================================================
document.querySelectorAll("form").forEach(formulario => {
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault(); 

        const campos = formulario.querySelectorAll("input, textarea, select");
        let datosFila = {};

        campos.forEach((input, indice) => {
            const nombreColumna = input.previousElementSibling ? input.previousElementSibling.innerText.replace(":", "") : `Columna_${indice}`;
            datosFila[nombreColumna] = input.value;
        });

        console.log("Estructura armada para Google Sheets:", datosFila);
        alert("¡Éxito! Formulario procesado de forma local.");
        formulario.reset(); 
        ocultarTodosLosFormularios(); 
    });
});