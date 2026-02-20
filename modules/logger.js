// === MODULE: Logger ===
// Simplified logger that outputs to console and shows toast notifications

import { showToast } from './toast.js';

export function log(msg, type = 'info') {
    // Show toast notification
    showToast(msg, type);

    // Filter console output
    switch (type) {
        case 'error':
            console.error(msg);
            break;
        case 'warning':
            console.warn(msg);
            break;
        case 'success':
            console.log(`%c${msg}`, 'color: green');
            break;
        default:
            console.log(msg);
    }
}
