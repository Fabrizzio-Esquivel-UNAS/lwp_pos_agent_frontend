// === MODULE: App Initialization ===
// Punto de entrada y lógica de inicialización

import { log } from './logger.js';
import { checkNativeBridge, iniciarAgenteMovil } from './nativeBridge.js';
import { conectarAgent } from './agent.js';
import { toggleSection, toggleScan, iniciarEscaneo, mostrarModalRegistro, cerrarModal, toggleConnectionSettings } from './uiHelpers.js';
import { listarImpresoras, guardarImpresora, setPredeterminada, verificarImpresora, eliminarImpresora } from './printers.js';
import { ejecutarImpresion, generarVistaPrevia, initializeCustomTemplate, toggleCustomJsonVisibility, togglePrinterSelection } from './printing.js';

// Expose functions to window for HTML event handlers
window.conectarAgent = conectarAgent;
window.iniciarAgenteMovil = iniciarAgenteMovil;
window.toggleSection = toggleSection;
window.toggleScan = toggleScan;
window.toggleConnectionSettings = toggleConnectionSettings;
window.iniciarEscaneo = iniciarEscaneo;
window.mostrarModalRegistro = mostrarModalRegistro;
window.cerrarModal = cerrarModal;
window.listarImpresoras = listarImpresoras;
window.guardarImpresora = guardarImpresora;
window.setPredeterminada = setPredeterminada;
window.verificarImpresora = verificarImpresora;
window.eliminarImpresora = eliminarImpresora;
window.initializeCustomTemplate = initializeCustomTemplate;
window.toggleCustomJsonVisibility = toggleCustomJsonVisibility;
window.togglePrinterSelection = togglePrinterSelection;
window.ejecutarImpresion = ejecutarImpresion;
window.generarVistaPrevia = generarVistaPrevia;

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en entorno móvil con bridge
    checkNativeBridge();
    // Intentar conectar automáticamente
    conectarAgent();

    // Initialize custom template
    if (window.initializeCustomTemplate) {
        window.initializeCustomTemplate();
    }
});
