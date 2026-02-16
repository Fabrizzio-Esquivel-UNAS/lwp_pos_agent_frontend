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
