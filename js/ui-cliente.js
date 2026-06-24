// js/ui-cliente.js
import { DB, ejecutarPostSheets } from './api.js';

export let clienteLogueado = null;

export function fijarClienteLogueado(cliente) {
    clienteLogueado = cliente;
}

export function renderizarOfertasPublicas() {
    const contenedor = document.getElementById('contenedor-ofertas-publicas');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    
    DB.sanes.forEach(san => {
        const ocupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
        const lleno = ocupados >= parseInt(san.Total_Turnos);
        const imagenHtml = san.Imagen_URL ? `<div style="width:100%; height:140px; border-radius:10px; background-image: url('${san.Imagen_URL}'); background-size:cover; background-position:center; margin-bottom:12px;"></div>` : '';

        const div = document.createElement('div');
        div.className = 'glass-card';
        div.innerHTML = `
            ${imagenHtml}
            <h4 style="color:var(--morado-brillante); font-size:1.15rem;">${san.Nombre_San}</h4>
            <p style="font-size:0.85rem; color:var(--texto-secundario); margin-bottom: 8px;">Ciclo: ${san.Ciclo || 'Mensual'}</p>
            <div style="margin: 12px 0; font-size:0.9rem; line-height:1.5;">
                <div>Cuota Fija: <strong style="color:var(--oro-brillante);">$${san.Monto_Cuota}</strong></div>
                <div>Disponibilidad: <strong>${ocupados} / ${san.Total_Turnos} Puestos</strong></div>
            </div>
            <button class="btn-solicitar btn-primary" style="width:100%; justify-content:center;" ${lleno ? 'disabled' : ''}>
                ${lleno ? 'GRUPO LLENO' : 'Postularme al San'}
            </button>
        `;
        div.querySelector('.btn-solicitar').onclick = () => abrirModalInscripcionPublico(san.San_ID, san.Nombre_San);
        contenedor.appendChild(div);
    });
}

export function renderizarProductosVitrinas(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    if (DB.productos.length === 0) {
        contenedor.innerHTML = `<p style="color:var(--texto-secundario); grid-column: 1/-1; text-align:center;">No hay productos exhibidos actualmente.</p>`;
        return;
    }

    contenedor.innerHTML = DB.productos.map(p => `
        <div class="glass-card animate-fade" style="text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <img src="${p.Imagen_URL}" style="width:100%; height:160px; object-fit:cover; border-radius:10px; border: 1px solid var(--borde-cristal);">
                <h4 style="margin-top:12px; color:#fff; font-size:1.1rem;">${p.Nombre}</h4>
                <p style="font-size:0.85rem; color:var(--texto-secundario); margin:6px 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.Descripcion}</p>
            </div>
            <div>
                <div style="color:var(--oro-brillante); font-weight:bold; font-size:1.3rem; margin:10px 0;">$${p.Precio}</div>
                <button class="btn-primary" style="width:100%; justify-content:center;" onclick="alert('Ponte en contacto directo con la Patrona (Edimar) para adquirir este producto.')">Adquirir Producto</button>
            </div>
        </div>
    `).join('');
}

function abrirModalInscripcionPublico(sanId, nombreSan) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = `Inscripción: ${nombreSan}`;
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-solicitar-nuevo" class="premium-form">
            <div class="form-group"><label>Tu Nombre y Apellido</label><input type="text" id="sol-nombre" required></div>
            <div class="form-group"><label>Número de WhatsApp / Teléfono</label><input type="text" id="sol-telef" placeholder="Ej. +58412..." required></div>
            <p style="font-size:0.8rem; color:var(--texto-secundario); line-height:1.4; margin-top:5px;">Tu información pasará a aprobación de la directiva.</p>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:10px;">Enviar Solicitud</button>
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

export function renderizarEspacioPrivadoCliente() {
    if (!clienteLogueado) return;
    
    const tablaPuestos = document.getElementById('tabla-puestos-inscritos');
    const misPuestos = DB.registrosTurnos.filter(r => r.Cliente_ID == clienteLogueado.Cliente_ID);
    
    if(misPuestos.length === 0) {
        tablaPuestos.innerHTML = `<p style="color:var(--texto-secundario);">No tienes puestos asignados aún.</p>`;
    } else {
        let rows = misPuestos.map(p => {
            const s = DB.sanes.find(x => x.San_ID == p.San_ID) || { Nombre_San: 'Desconocido' };
            return `<tr><td><b>${s.Nombre_San}</b></td><td>Turno Nº ${p.Numero_Turno}</td><td><span class="badge-estado ${p.Estado_Pago}">${p.Estado_Pago.toUpperCase()}</span></td></tr>`;
        }).join('');
        tablaPuestos.innerHTML = `<table class="premium-table"><thead><tr><th>San</th><th>Turno</th><th>Tu Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const listaPagar = document.getElementById('lista-cuotas-pagar');
    listaPagar.innerHTML = '';
    
    const cuotasPendientes = misPuestos.filter(p => p.Estado_Pago !== 'pagado');
    if(cuotasPendientes.length === 0) {
        listaPagar.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--texto-secundario);">¡Estás al día con tus pagos!</td></tr>`;
    } else {
        cuotasPendientes.forEach(cuota => {
            const s = DB.sanes.find(x => x.San_ID == cuota.San_ID) || { Nombre_San: '-', Monto_Cuota: 0 };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${s.Nombre_San}</b> (T-${cuota.Numero_Turno})</td>
                <td style="color:var(--oro-brillante); font-weight:bold;">$${s.Monto_Cuota}</td>
                <td><span style="color:#ef4444;">${cuota.Fecha_Limite ? cuota.Fecha_Limite.split('T')[0] : 'Por definir'}</span></td>
                <td><button class="btn-primary btn-subir-recibo" style="padding:5px 12px; font-size:0.85rem;">Subir Recibo</button></td>
            `;
            tr.querySelector('.btn-subir-recibo').onclick = () => abrirModalSubirComprobante(cuota.Registro_ID);
            listaPagar.appendChild(tr);
        });
    }

    const contenedorPrivado = document.getElementById('contenedor-ofertas-privadas');
    contenedorPrivado.innerHTML = '';
    const sanesDisponibles = DB.sanes.filter(san => !misPuestos.some(m => m.San_ID == san.San_ID));
    
    if(sanesDisponibles.length === 0) {
        contenedorPrivado.innerHTML = `<p style="color:var(--texto-secundario); padding:10px; grid-column:1/-1; text-align:center;">Participas en todos los grupos.</p>`;
    } else {
        sanesDisponibles.forEach(san => {
            const ocupados = DB.registrosTurnos.filter(r => r.San_ID == san.San_ID).length;
            const completo = ocupados >= parseInt(san.Total_Turnos);
            const imagenHtml = san.Imagen_URL ? `<div style="width:100%; height:140px; border-radius:10px; background-image: url('${san.Imagen_URL}'); background-size:cover; background-position:center; margin-bottom:12px;"></div>` : '';
            
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.innerHTML = `
                ${imagenHtml}
                <h4>${san.Nombre_San}</h4>
                <p style="font-size:0.9rem; margin:5px 0; color:var(--texto-secundario);">Cuota: <b>$${san.Monto_Cuota}</b></p>
                <button class="btn-primary btn-proponer" style="width:100%; margin-top:8px; justify-content:center;" ${completo ? 'disabled' : ''}>
                    ${completo ? 'Lleno' : 'Solicitar Entrada'}
                </button>
            `;
            if(!completo) {
                div.querySelector('.btn-proponer').onclick = () => {
                    const passConfirmacion = prompt("Confirma tu contraseña para enviar la solicitud:");
                    if (passConfirmacion === String(clienteLogueado.Contrasena)) {
                        ejecutarPostSheets('propuestaInscrito', {
                            id: "PROP" + Date.now().toString().slice(-4),
                            clienteId: clienteLogueado.Cliente_ID,
                            sanId: san.San_ID
                        }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
                    } else if(passConfirmacion !== null) alert("Contraseña incorrecta.");
                };
            }
            contenedorPrivado.appendChild(div);
        });
    }

    renderizarProductosVitrinas('contenedor-productos-cliente-privado');
}

function abrirModalSubirComprobante(registroId) {
    const modal = document.getElementById('modal-premium');
    document.getElementById('modal-titulo').innerText = "Cargar Comprobante de Pago";
    document.getElementById('modal-cuerpo').innerHTML = `
        <form id="form-subir-comprobante" class="premium-form">
            <div class="form-group"><label>Número de Referencia o URL de Captura</label><input type="text" id="comprobante-link" placeholder="Ej. Ref: 492042" required></div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:10px;">Enviar Comprobante</button>
        </form>
    `;
    modal.classList.add('modal-active');
    document.getElementById('form-subir-comprobante').onsubmit = (e) => {
        e.preventDefault();
        modal.classList.remove('modal-active');
        ejecutarPostSheets('registrarPago', { 
            registroId: registroId, 
            nuevoEstado: 'pendiente', 
            comprobante: document.getElementById('comprobante-link').value 
        }, window.mostrarCarga, window.ocultarCarga, window.recargarManejador);
    };
}