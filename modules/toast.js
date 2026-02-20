// === MODULE: Toast Notifications ===
// Muestra mensajes flotantes que desaparecen automáticamente

export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return; // Si no existe el contenedor, no hace nada

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icono según tipo
    let icon = '';
    switch (type) {
        case 'success': icon = '✅ '; break;
        case 'error': icon = '❌ '; break;
        case 'warning': icon = '⚠️ '; break;
        default: icon = 'ℹ️ ';
    }

    toast.innerHTML = `<span>${icon}${message}</span>`;

    // Añadir al contenedor
    container.appendChild(toast);

    // Animación de entrada (pequeño delay para permitir renderizado)
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remover después del tiempo especificado
    setTimeout(() => {
        toast.classList.remove('show');
        // Esperar a que termine la transición CSS para eliminar del DOM
        toast.addEventListener('transitionend', () => {
            if (toast.parentElement) {
                toast.remove();
            }
        });
    }, duration);
}
