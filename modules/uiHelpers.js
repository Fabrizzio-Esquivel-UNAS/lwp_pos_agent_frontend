// === MODULE: UI Helpers ===
// Funciones auxiliares para manipulación de la interfaz

export function toggleSection(contentId, btn) {
    const content = document.getElementById(contentId);
    if (!content) return;

    const isHidden = content.classList.toggle('hidden');
    btn.innerText = isHidden ? '▶' : '▼';
}

export function toggleScan() {
    const area = document.getElementById('scan-area');
    area.classList.toggle('hidden');
    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-status').innerText = '';
}

export function toggleConnectionSettings() {
    const overlay = document.getElementById('connection-overlay');
    if (!overlay) return;

    overlay.classList.toggle('active');
}

// Dependencia circular potencial con printers.js si se llama a escanear
import { escanear } from './printers.js';

export function iniciarEscaneo() {
    const area = document.getElementById('scan-area');
    area.classList.remove('hidden');
    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-status').innerText = '';
    escanear('network');
}

export function mostrarModalRegistro() {
    document.getElementById('modal-registro').classList.add('active');
}

export function cerrarModal() {
    document.getElementById('modal-registro').classList.remove('active');
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-address').value = '';
}

export function limpiarSelectImpresoras() {
    document.getElementById('printer-select').innerHTML = '<option>Sin conexión</option>';
}

/**
 * Hace que un elemento sea arrastrable
 * @param {HTMLElement} element - El elemento que se moverá
 * @param {HTMLElement} handle - El elemento que actuará como asa para arrastrar
 */
export function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        // Si el elemento está centrado con transform, convertir a píxeles fijos para evitar saltos
        const rect = element.getBoundingClientRect();
        if (!element.style.top || element.style.top === '50%' || window.getComputedStyle(element).transform !== 'none') {
            element.style.top = rect.top + "px";
            element.style.left = rect.left + "px";
            element.style.transform = 'none';
            element.style.margin = '0'; // Evitar interferencias si hay margenes
        }

        // Obtener posición del ratón al inicio
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Llamar a la función cuando el ratón se mueve
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calcular nueva posición
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Establecer la nueva posición del elemento
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // Detener el movimiento al soltar el botón del ratón
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
