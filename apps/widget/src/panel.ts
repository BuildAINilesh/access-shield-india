import { SHIPPED_LANGUAGES, t, type TranslationKey } from './i18n';
import { getProfile, isProfileCustomized, PROFILES } from './profiles';
import type { Language, WidgetPosition, WidgetPreferences } from './types/preferences';
import { refreshTileMeta } from './ui/controls';
import type { PreferencesManager } from './utils/preferences';

const POS_CLASS: Record<WidgetPosition, string> = {
  'bottom-right': 'as-pos-bottom-right',
  'bottom-left': 'as-pos-bottom-left',
  'middle-right': 'as-pos-middle-right',
  'top-right': 'as-pos-top-right',
  'top-left': 'as-pos-top-left',
};

const FILTER_SEL =
  '.as-tool-tile, .as-profile-card, .as-control-group, .as-control-row, .as-speech-actions, .as-hint';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface PanelCallbacks {
  onClose: () => void;
  onReset: () => void;
  onLanguage: (lang: Language) => void;
  onProfileToggle: (id: string) => void;
}

/** Shadow-DOM panel: profiles first, then a searchable tool grid */
export class Panel {
  readonly el: HTMLElement;
  private lang: Language;
  private showActiveOnly = false;

  constructor(
    private readonly prefs: PreferencesManager,
    position: WidgetPosition,
    lang: Language,
    private readonly callbacks: PanelCallbacks,
  ) {
    this.lang = lang;
    this.el = document.createElement('div');
    this.el.id = 'as-panel';
    this.el.className = `as-panel ${POS_CLASS[position]}`;
    this.el.tabIndex = -1;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('lang', lang);
    this.el.setAttribute('aria-label', t('panelTitle', lang));
    this.el.setAttribute('aria-labelledby', 'as-panel-title');
    this.el.setAttribute('aria-describedby', 'as-panel-hint');
    this.el.setAttribute('aria-hidden', 'true');
    this.el.hidden = true;
    this.el.innerHTML = this.buildHTML();
    this.bind();
    this.sync(prefs.get());
  }

  getAllSettingsContainer(): HTMLElement {
    return this.el.querySelector('#as-all-settings') as HTMLElement;
  }

  setOpen(open: boolean): void {
    this.el.hidden = !open;
    this.el.setAttribute('aria-hidden', String(!open));
    this.el.classList.toggle('as-open', open);
    if (open) {
      const title = this.el.querySelector<HTMLElement>('#as-panel-title');
      (title ?? this.el).focus();
    }
  }

  setHighContrast(on: boolean): void {
    this.el.classList.toggle('as-panel-hc', on);
  }

  announce(message: string): void {
    const live = this.el.querySelector('#as-live');
    if (live) live.textContent = message;
  }

  sync(prefs: WidgetPreferences): void {
    this.setHighContrast(prefs.highContrast);
    const { activeProfile } = this.prefs.getProfileState();
    const snapshot = this.prefs.getProfileState().preProfileSnapshot;
    const custom = isProfileCustomized(prefs, activeProfile, snapshot);

    this.el.querySelectorAll<HTMLButtonElement>('[data-profile]').forEach((btn) => {
      const on = btn.dataset.profile === activeProfile;
      btn.setAttribute('aria-checked', String(on));
      btn.classList.toggle('as-checked', on);
      const state = btn.querySelector('.as-profile-state');
      if (state) state.textContent = on ? t('on', this.lang) : t('off', this.lang);
    });

    const status = this.el.querySelector('#as-profile-status');
    if (status) {
      if (activeProfile && custom) {
        const name = t((getProfile(activeProfile)?.labelKey ?? '') as TranslationKey, this.lang);
        status.textContent = t('customBasedOn', this.lang, { name });
      } else {
        status.textContent = '';
      }
    }

    const langSel = this.el.querySelector('#as-lang-select') as HTMLSelectElement | null;
    if (langSel) langSel.value = prefs.language;

    this.updateActiveSummary();
    const search = this.el.querySelector('#as-search') as HTMLInputElement | null;
    this.filterTools(search?.value ?? '');
  }

  updateLabels(lang: Language): void {
    this.lang = lang;
    this.el.setAttribute('lang', lang);
    this.el.setAttribute('aria-label', t('panelTitle', lang));
    const title = this.el.querySelector('#as-panel-title');
    if (title) title.textContent = t('panelTitle', lang);
    const close = this.el.querySelector('#as-close-btn');
    close?.setAttribute('aria-label', t('closePanel', lang));
    const closeText = this.el.querySelector('#as-close-text');
    if (closeText) closeText.textContent = t('closeVisible', lang);
    const reset = this.el.querySelector('#as-reset-btn');
    if (reset) reset.textContent = t('resetAll', lang);
    const heading = this.el.querySelector('#as-profiles-heading');
    if (heading) heading.textContent = t('profilesHeading', lang);
    const tools = this.el.querySelector('#as-tools-heading');
    if (tools) tools.textContent = t('toolsHeading', lang);
    const hint = this.el.querySelector('#as-panel-hint');
    if (hint) hint.textContent = t('panelHint', lang);
    const skip = this.el.querySelector('#as-skip-tools');
    if (skip) skip.textContent = t('skipToTools', lang);
    const showActive = this.el.querySelector('#as-show-active-label');
    if (showActive) showActive.textContent = t('showActive', lang);
    const search = this.el.querySelector('#as-search') as HTMLInputElement | null;
    if (search) {
      const ph = t('searchPlaceholder', lang);
      search.placeholder = ph;
      search.setAttribute('aria-label', ph);
    }
    const searchLabel = this.el.querySelector('#as-search-label');
    if (searchLabel) searchLabel.textContent = t('searchPlaceholder', lang);
    const empty = this.el.querySelector('#as-no-results');
    if (empty) empty.textContent = t('noResults', lang);
    const disclaimer = this.el.querySelector('#as-widget-disclaimer');
    if (disclaimer) disclaimer.textContent = t('widgetDisclaimer', lang);
    const statement = this.el.querySelector('#as-statement-link');
    if (statement) statement.textContent = t('statementLink', lang);
    const powered = this.el.querySelector('#as-powered-link');
    if (powered) powered.textContent = t('poweredBy', lang);
    const langSel = this.el.querySelector('#as-lang-select');
    langSel?.setAttribute('aria-label', t('langSelect', lang));
    const langLabel = this.el.querySelector('#as-lang-select-label');
    if (langLabel) langLabel.textContent = t('langSelect', lang);

    this.el.querySelectorAll<HTMLButtonElement>('[data-profile]').forEach((btn) => {
      const profile = getProfile(btn.dataset.profile ?? '');
      if (!profile) return;
      const label = t(profile.labelKey as TranslationKey, lang);
      const desc = t(profile.descriptionKey as TranslationKey, lang);
      const labelEl = btn.querySelector('.as-profile-label');
      const descEl = btn.querySelector('.as-profile-desc');
      if (labelEl) labelEl.textContent = label;
      if (descEl) descEl.textContent = desc;
      btn.setAttribute('aria-label', `${label}. ${desc}`);
    });

    refreshTileMeta(this.el);
    this.sync(this.prefs.get());
  }

  private buildHTML(): string {
    const l = this.lang;
    const cards = PROFILES.map((p) => {
      const label = t(p.labelKey as TranslationKey, l);
      const desc = t(p.descriptionKey as TranslationKey, l);
      return `<button type="button" class="as-profile-card" role="switch" aria-checked="false"
        data-profile="${p.id}" aria-label="${label}. ${desc}">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="24" height="24">
          <path d="${p.icon}" fill="currentColor"/>
        </svg>
        <span class="as-profile-copy">
          <span class="as-profile-label">${label}</span>
          <span class="as-profile-desc">${desc}</span>
          <span class="as-profile-state" aria-hidden="true">${t('off', l)}</span>
        </span>
      </button>`;
    }).join('');

    return `
      <header class="as-panel-header">
        <h1 id="as-panel-title" class="as-panel-title" tabindex="-1">${t('panelTitle', l)}</h1>
        <div class="as-header-actions">
          <label id="as-lang-select-label" class="as-sr-only" for="as-lang-select">${t('langSelect', l)}</label>
          <select id="as-lang-select" class="as-lang-select" aria-label="${t('langSelect', l)}">
            ${SHIPPED_LANGUAGES.map(
              (opt) =>
                `<option value="${opt.code}"${opt.code === l ? ' selected' : ''}>${opt.nativeLabel}</option>`,
            ).join('')}
          </select>
          <button type="button" class="as-header-btn" id="as-reset-btn">${t('resetAll', l)}</button>
          <button type="button" class="as-close-btn" id="as-close-btn" aria-label="${t('closePanel', l)}">
            <span aria-hidden="true">&times;</span>
            <span id="as-close-text" class="as-close-text">${t('closeVisible', l)}</span>
          </button>
        </div>
      </header>
      <div class="as-panel-content" id="as-panel-content">
        <div id="as-live" class="as-sr-only" aria-live="polite" aria-atomic="true"></div>
        <a id="as-skip-tools" class="as-skip-in-panel" href="#as-tools-heading">${t('skipToTools', l)}</a>
        <p id="as-active-summary" class="as-active-summary" role="status"></p>
        <div class="as-search-wrap">
          <label id="as-search-label" class="as-sr-only" for="as-search">${t('searchPlaceholder', l)}</label>
          <input type="search" id="as-search" class="as-search" autocomplete="off"
            placeholder="${t('searchPlaceholder', l)}" aria-label="${t('searchPlaceholder', l)}"
            aria-controls="as-profiles-heading as-all-settings" />
        </div>
        <label class="as-show-active" for="as-show-active">
          <input type="checkbox" id="as-show-active" />
          <span id="as-show-active-label">${t('showActive', l)}</span>
        </label>
        <p id="as-no-results" class="as-hint" hidden role="status">${t('noResults', l)}</p>
        <section class="as-section" aria-labelledby="as-profiles-heading">
          <h2 id="as-profiles-heading" class="as-section-title">${t('profilesHeading', l)}</h2>
          <p id="as-panel-hint" class="as-hint">${t('panelHint', l)}</p>
          <div class="as-profile-grid" role="group" aria-labelledby="as-profiles-heading">${cards}</div>
          <p id="as-profile-status" class="as-profile-status"></p>
        </section>
        <h2 id="as-tools-heading" class="as-section-title" tabindex="-1">${t('toolsHeading', l)}</h2>
        <div id="as-all-settings" class="as-all-settings"></div>
      </div>
      <footer class="as-panel-footer">
        <p id="as-widget-disclaimer" class="as-disclaimer">${t('widgetDisclaimer', l)}</p>
        <a id="as-statement-link" class="as-footer-link" href="https://accessshield.in/accessibility-statement"
          target="_blank" rel="noopener noreferrer">${t('statementLink', l)}</a>
        <span aria-hidden="true"> · </span>
        <a id="as-powered-link" class="as-footer-link" href="https://accessshield.in"
          target="_blank" rel="noopener noreferrer">${t('poweredBy', l)}</a>
      </footer>`;
  }

  private bind(): void {
    this.el.querySelector('#as-close-btn')?.addEventListener('click', () => this.callbacks.onClose());
    this.el.querySelector('#as-reset-btn')?.addEventListener('click', () => this.callbacks.onReset());

    this.el.querySelector('#as-lang-select')?.addEventListener('change', (e) => {
      const lang = (e.target as HTMLSelectElement).value as Language;
      this.callbacks.onLanguage(lang);
    });

    this.el.querySelectorAll<HTMLButtonElement>('[data-profile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.profile;
        if (id) this.callbacks.onProfileToggle(id);
      });
    });

    this.el.querySelector('#as-search')?.addEventListener('input', (e) => {
      this.filterTools((e.target as HTMLInputElement).value);
    });

    this.el.querySelector('#as-show-active')?.addEventListener('change', (e) => {
      this.showActiveOnly = (e.target as HTMLInputElement).checked;
      const search = this.el.querySelector('#as-search') as HTMLInputElement | null;
      this.filterTools(search?.value ?? '');
    });

    this.el.querySelector('#as-skip-tools')?.addEventListener('click', (e) => {
      e.preventDefault();
      const tools = this.el.querySelector<HTMLElement>('#as-tools-heading');
      tools?.focus();
      tools?.scrollIntoView({ block: 'start' });
    });

    this.el.addEventListener('keydown', (e) => this.onKeydown(e));
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      this.trapFocus(e);
      return;
    }
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      return;
    }
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const profileGrid = target.closest('.as-profile-grid');
    if (profileGrid) {
      this.moveInGrid(e, profileGrid, '.as-profile-card');
      return;
    }
    const section = target.closest('.as-section');
    if (section && target.classList.contains('as-tool-tile')) {
      this.moveInGrid(e, section, '.as-tool-tile');
    }
  }

  private trapFocus(e: KeyboardEvent): void {
    const items = this.getFocusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const root = this.el.getRootNode();
    const active =
      root instanceof ShadowRoot ? root.activeElement : document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  private getFocusable(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
      if (el.hidden) return false;
      return !el.closest('[hidden]');
    });
  }

  private moveInGrid(e: KeyboardEvent, root: Element, sel: string): void {
    const items = Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => !el.hidden);
    const i = items.indexOf(e.target as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    const cols = 2;
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(items.length - 1, i + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, i - 1);
    if (e.key === 'ArrowDown') next = Math.min(items.length - 1, i + cols);
    if (e.key === 'ArrowUp') next = Math.max(0, i - cols);
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    items[next]?.focus();
  }

  private updateActiveSummary(): void {
    const summary = this.el.querySelector('#as-active-summary');
    if (!summary) return;
    const { activeProfile } = this.prefs.getProfileState();
    const count = this.el.querySelectorAll('.as-tool-tile[aria-checked="true"]').length;
    if (activeProfile) {
      const name = t((getProfile(activeProfile)?.labelKey ?? '') as TranslationKey, this.lang);
      summary.textContent = t('activeSummaryProfile', this.lang, {
        name,
        count: String(count),
      });
      return;
    }
    if (count > 0) {
      summary.textContent = t('activeSummaryTools', this.lang, { count: String(count) });
      return;
    }
    summary.textContent = t('activeSummaryNone', this.lang);
  }

  private filterTools(query: string): void {
    const q = query.trim().toLowerCase();
    this.el.querySelectorAll<HTMLElement>(FILTER_SEL).forEach((el) => {
      if (el.id === 'as-no-results' || el.id === 'as-panel-hint') return;
      const hay = `${el.getAttribute('data-search') ?? ''} ${el.textContent ?? ''}`.toLowerCase();
      const matchesQuery = q === '' || hay.includes(q);
      const isToggle = el.classList.contains('as-tool-tile') || el.classList.contains('as-profile-card');
      const matchesActive = !this.showActiveOnly || !isToggle || el.getAttribute('aria-checked') === 'true';
      el.hidden = !matchesQuery || !matchesActive;
    });

    this.el.querySelectorAll<HTMLElement>('.as-section').forEach((sec) => {
      const kids = sec.querySelectorAll<HTMLElement>(
        '.as-tool-tile, .as-control-group, .as-control-row, .as-speech-actions, .as-profile-card',
      );
      if (kids.length === 0) return;
      const any = Array.from(kids).some((el) => !el.hidden);
      sec.hidden = (q !== '' || this.showActiveOnly) && !any;
    });

    const extras = this.el.querySelector('#as-all-settings');
    const anyTool =
      extras !== null &&
      Array.from(extras.querySelectorAll<HTMLElement>('.as-section')).some((s) => !s.hidden);
    const toolsHeading = this.el.querySelector<HTMLElement>('#as-tools-heading');
    if (toolsHeading) toolsHeading.hidden = (q !== '' || this.showActiveOnly) && !anyTool;

    const anySection = Array.from(this.el.querySelectorAll<HTMLElement>('.as-section')).some(
      (s) => !s.hidden,
    );
    const empty = this.el.querySelector<HTMLElement>('#as-no-results');
    if (empty) empty.hidden = anySection || anyTool;
  }
}

export { POS_CLASS };
