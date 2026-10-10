import { CONSENT_VERSION, EXAM_DEFAULT_MINUTES } from './config.js';
import { load, save } from './storage.js';
import type { Settings } from './types.js';

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  mode: 'standard',
  hideShorts: true,
  seniorSearch: false,
  examMinutes: EXAM_DEFAULT_MINUTES,
  channels: [],
  pinHash: null,
};

export function loadSettings(): Settings {
  const s = load<Partial<Settings>>('settings', {});
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    channels: Array.isArray(s.channels) ? s.channels : [],
  };
}

export function saveSettings(s: Settings): void {
  save('settings', s);
}

export function hasConsent(): boolean {
  return load<number>('consent', 0) === CONSENT_VERSION;
}

export function saveConsent(): void {
  save('consent', CONSENT_VERSION);
}
