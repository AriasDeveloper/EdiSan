// js/config.js

/**
 * EDISAN - Configuración Global del Sistema Premium
 */

// 1. Endpoint de Conexión Externa
// Aquí pegarás la URL de publicación (Web App URL) una vez que implementemos Google Apps Script.
export const API_CONFIG = {
    URL_APPS_SCRIPT: "https://script.google.com/macros/s/.../exec",
    MODO_DESARROLLO: true // Cambiar a false cuando ya usemos datos 100% reales de Sheets
};

// 2. Estados Operacionales del Juego de Ahorro (San)
// Controla el ciclo de vida de cada grupo abierto
export const SAN_ESTADOS = {
    RECLUTANDO: {
        id: 'Reclutando',
        texto: 'Reclutando',
        claseCss: 'pendiente' // Color ámbar en la interfaz
    },
    ACTIVO: {
        id: 'Activo',
        texto: 'En Curso',
        claseCss: 'pagado' // Color verde neón
    },
    FINALIZADO: {
        id: 'Finalizado',
        texto: 'Completado',
        claseCss: 'atrasado' // Color opaco o gris (reutiliza estructura de alertas)
    }
};

// 3. Estados de Cobros y Cuotas
// Define la condición de cada turno asignado a los clientes
export const CUOTA_ESTADOS = {
    PAGADO: {
        id: 'pagado',
        texto: 'Pagado',
        claseCss: 'pagado'
    },
    PENDIENTE: {
        id: 'pendiente',
        texto: 'Pendiente',
        claseCss: 'pendiente'
    },
    ATRASADO: {
        id: 'atrasado',
        texto: 'Atrasado',
        claseCss: 'atrasado'
    }
};

// 4. Estructura de Mapeo para Google Sheets
// Define con precisión los nombres exactos de las columnas/hojas para evitar errores de tipeo
export const SHEETS_MAP = {
    HOJA_SANES: "Sanes",
    HOJA_CLIENTES: "Clientes",
    HOJA_PAGOS: "Registros_de_Turnos"
};