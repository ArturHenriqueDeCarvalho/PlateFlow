import {
  DynamicRedirect,
  PlateTemplate,
  PhysicalPlate,
  AnalyticsLog,
  RedirectType,
  AuthUser
} from '../types';

const STORAGE_KEYS = {
  TEMPLATES: 'nfc_qr_templates_v2',
  REDIRECTS: 'nfc_qr_redirects_v2',
  PLATES: 'nfc_qr_plates_v2',
  ANALYTICS: 'nfc_qr_analytics_v2',
  AUTH_TOKEN: 'nfc_qr_auth_token_v2',
  AUTH_USER: 'nfc_qr_auth_user_v2',
};

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to localStorage for key ${key}`, err);
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const StorageService = {
  // ==========================================
  // AUTHENTICATION (SUPABASE / ADMIN)
  // ==========================================
  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha ao autenticar.' };
      }
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com o servidor.' };
    }
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  getAuthUser(): AuthUser | null {
    return safeGetItem<AuthUser | null>(STORAGE_KEYS.AUTH_USER, null);
  },

  async verifyAuth(): Promise<AuthUser | null> {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
      this.logout();
      return null;
    } catch {
      return this.getAuthUser();
    }
  },

  // ==========================================
  // TEMPLATES
  // ==========================================
  getTemplates(): PlateTemplate[] {
    return safeGetItem<PlateTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  },

  async fetchTemplates(): Promise<PlateTemplate[]> {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const templates: PlateTemplate[] = await res.json();
        safeSetItem(STORAGE_KEYS.TEMPLATES, templates);
        return templates;
      }
    } catch (err) {
      console.warn('Could not fetch templates from backend, using local cache:', err);
    }
    return this.getTemplates();
  },

  async saveTemplate(template: PlateTemplate): Promise<PlateTemplate[]> {
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(template),
      });
    } catch (err) {
      console.error('Error saving template to server:', err);
    }

    const current = this.getTemplates();
    const index = current.findIndex(t => t.id === template.id);
    const updated = index >= 0
      ? current.map(t => (t.id === template.id ? template : t))
      : [template, ...current];
    safeSetItem(STORAGE_KEYS.TEMPLATES, updated);
    return updated;
  },

  async deleteTemplate(id: string): Promise<PlateTemplate[]> {
    try {
      await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
    } catch (err) {
      console.error('Error deleting template from server:', err);
    }

    const current = this.getTemplates();
    const updated = current.filter(t => t.id !== id);
    safeSetItem(STORAGE_KEYS.TEMPLATES, updated);
    return updated;
  },

  // ==========================================
  // REDIRECTS
  // ==========================================
  getRedirects(): DynamicRedirect[] {
    return safeGetItem<DynamicRedirect[]>(STORAGE_KEYS.REDIRECTS, []);
  },

  async fetchRedirects(): Promise<DynamicRedirect[]> {
    try {
      const res = await fetch('/api/redirects');
      if (res.ok) {
        const redirects: DynamicRedirect[] = await res.json();
        safeSetItem(STORAGE_KEYS.REDIRECTS, redirects);
        return redirects;
      }
    } catch (err) {
      console.warn('Could not fetch redirects from backend, using local cache:', err);
    }
    return this.getRedirects();
  },

  getRedirectBySlug(slug: string): DynamicRedirect | undefined {
    const redirects = this.getRedirects();
    return redirects.find(r => r.slug.toLowerCase() === slug.toLowerCase());
  },

  async saveRedirect(redirect: DynamicRedirect): Promise<DynamicRedirect[]> {
    const now = new Date().toISOString();
    const updatedRedirect: DynamicRedirect = { ...redirect, updatedAt: now };

    try {
      await fetch(`/api/redirects/${encodeURIComponent(redirect.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updatedRedirect),
      });
    } catch (err) {
      console.error('Error saving redirect to server:', err);
    }

    const current = this.getRedirects();
    const index = current.findIndex(r => r.slug.toLowerCase() === redirect.slug.toLowerCase());
    const updated = index >= 0
      ? current.map(r => (r.slug.toLowerCase() === redirect.slug.toLowerCase() ? updatedRedirect : r))
      : [updatedRedirect, ...current];

    safeSetItem(STORAGE_KEYS.REDIRECTS, updated);
    return updated;
  },

  // ==========================================
  // PLATES
  // ==========================================
  getPlates(): PhysicalPlate[] {
    return safeGetItem<PhysicalPlate[]>(STORAGE_KEYS.PLATES, []);
  },

  async fetchPlates(): Promise<PhysicalPlate[]> {
    try {
      const res = await fetch('/api/plates');
      if (res.ok) {
        const plates: PhysicalPlate[] = await res.json();
        safeSetItem(STORAGE_KEYS.PLATES, plates);
        return plates;
      }
    } catch (err) {
      console.warn('Could not fetch plates from backend, using local cache:', err);
    }
    return this.getPlates();
  },

  async savePlate(plate: PhysicalPlate): Promise<PhysicalPlate[]> {
    try {
      await fetch(`/api/plates/${plate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          nfcWritten: plate.nfcWritten,
          customerNotes: plate.customerNotes,
          templateId: plate.templateId,
        }),
      });
    } catch (err) {
      console.error('Error updating plate on server:', err);
    }

    const current = this.getPlates();
    const index = current.findIndex(p => p.id === plate.id);
    const updated = index >= 0
      ? current.map(p => (p.id === plate.id ? plate : p))
      : [plate, ...current];
    safeSetItem(STORAGE_KEYS.PLATES, updated);
    return updated;
  },

  async markNfcWritten(plateId: string, written = true): Promise<PhysicalPlate[]> {
    const current = this.getPlates();
    const index = current.findIndex(p => p.id === plateId);
    let updatedPlate: PhysicalPlate | undefined;
    if (index >= 0) {
      updatedPlate = {
        ...current[index],
        nfcWritten: written,
        nfcWrittenAt: written ? new Date().toISOString() : undefined,
      };
      current[index] = updatedPlate;
      safeSetItem(STORAGE_KEYS.PLATES, [...current]);
    }

    try {
      await fetch(`/api/plates/${plateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ nfcWritten: written }),
      });
    } catch (err) {
      console.error('Error marking NFC written on server:', err);
    }

    return [...current];
  },

  async deletePlate(id: string): Promise<PhysicalPlate[]> {
    const current = this.getPlates();
    const plate = current.find(p => p.id === id);
    const updated = current.filter(p => p.id !== id);
    safeSetItem(STORAGE_KEYS.PLATES, updated);

    if (plate?.slug) {
      const redirects = this.getRedirects().filter(r => r.slug.toLowerCase() !== plate.slug.toLowerCase());
      safeSetItem(STORAGE_KEYS.REDIRECTS, redirects);
    }

    try {
      await fetch(`/api/plates/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
    } catch (err) {
      console.error('Error deleting plate on server:', err);
    }

    return updated;
  },

  // ==========================================
  // BATCH GENERATOR (ATOMIC SUPABASE TRANSACTION)
  // ==========================================
  async generateBatch(params: {
    templateId: string;
    batchIdentifier: string;
    quantity: number;
    prefix: string;
    customerNotesPrefix: string;
    initialType?: RedirectType;
  }): Promise<{ plates: PhysicalPlate[]; redirects: DynamicRedirect[] }> {
    const existingPlates = this.getPlates();
    const existingRedirects = this.getRedirects();

    const newPlates: PhysicalPlate[] = [];
    const newRedirects: DynamicRedirect[] = [];
    const now = new Date().toISOString();

    for (let i = 1; i <= params.quantity; i++) {
      const paddedNum = i.toString().padStart(2, '0');
      const cleanPrefix = params.prefix.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      const slug = `${cleanPrefix}-${paddedNum}`;

      const redirect: DynamicRedirect = {
        slug,
        type: params.initialType || 'url',
        title: `${params.customerNotesPrefix || 'Placa'} #${paddedNum}`,
        destinationUrl: '',
        status: 'virgin',
        clicks: 0,
        createdAt: now,
        updatedAt: now,
      };

      const plate: PhysicalPlate = {
        id: `plate-${params.batchIdentifier}-${paddedNum}-${Math.random().toString(36).slice(2, 6)}`,
        slug,
        templateId: params.templateId,
        batchIdentifier: params.batchIdentifier,
        plateNumber: i,
        customerNotes: `${params.customerNotesPrefix || 'Placa'} #${paddedNum}`,
        nfcWritten: false,
        createdAt: now,
      };

      newRedirects.push(redirect);
      newPlates.push(plate);
    }

    // Save to server in atomic transaction
    try {
      await fetch('/api/plates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ plates: newPlates, redirects: newRedirects }),
      });
    } catch (err) {
      console.error('Error saving batch to server:', err);
    }

    const updatedPlates = [...newPlates, ...existingPlates];
    const updatedRedirects = [...newRedirects, ...existingRedirects];

    safeSetItem(STORAGE_KEYS.PLATES, updatedPlates);
    safeSetItem(STORAGE_KEYS.REDIRECTS, updatedRedirects);

    return { plates: newPlates, redirects: newRedirects };
  },

  // ==========================================
  // ANALYTICS & STATS
  // ==========================================
  getAnalytics(): AnalyticsLog[] {
    return safeGetItem<AnalyticsLog[]>(STORAGE_KEYS.ANALYTICS, []);
  },

  async fetchAnalytics(): Promise<AnalyticsLog[]> {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const logs: AnalyticsLog[] = await res.json();
        safeSetItem(STORAGE_KEYS.ANALYTICS, logs);
        return logs;
      }
    } catch (err) {
      console.warn('Could not fetch analytics from backend, using cache:', err);
    }
    return this.getAnalytics();
  },

  async recordClick(slug: string, userAgent = '', referrer = ''): Promise<{ redirect?: DynamicRedirect; status: 'ok' | 'not_found' | 'virgin' | 'paused' }> {
    const redirects = this.getRedirects();
    const index = redirects.findIndex(r => r.slug.toLowerCase() === slug.toLowerCase());
    if (index < 0) {
      return { status: 'not_found' };
    }

    const item = redirects[index];
    const isVirgin = item.status === 'virgin' || !item.destinationUrl;
    const isPaused = item.status === 'paused';

    if (isVirgin) return { redirect: item, status: 'virgin' };
    if (isPaused) return { redirect: item, status: 'paused' };

    // Increment click locally
    item.clicks = (item.clicks || 0) + 1;
    redirects[index] = { ...item, updatedAt: new Date().toISOString() };
    safeSetItem(STORAGE_KEYS.REDIRECTS, redirects);

    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const device: AnalyticsLog['device'] = isIos ? 'iOS (iPhone)' : isAndroid ? 'Android' : 'Desktop';

    // Send analytics to backend
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirectSlug: item.slug,
          source: 'qr',
          deviceType: device,
          userAgent: ua,
          referrer,
        }),
      });
    } catch (e) {
      console.error('Error logging analytics to server:', e);
    }

    return { redirect: item, status: 'ok' };
  },

  getStats() {
    const redirects = this.getRedirects();
    const plates = this.getPlates();
    const analytics = this.getAnalytics();

    const totalRedirects = redirects.length;
    const activeRedirects = redirects.filter(r => r.status === 'active').length;
    const virginRedirects = redirects.filter(r => r.status === 'virgin').length;
    const pausedRedirects = redirects.filter(r => r.status === 'paused').length;
    const totalClicks = redirects.reduce((acc, r) => acc + (r.clicks || 0), 0);

    const totalPlates = plates.length;
    const nfcWrittenCount = plates.filter(p => p.nfcWritten).length;
    const nfcRate = totalPlates > 0 ? Math.round((nfcWrittenCount / totalPlates) * 100) : 0;

    const iosClicks = analytics.filter(a => a.device === 'iOS (iPhone)').length;
    const androidClicks = analytics.filter(a => a.device === 'Android').length;
    const desktopClicks = analytics.filter(a => a.device === 'Desktop').length;

    return {
      totalRedirects,
      activeRedirects,
      virginRedirects,
      pausedRedirects,
      totalClicks,
      totalPlates,
      nfcWrittenCount,
      nfcRate,
      deviceBreakdown: {
        ios: iosClicks,
        android: androidClicks,
        desktop: desktopClicks,
      },
    };
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
    localStorage.removeItem(STORAGE_KEYS.REDIRECTS);
    localStorage.removeItem(STORAGE_KEYS.PLATES);
    localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
  },
};
