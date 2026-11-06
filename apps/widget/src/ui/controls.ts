import { t, type TranslationKey } from '../i18n';
import type { Language, WidgetPreferences } from '../types/preferences';
import type { PreferencesManager } from '../utils/preferences';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function switchRow(id: string, key: TranslationKey, lang: Language): string {
  const label = t(key, lang);
  const safe = escapeAttr(label);
  return `<button type="button" class="as-tool-tile" role="switch" aria-checked="false"
      data-toggle="${id}" data-search="${safe}" id="as-toggle-${id}" aria-labelledby="as-label-${id}">
      <span class="as-tool-mark" aria-hidden="true"></span>
      <span class="as-label" id="as-label-${id}">${safe}</span>
      <span class="as-tool-state" aria-hidden="true">${t('off', lang)}</span>
    </button>`;
}

export function refreshTileMeta(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('.as-tool-tile').forEach((tile) => {
    const label = tile.querySelector('.as-label')?.textContent?.trim() ?? '';
    tile.setAttribute('data-search', label);
  });
}

export function bindBooleanToggles(
  container: HTMLElement,
  prefs: PreferencesManager,
  map: Record<string, keyof WidgetPreferences>,
): void {
  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = (btn as HTMLElement).dataset.toggle;
      if (!key) return;
      const prefKey = map[key];
      if (!prefKey) return;
      const current = prefs.get();
      prefs.update({ [prefKey]: !current[prefKey] });
    });
  });
}

export function syncBooleanToggles(
  container: HTMLElement,
  values: Array<[string, boolean]>,
  lang: Language,
): void {
  for (const [id, checked] of values) {
    const btn = container.querySelector(`#as-toggle-${id}`);
    if (!btn) continue;
    btn.setAttribute('aria-checked', String(checked));
    btn.classList.toggle('as-checked', checked);
    const state = btn.querySelector('.as-tool-state');
    if (state) state.textContent = t(checked ? 'on' : 'off', lang);
  }
}

export function updateLabelText(
  container: HTMLElement,
  lang: Language,
  keys: Array<[string, TranslationKey]>,
): void {
  for (const [id, key] of keys) {
    const el = container.querySelector(`#${id}`);
    if (!el) continue;
    const label = t(key, lang);
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
      el.setAttribute('aria-label', label);
    } else {
      el.textContent = label;
    }
    const tile = el.closest('.as-tool-tile') as HTMLElement | null;
    if (tile) tile.setAttribute('data-search', label);
  }
}
