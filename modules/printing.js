// === MODULE: Printing & Preview ===
// Maneja solicitudes de impresión, vista previa y carga de plantillas

import { API_URL, DEFAULT_CUSTOM_TEMPLATE } from './config.js';
import { log } from './logger.js';
import { makeDraggable } from './uiHelpers.js';

// Pre-fill custom text area on load
export function initializeCustomTemplate() {
    const customText = document.getElementById('custom-json-text');
    const container = document.getElementById('custom-json-container');
    const header = document.getElementById('json-window-header');

    if (customText && !customText.value.trim()) {
        customText.value = JSON.stringify(DEFAULT_CUSTOM_TEMPLATE, null, 2);
    }

    if (container && header) {
        makeDraggable(container, header);
    }
}

export function toggleCustomJsonVisibility() {
    console.log("toggleCustomJsonVisibility called");
    const container = document.getElementById('custom-json-container');
    const btn = document.getElementById('btn-toggle-json');

    if (container) {
        const isHidden = container.classList.toggle('hidden');

        // If becoming visible and hasn't been moved yet, ensure it's centered
        if (!isHidden && !container.style.top) {
            container.style.top = '50%';
            container.style.left = '50%';
            container.style.transform = 'translate(-50%, -50%)';
        }

        if (btn) {
            btn.innerText = isHidden ? '👁️ Mostrar JSON' : '👁️ Ocultar JSON';
        }
    } else {
        console.error("Custom JSON container not found!");
    }
}

export function togglePrinterSelection() {
    const container = document.getElementById('printer-selection-container');
    const statusText = document.getElementById('printer-status-text');

    if (container) {
        const isHidden = container.classList.toggle('hidden');
        if (statusText) {
            statusText.style.display = isHidden ? 'block' : 'none';
        }
    }
}

async function getPayload() {
    const customText = document.getElementById('custom-json-text');
    try {
        return JSON.parse(customText.value);
    } catch (e) {
        log("❌ JSON inválido en área de texto.", 'error');
        throw e;
    }
}

export async function ejecutarImpresion() {
    const printerSelect = document.getElementById('printer-select');
    const printerName = printerSelect.value;

    let payload;
    try {
        payload = await getPayload();
    } catch (e) { return; }

    if (printerName) {
        payload.printer = printerName;
    } else {
        log("⚠ Se usará la impresora definida en el JSON (si existe).", 'warning');
    }

    log(`Enviando impresión...`);

    try {
        const res = await fetch(`${API_URL}/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let data;
        try { data = await res.json(); } catch (e) { throw new Error(`Error parsing JSON: ${res.status}`); }

        if (res.ok && data.success) {
            log(`✅ Impresión correcta: ${data.message}`, 'success');
        } else {
            log(`❌ Error (${data.error || res.status}): ${data.message}`, 'error');
        }

    } catch (e) {
        log(`Excepción al imprimir: ${e.message}`, 'error');
    }
}

export async function generarVistaPrevia() {
    let payload;
    try {
        payload = await getPayload();
    } catch (e) { return; }

    delete payload.printer;

    const btnRefresh = document.getElementById('btn-refresh-preview');
    if (btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.classList.add('btn-loading');
    }

    log("Solicitando vista previa...", 'info');
    mostrarPlaceholderCargando();


    try {
        const res = await fetch(`${API_URL}/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let data;
        try { data = await res.json(); } catch (e) { throw new Error(`Invalid response: ${res.status}`); }

        if (res.ok && data.success) {
            log(`✅ Vista previa generada.`, 'success');
            mostrarPrevisualizacion(data.previewBase64);
        } else {
            log(`❌ Error Vista Previa: ${data.message}`, 'error');
        }
    } catch (e) {
        log(`Excepción preview: ${e.message}`, 'error');
    } finally {
        if (btnRefresh) {
            btnRefresh.disabled = false;
            btnRefresh.classList.remove('btn-loading');
        }
    }
}

function mostrarPrevisualizacion(base64) {
    const container = document.getElementById('preview-container');
    const placeholder = document.getElementById('preview-image-placeholder');

    container.classList.remove('hidden');

    placeholder.innerHTML = `
        <div style="background: white; padding: 10px; border-radius: 4px; display: inline-block;">
            <img src="data:image/png;base64,${base64}" alt="Vista Previa" 
                 style="max-width:100%; border:1px solid #ccc; min-height: 50px; display: block;">
        </div>
    `;
}

export function mostrarPlaceholderError() {
    const container = document.getElementById('preview-container');
    const placeholder = document.getElementById('preview-image-placeholder');

    if (container && placeholder) {
        container.classList.remove('hidden');
        placeholder.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 4px; display: inline-block; border: 1px dashed #ef4444; color: #ef4444;">
                <p style="margin: 0; font-weight: bold;">Vista previa no disponible</p>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem;">Conecte el agente para ver la vista previa.</p>
            </div>
        `;
    }
}

export function mostrarPlaceholderCargando() {
    const container = document.getElementById('preview-container');
    const placeholder = document.getElementById('preview-image-placeholder');

    if (container && placeholder) {
        container.classList.remove('hidden');
        placeholder.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 4px; display: inline-block; border: 1px solid #cbd5e1; color: #64748b;">
                <p style="margin: 0; font-weight: bold;">⏳ Cargando vista previa...</p>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem;">Por favor espere.</p>
            </div>
        `;
    }
}



