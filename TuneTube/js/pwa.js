// ===== PWA：Service Worker登録と「ホーム画面に追加」 =====
import { $ } from './ui.js';
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone === true;
export function setupPwa() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { }); });
    }
    let installEvent = null;
    const body = document.body;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        installEvent = e;
        body.classList.add('can-install');
    });
    window.addEventListener('appinstalled', () => {
        installEvent = null;
        body.classList.remove('can-install');
    });
    if (isIOS && !isStandalone)
        body.classList.add('can-install');
    $('#btnInstall').addEventListener('click', async () => {
        if (installEvent) {
            await installEvent.prompt();
            await installEvent.userChoice.catch(() => { });
            installEvent = null;
            body.classList.remove('can-install');
        }
        else if (isIOS) {
            $('#iosGuide').showModal();
        }
    });
}
