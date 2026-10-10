import { CONSENT_VERSION, EXAM_DEFAULT_MINUTES } from './config.js';
import { load, save } from './storage.js';
export const DEFAULT_SETTINGS = {
    apiKey: '',
    mode: 'standard',
    hideShorts: true,
    seniorSearch: false,
    examMinutes: EXAM_DEFAULT_MINUTES,
    channels: [],
    pinHash: null,
};
export function loadSettings() {
    const s = load('settings', {});
    return {
        ...DEFAULT_SETTINGS,
        ...s,
        channels: Array.isArray(s.channels) ? s.channels : [],
    };
}
export function saveSettings(s) {
    save('settings', s);
}
export function hasConsent() {
    return load('consent', 0) === CONSENT_VERSION;
}
export function saveConsent() {
    save('consent', CONSENT_VERSION);
}
