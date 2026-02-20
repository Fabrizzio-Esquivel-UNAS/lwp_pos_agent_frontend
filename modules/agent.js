// === MODULE: Agent Connection ===
// Maneja la conexión con el agente local

import { API_URL, setApiUrl, currentPlatform, setCurrentPlatform } from './config.js';
import { log } from './logger.js';
import { toggleBridge } from './bridge.js';
import { listarImpresoras } from './printers.js';
import { generarVistaPrevia, mostrarPlaceholderError, mostrarPlaceholderCargando } from './printing.js';
import { limpiarSelectImpresoras } from './uiHelpers.js';

export async function conectarAgent() {
    const urlInput = document.getElementById('server-url');
    let baseUrl = urlInput.value.trim();

    // Validar formato básico
    if (!baseUrl.startsWith('http')) {
        baseUrl = 'http://' + baseUrl;
        urlInput.value = baseUrl;
    }

    // Remover slash final si existe
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    setApiUrl(`${baseUrl}/api/v1`);
    log(`Intentando conectar a ${API_URL}...`);

    mostrarPlaceholderCargando();
    await verificarEstado();
}

export async function verificarEstado() {
    if (!API_URL) return;

    const statusText = document.getElementById('status-text');
    const statusContainer = document.getElementById('status-container');
    const statusIndicator = document.getElementById('status-indicator');

    statusText.innerText = "Conectando...";
    statusContainer.className = '';

    try {
        const response = await fetch(`${API_URL}/status`);
        if (response.ok) {
            const data = await response.json();

            // Actualizar UI de estado
            statusText.innerText = `Online (${data.platform})`;
            statusContainer.className = 'status-online';
            statusIndicator.innerText = '●';

            setCurrentPlatform(data.platform ? data.platform.toLowerCase() : 'unknown');
            log(`Agente conectado: Versión ${data.version} en ${data.host} (${currentPlatform})`, 'success');

            // --- Bridge Logic ---
            const bridgeContainer = document.getElementById('bridge-config-container');
            if (bridgeContainer) {
                bridgeContainer.classList.remove('hidden');
                bridgeContainer.style.display = 'flex';

                const bridgeOverlay = document.getElementById('bridge-offline-overlay');
                if (bridgeOverlay) bridgeOverlay.classList.add('hidden');

                const bridgeInput = document.getElementById('bridge-url');
                const bridgeBtn = document.getElementById('btn-bridge');
                const bridgeBadge = document.getElementById('bridge-status-badge');

                if (data.bridgeTarget) {
                    bridgeInput.value = data.bridgeTarget;
                    bridgeInput.disabled = true;
                    bridgeBtn.innerText = "Desactivar";
                    bridgeBtn.style.backgroundColor = "#ef4444";
                    bridgeBtn.onclick = () => toggleBridge(false);
                    bridgeBadge.style.display = 'block';
                    bridgeBadge.innerText = "EN PUENTE";
                    bridgeBadge.title = `Redirigiendo a: ${data.bridgeTarget}`;
                } else {
                    bridgeInput.disabled = false;
                    bridgeBtn.innerText = "Activar";
                    bridgeBtn.style.backgroundColor = "#2563eb";
                    bridgeBtn.disabled = false;
                    bridgeBtn.onclick = () => toggleBridge(true);
                    bridgeBadge.style.display = 'none';
                }
            }

            // Actualizar UI según plataforma
            actualizarUIPorPlataforma();

            // Cargar impresoras
            listarImpresoras();

            // Generar vista previa inicial
            generarVistaPrevia();

            // Ocultar botón de reintentar si existe
            const retryBtn = document.getElementById('btn-retry-connect');
            if (retryBtn) retryBtn.classList.add('hidden');
        } else {
            throw new Error("Respuesta de estado fallida");
        }
    } catch (e) {
        statusText.innerText = "Error de conexión";
        statusContainer.className = 'status-offline';
        statusIndicator.innerText = '○';
        setCurrentPlatform('unknown');
        log("No se pudo conectar con el agente local.", 'error');

        // Mostrar botón de reintentar
        const retryBtn = document.getElementById('btn-retry-connect');
        if (retryBtn) retryBtn.classList.remove('hidden');

        document.getElementById('printer-list-container').innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; box-sizing: border-box; border: 1px dashed #ef4444; color: #ef4444;">
                <p style="margin: 0; font-weight: bold;">Agente desconectado</p>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem;">Verifique que el agente se esté ejecutando.</p>
            </div>
        `;
        limpiarSelectImpresoras();
        mostrarPlaceholderError();

        // Show overlay instead of greying out
        const bridgeContainer = document.getElementById('bridge-config-container');
        if (bridgeContainer) {
            bridgeContainer.classList.remove('hidden');
            bridgeContainer.style.display = 'flex';

            const bridgeOverlay = document.getElementById('bridge-offline-overlay');
            if (bridgeOverlay) bridgeOverlay.classList.remove('hidden');

            const bridgeInput = document.getElementById('bridge-url');
            const bridgeBtn = document.getElementById('btn-bridge');
            if (bridgeInput) bridgeInput.disabled = true;
            if (bridgeBtn) bridgeBtn.disabled = true;
        }
    }
}

function actualizarUIPorPlataforma() {
    const isMobile = currentPlatform === 'android' || currentPlatform === 'ios';

    const body = document.getElementById('app-body');
    if (body) {
        body.classList.remove('platform-mobile', 'platform-desktop');
        if (isMobile) {
            body.classList.add('platform-mobile');
        } else if (currentPlatform !== 'unknown') {
            body.classList.add('platform-desktop');
        }
    }
}
