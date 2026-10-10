// ===== PWA：Service Worker登録と「ホーム画面に追加」 =====
import { $ } from './ui.js';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<unknown>;
}

export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function setupPwa(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }

  let installEvent: InstallPromptEvent | null = null;
  const body = document.body;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as InstallPromptEvent;
    body.classList.add('can-install');
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    body.classList.remove('can-install');
  });
  if (isIOS && !isStandalone) body.classList.add('can-install');

  $('#btnInstall').addEventListener('click', async () => {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice.catch(() => {});
      installEvent = null;
      body.classList.remove('can-install');
    } else if (isIOS) {
      $<HTMLDialogElement>('#iosGuide').showModal();
    }
  });
}
