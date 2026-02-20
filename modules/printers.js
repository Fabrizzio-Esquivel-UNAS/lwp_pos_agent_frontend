// === MODULE: Printer Management ===
// Gestiona la lista de impresoras, escaneo y operaciones CRUD

import { API_URL, currentPlatform } from './config.js';
import { log } from './logger.js';
import { mostrarModalRegistro, cerrarModal } from './uiHelpers.js';

export async function listarImpresoras() {
    const container = document.getElementById('printer-list-container');
    const select = document.getElementById('printer-select');

    const currentSelection = select.value;
    const printers = [];

    const btnRefresh = document.getElementById('btn-refresh-printers');
    if (btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.classList.add('btn-loading');
    }

    container.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; color: #64748b;">
            <p style="margin: 0; font-weight: bold;">⏳ Buscando impresoras...</p>
            <p style="margin: 5px 0 0 0; font-size: 0.8rem;">Por favor espere.</p>
        </div>`;

    try {
        const res = await fetch(`${API_URL}/printers`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data: ')) {
                    const dataStr = trimmed.substring(6).trim();
                    if (dataStr === '{}') continue;

                    try {
                        const p = JSON.parse(dataStr);
                        printers.push(p);
                        renderPrinterList(printers);
                        renderPrinterSelect(printers, currentSelection);
                    } catch (e) {
                        console.error("Error al parsear impresora:", e, dataStr);
                    }
                } else if (trimmed.startsWith('event: done')) {
                    log(`Lista de impresoras cargada (${printers.length} encontradas)`, 'success');
                }
            }
        }

        if (printers.length === 0) {
            container.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; color: #64748b;">
                    <p style="margin: 0; font-weight: bold;">No hay impresoras configuradas</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.8rem;">Agregue una manualmente o escanie la red.</p>
                </div>`;
        }
    } catch (e) {
        log("Error de red al listar impresoras", 'error');
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 4px; display: inline-block; border: 1px dashed #ef4444; color: #ef4444; margin: auto;">
                <p style="margin: 0; font-weight: bold;">Error de conexión</p>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem;">${e.message}</p>
            </div>`;
    } finally {
        if (btnRefresh) {
            btnRefresh.disabled = false;
            btnRefresh.classList.remove('btn-loading');
        }
    }
}

function renderPrinterList(printers) {
    const container = document.getElementById('printer-list-container');
    container.innerHTML = '';

    if (printers.length === 0) {
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 4px; display: inline-block; border: 1px solid #cbd5e1; color: #64748b; margin: auto;">
                <p style="margin: 0; font-weight: bold;">No hay impresoras configuradas</p>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem;">Agregue una manualmente o escanie la red.</p>
            </div>`;
        return;
    }

    // currentPlatform imported from config.js
    const isMobile = currentPlatform === 'android' || currentPlatform === 'ios';

    printers.forEach(p => {
        const card = document.createElement('div');
        card.className = 'printer-card';

        let badgesHtml = `<span class="badge badge-${p.type === 'NETWORK' ? 'network' : (p.type === 'BLUETOOTH' ? 'bt' : 'driver')}">${p.type}</span>`;
        if (p.isDefault) badgesHtml += ` <span class="badge badge-default">DEFAULT</span>`;

        // Note: onclick handlers in HTML string won't see imported functions. 
        // We need to attach them globally or use event listeners.
        // For now, I'll rely on global exposure in init.js or attach them here if possible, 
        // but since it's innerHTML string, it expects global functions.
        // I will assume these functions are exposed globally in init.js.

        let actionsHtml = `
            <div class="actions-row">
                ${!p.isDefault ? `<button onclick="setPredeterminada('${p.name}')" class="secondary-btn btn-sm" title="Marcar como predeterminada">★</button>` : ''}
                <button onclick="verificarImpresora('${p.name}')" class="secondary-btn btn-sm" title="Verificar estado">❓ Info</button>
                ${p.type === 'NETWORK' ? `<button onclick="eliminarImpresora('${p.name}')" class="danger-btn btn-sm" title="Eliminar">🗑</button>` : ''}
            </div>
        `;

        card.innerHTML = `
            <div class="printer-info">
                <h3>${p.name}</h3>
                <div class="printer-meta">
                    ${badgesHtml}
                    <span>${p.address || 'N/A'}</span>
                    <span class="printer-status">${p.status || 'UNKNOWN'}</span>
                </div>
            </div>
            ${actionsHtml}
        `;

        container.appendChild(card);
    });
}

function renderPrinterSelect(printers, currentVal) {
    const select = document.getElementById('printer-select');
    select.innerHTML = '<option value="">Seleccione una impresora...</option>';

    printers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.text = `${p.name} ${p.isDefault ? '(Default)' : ''} `;
        if (p.name === currentVal) opt.selected = true;
        select.appendChild(opt);
    });

    if (!select.value) {
        const def = printers.find(p => p.isDefault);
        if (def) select.value = def.name;
    }
}

export async function setPredeterminada(name) {
    log(`Estableciendo '${name}' como default...`);
    try {
        const res = await fetch(`${API_URL} /printers/default`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printer: name })
        });
        const data = await res.json();
        if (data.success) {
            log(data.message, 'success');
            listarImpresoras();
        } else {
            throw new Error(data.message);
        }
    } catch (e) {
        log(`Error: ${e.message} `, 'error');
    }
}

export async function verificarImpresora(name) {
    log(`Verificando estado de '${name}'...`);
    try {
        const res = await fetch(`${API_URL} /printers/${name} `);

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `HTTP ${res.status} `);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data: ')) {
                    const dataStr = trimmed.substring(6).trim();
                    if (dataStr === '{}') continue;

                    try {
                        const p = JSON.parse(dataStr);

                        // Update UI log
                        if (p.status === 'ONLINE') {
                            log(`✅ ${p.name}: ONLINE`, 'success');
                        } else if (p.status === 'OFFLINE') {
                            log(`❌ ${p.name}: OFFLINE`, 'error');
                        } else {
                            log(`ℹ️ ${p.name}: ${p.status} `);
                        }

                        // DOM Update (Bonus)
                        updatePrinterStatusInList(p);

                    } catch (e) {
                        console.error("Error al parsear evento de estado:", e, dataStr);
                    }
                } else if (trimmed.startsWith('event: done')) {
                    // Stream finished normally
                }
            }
        }
    } catch (e) {
        log(`Error verificación: ${e.message} `, 'error');
    }
}

function updatePrinterStatusInList(printer) {
    const cards = document.querySelectorAll('.printer-card');
    for (const card of cards) {
        const title = card.querySelector('h3');
        if (title && title.innerText === printer.name) {
            const statusSpan = card.querySelector('.printer-status');
            if (statusSpan) {
                statusSpan.innerText = printer.status;
            }
            break;
        }
    }
}

export async function escanear(type = '') {
    const resultsDiv = document.getElementById('scan-results');
    const statusDiv = document.getElementById('scan-status');
    const btnScan = document.getElementById('btn-scan-network');
    if (btnScan) {
        btnScan.disabled = true;
        btnScan.classList.add('btn-loading');
    }

    let count = 0;

    try {
        const query = type ? `?type=${type}` : '';
        const res = await fetch(`${API_URL}/printers/scan${query}`);

        if (res.status === 501) {
            statusDiv.innerText = "Esta función no está soportada en Desktop.";
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Error HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Mantener línea incompleta en el buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data: ')) {
                    const dataStr = trimmed.substring(6).trim();
                    if (dataStr === '{}') continue;

                    try {
                        const dev = JSON.parse(dataStr);
                        count++;
                        statusDiv.innerText = `Buscando... (${count} encontrados)`;

                        const item = document.createElement('div');
                        item.className = 'scan-item';
                        // Using arrow function here works because prellenarModal is in scope (defined below)
                        item.onclick = () => prellenarModal(dev.model || 'Desconocido', dev.type, dev.address);
                        item.innerHTML = `
                            <div>
                                <strong>${dev.model || 'Desconocido'}</strong>
                                <small>${dev.address} ${dev.source ? `(${dev.source})` : ''}</small>
                            </div>
                            <span class="badge badge-${dev.type === 'NETWORK' ? 'network' : 'bt'}">${dev.type}</span>
                        `;
                        resultsDiv.appendChild(item);
                    } catch (e) {
                        console.error("Error al parsear dispositivo:", e, dataStr);
                    }
                } else if (trimmed.startsWith('event: done')) {
                    statusDiv.innerText = `Escaneo finalizado. Se encontraron ${count} dispositivos.`;
                }
            }
        }
    } catch (e) {
        statusDiv.innerText = `Error de escaneo: ${e.message}`;
    } finally {
        if (btnScan) {
            btnScan.disabled = false;
            btnScan.classList.remove('btn-loading');
        }
    }
}

function prellenarModal(name, type, address) {
    document.getElementById('reg-name').value = name;
    document.getElementById('reg-type').value = type;
    document.getElementById('reg-address').value = address;
    mostrarModalRegistro();
}

export async function guardarImpresora() {
    const name = document.getElementById('reg-name').value;
    const type = document.getElementById('reg-type').value;
    const address = document.getElementById('reg-address').value;

    if (!name || !address) {
        alert("Todos los campos son obligatorios");
        return;
    }

    log(`Guardando impresora '${name}'...`);
    try {
        const res = await fetch(`${API_URL}/printers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                type: type,
                address: address,
                isDefault: false
            })
        });
        const data = await res.json();
        if (data.success) {
            log('Impresora guardada correctamente', 'success');
            cerrarModal();
            listarImpresoras();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (e) {
        log(`Error al guardar: ${e.message}`, 'error');
    }
}

export async function eliminarImpresora(name) {
    if (!confirm(`¿Seguro que desea eliminar la impresora '${name}'?`)) return;

    try {
        const res = await fetch(`${API_URL}/printers/${name}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            log(`Impresora '${name}' eliminada`, 'success');
            listarImpresoras();
        } else {
            alert(data.message);
        }
    } catch (e) {
        log(`Error al eliminar: ${e.message}`, 'error');
    }
}
