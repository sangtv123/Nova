import { signal, computed, Signal } from '@nova/signals';

export const locale = signal<string>('en', 'i18n.locale');
export const isLoaded = signal<boolean>(true, 'i18n.isLoaded');

const translations = new Map<string, Record<string, string>>();
const loaders = new Map<string, () => Promise<Record<string, string>>>();

/**
 * Direct initialization of default locale translations
 */
export function initTranslations(initialLocale: string, dict: Record<string, string>): void {
  translations.set(initialLocale, dict);
  locale.value = initialLocale;
}

/**
 * Register a lazy-load bundle loader for dynamic code splitting
 */
export function registerLocaleLoader(localeName: string, loader: () => Promise<any>): void {
  loaders.set(localeName, async () => {
    const mod = await loader();
    return mod.default || mod;
  });
}

/**
 * Switch locale, dynamically fetching translations if needed, with reactive loading state
 */
export async function setLocale(newLocale: string): Promise<void> {
  if (translations.has(newLocale)) {
    locale.value = newLocale;
    return;
  }

  const loader = loaders.get(newLocale);
  if (!loader) {
    // If no custom loader is configured, set locale directly (fall back to static keys)
    locale.value = newLocale;
    return;
  }

  isLoaded.value = false;
  try {
    const dict = await loader();
    translations.set(newLocale, dict);
    locale.value = newLocale;
  } catch (err) {
    console.error(`[nova/i18n] Failed to lazy-load translations for locale "${newLocale}":`, err);
  } finally {
    isLoaded.value = true;
  }
}

/**
 * Translate a key reactively. Returns a computed Signal that updates
 * instantly on locale change and can be chained directly with signal Pipes.
 */
export function t(key: string, params?: Record<string, string | number>): Signal<string> {
  return computed(() => {
    const activeLocale = locale.value;
    const dict = translations.get(activeLocale) || {};
    let phrase = dict[key] !== undefined ? dict[key] : key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        phrase = phrase.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
      }
    }
    return phrase;
  }, `i18n.translate.${key}`);
}
