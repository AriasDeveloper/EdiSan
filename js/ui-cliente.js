// js/ui-cliente.js
import { DB, ejecutarPostSheets } from './api.js';

export let clienteLogueado = null;

export function fijarClienteLogueado(cliente) {
    clienteLogueado = cliente;
}

// 1. RENDERIZADO DE GRUPOS (SANES) EN VISTA PÚBLICA
export function renderizarOfertasPublicas() {
    const contenedor = document.getElementById('contenedor-ofertas-publicas');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    
    DB.sanes.forEach(san => {
        const ocupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
        const lleno = ocupados >= parseInt(san.Total_Turnos);
        
        // Estilizado de imagen (si existe)
        const imagenHtml = san.Imagen_URL ? 
            `<div class="san-card-img" style="background-image: url('${san.Imagen_URL}'); height:150px; background-size:cover; background-position:center; border-radius:12px; margin-bottom:15px;"></div>` 
            : '';

        const div = document.createElement('div');
        div.className = 'glass-card animate-fade';
        div.innerHTML = `
            ${imagenHtml}
            <h4 style="color:var(--morado-brillante); font-size:1.2rem;">${san.Nombre_San}</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom: 8px;">Ciclo de cobro: ${san.Ciclo || 'Mensual'}</p>
            <div style="margin: 12px 0; font-size:0.9rem;">
                <div>Cuota Fija: <strong style="color:var(--oro-brillante);">$${san.Monto_Cuota}</strong></div>
                <div>Llenado: <strong>${ocupados} / ${san.Total_Turnos} Puestos</strong></div>
            </div>
            <button class="btn-solicitar btn-primary" style="width:100%; justify-content:center;" ${lleno ? 'disabled' : ''} title="Postularse para este grupo">
                ${lleno ? 'GRUPO COMPLETADO' : 'Quiero Inscribirme'}
            </button>
        `;
        
        div.querySelector('.btn-solicitar').onclick = () => abrirModalInscripcionPublico(san.San_ID, san.Nombre_San);
        contenedor.appendChild(div);
    });
}

// 2. FORMULARIO PARA NUEVOS (CORRECCIÓN DE ETIQUETAS Y ACCESIBILIDAD)
function abrirModalInscripcionPublico(sanId, nombreSan) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = `Unirse a ${nombreSan}`;
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-solicitar-nuevo" class="premium-form" title="Formulario de postulación para nuevos usuarios">
            <div class="form-group">
                <label for="sol-nombre">Tu Nombre y Apellido</label>
                <input type="text" id="sol-nombre" name="sol-nombre" placeholder="Ej. Juan Pérez" title="Escribe tu nombre completo" required>
            </div>
            <div class="form-group">
                <label for="sol-telef">Teléfono de contacto (WhatsApp)</label>
                <input type="text" id="sol-telef" name="sol-telef" placeholder="Ej. +58 412..." title="Escribe tu número de teléfono" required>
            </div>
            <p style="font-size:0.8rem; color:var(--texto-secundario); margin-top:10px;">La patrona revisará tu perfil y te enviará una contraseña de acceso.</p>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:15px;">Enviar Solicitud a Edimar</button>
        </form>
    `;
    modal.classList.add('modal-active');
    
    document.getElementById('form-solicitar-nuevo').onsubmit = (e) => {
        e.preventDefault();
        modal.classList.remove('modal-active');
        ejecutarPostSheets('solicitarNuevo', {
            id: "REQ" + Date.now().toString().slice(-4),
            nombre: document.getElementById('sol-nombre').value,
            telefono: document.getElementById('sol-telef').value,
            sanId: sanId
        }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
    };
}

// 3. VITRINA DE PRODUCTOS
export function renderizarProductosVitrinas(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    if (DB.productos.length === 0) {
        contenedor.innerHTML = `<p style="color:var(--texto-secundario); grid-column: 1/-1; text-align:center; padding: 2rem;">No hay productos exhibidos actualmente.</p>`;
        return;
    }

    contenedor.innerHTML = DB.productos.map(p => `
        <div class="glass-card animate-fade text-center" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <img src="${p.Imagen_URL}" alt="${p.Nombre}" style="width:100%; height:160px; object-fit:cover; border-radius:12px; border: 1px solid var(--borde-cristal);">
                <h4 style="margin-top:12px; color:#fff;">${p.Nombre}</h4>
                <p style="font-size:0.8rem; color:var(--texto-secundario); margin:5px 0;">${p.Descripcion}</p>
            </div>
            <div>
                <div style="color:var(--oro-brillante); font-weight:bold; font-size:1.3rem; margin:10px 0;">$${p.Precio}</div>
                <button class="btn-primary" style="width:100%; justify-content:center;" onclick="alert('Contacta a Edimar para adquirir este producto.')" title="Comprar producto">Adquirir</button>
            </div>
        </div>
    `).join('');
}

// 4. ESPACIO PRIVADO DEL CLIENTE LOGUEADO
export function renderizarEspacioPrivadoCliente() {
    if (!clienteLogueado) return;
    
    const tablaPuestos = document.getElementById('tabla-puestos-inscritos');
    const misPuestos = DB.registrosTurnos.filter(r => r.Cliente_ID == clienteLogueado.Cliente_ID);
    
    // Tabla de puestos actuales
    if(misPuestos.length === 0) {
        tablaPuestos.innerHTML = `<p style="color:var(--texto-secundario);">Aún no tienes puestos confirmados.</p>`;
    } else {
        let rows = misPuestos.map(p => {
            const s = DB.sanes.find(x => x.San_ID == p.San_ID) || { Nombre_San: '-' };
            return `<tr><td><b>${s.Nombre_San}</b></td><td>Turno ${p.Numero_Turno}</td><td><span class="badge-estado ${p.Estado_Pago}">${p.Estado_Pago}</span></td></tr>`;
        }).join('');
        tablaPuestos.innerHTML = `<table class="premium-table"><thead><tr><th>San</th><th>Turno</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    // Lista de cuotas pendientes
    const listaPagar = document.getElementById('lista-cuotas-pagar');
    listaPagar.innerHTML = '';
    misPuestos.filter(p => p.Estado_Pago !== 'pagado').forEach(cuota => {
        const s = DB.sanes.find(x => x.San_ID == cuota.San_ID) || { Nombre_San: '-', Monto_Cuota: 0 };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${s.Nombre_San}</b></td>
            <td style="color:var(--oro-brillante); font-weight:bold;">$${s.Monto_Cuota}</td>
            <td><span style="color:#ef4444;">${cuota.Fecha_Limite ? cuota.Fecha_Limite.split('T')[0] : '-'}</span></td>
            <td><button class="btn-primary btn-subir-recibo" style="padding:4px 10px; font-size:0.8rem;" title="Subir comprobante">Subir Recibo</button></td>
        `;
        tr.querySelector('.btn-subir-recibo').onclick = () => abrirModalSubirComprobante(cuota.Registro_ID);
        listaPagar.appendChild(tr);
    });

    // Vitrina de otros Sanes para proponerse
    const contenedorPrivado = document.getElementById('contenedor-ofertas-privadas');
    contenedorPrivado.innerHTML = '';
    const sanesLibres = DB.sanes.filter(san => !misPuestos.some(m => m.San_ID == san.San_ID));
    
    sanesLibres.forEach(san => {
        const ocupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
        const completo = ocupados >= parseInt(san.Total_Turnos);
        const div = document.createElement('div');
        div.className = 'glass-card';
        div.innerHTML = `
            <h4>${san.Nombre_San}</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario);">Cuota: $${san.Monto_Cuota}</p>
            <button class="btn-primary btn-proponer" style="width:100%; margin-top:10px;" ${completo ? 'disabled' : ''} title="Solicitar entrada a este grupo">
                ${completo ? 'Lleno' : 'Solicitar Cupo'}
            </button>
        `;
        if(!completo) {
            div.querySelector('.btn-proponer').onclick = () => {
                const p = prompt("Confirma tu contraseña para enviar la solicitud:");
                if (p === String(clienteLogueado.Contrasena)) {
                    ejecutarPostSheets('propuestaInscrito', {
                        id: "PROP" + Date.now().toString().slice(-4),
                        clienteId: clienteLogueado.Cliente_ID,
                        sanId: san.San_ID
                    }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
                } else if(p !== null) alert("Contraseña incorrecta.");
            };
        }
        contenedorPrivado.appendChild(div);
    });

    // Pintar productos en la vitrina privada inferior
    renderizarProductosVitrinas('contenedor-productos-cliente-privado');
}

// 5. FORMULARIO PARA RECIBOS (ACCESIBILIDAD CORREGIDA)
function abrirModalSubirComprobante(registroId) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Cargar Pago";
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-subir-comprobante" class="premium-form" title="Formulario para reportar recibos de pago">
            <div class="form-group">
                <label for="comprobante-ref">Número de Referencia o URL de Captura</label>
                <input type="text" id="comprobante-ref" name="comprobante-ref" placeholder="Ej. Ref: 492042" title="Ingresa el dato del comprobante" required>
            </div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:10px;">Enviar Recibo</button>
        </form>
    `;
    modal.classList.add('modal-active');
    document.getElementById('form-subir-comprobante').onsubmit = (e) => {
        e.preventDefault();
        modal.classList.remove('modal-active');
        ejecutarPostSheets('registrarPago', { 
            registroId: registroId, 
            nuevoEstado: 'pendiente', 
            comprobante: document.getElementById('comprobante-ref').value 
        }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
    };
}