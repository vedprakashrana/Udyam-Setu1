function normalizeApiUrl(url?: string): string {
  let u = (url || '').trim();
  if (!u) return '';
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = `https://${u}`;
  }
  if (!u.endsWith('/api/v1')) {
    u = `${u.replace(/\/$/, '')}/api/v1`;
  }
  return u;
}

export function getApiBaseUrl(): string {
  // Next.js build-time or runtime env var
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '' && !envUrl.includes('localhost')) {
    return normalizeApiUrl(envUrl);
  }

  // If running in browser on Render cloud or Vercel, automatically pair with the backend service
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('.onrender.com')) {
      const apiHost = hostname.replace('grambiz-web', 'grambiz-api');
      return `https://${apiHost}/api/v1`;
    }
    if (hostname.includes('.vercel.app')) {
      // Point Vercel frontend to the live tunnel to your local backend API
      return `https://1c2ae5a3e2ce1d.lhr.life/api/v1`;
    }
  }

  // Fallback for local development
  return 'http://localhost:8000/api/v1';
}

class DynamicApiUrl extends String {
  toString() {
    return getApiBaseUrl();
  }
  valueOf() {
    return getApiBaseUrl();
  }
  [Symbol.toPrimitive]() {
    return getApiBaseUrl();
  }
}

export const API_BASE_URL: string = (new DynamicApiUrl() as unknown) as string;

export const ApiClient = {
  // Base URL access
  getBaseUrl() {
    return API_BASE_URL;
  },

  // Multilingual Translation (Bhashini / IndicTrans2)
  async translate(text: string, targetLang: string, sourceLang: string = 'en') {
    try {
      const res = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: targetLang, source_lang: sourceLang })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Translate API call failed, using source text:', e);
    }
    return { translated_text: text };
  },

  // Assessments
  async getAssessments() {
    const res = await fetch(`${API_BASE_URL}/assessments`);
    if (!res.ok) throw new Error('Failed to fetch assessments');
    return await res.json();
  },

  async getAssessmentById(id: string) {
    const res = await fetch(`${API_BASE_URL}/assessments/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch assessment ${id}`);
    return await res.json();
  },

  async createAssessment(payload: any) {
    const res = await fetch(`${API_BASE_URL}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create assessment');
    return await res.json();
  },

  // Schemes
  async getSchemes() {
    const res = await fetch(`${API_BASE_URL}/schemes`);
    if (!res.ok) throw new Error('Failed to fetch schemes');
    return await res.json();
  },

  async updateScheme(payload: any) {
    const res = await fetch(`${API_BASE_URL}/admin/schemes/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update scheme');
    return await res.json();
  },

  // Business Comparison Matrix
  async getComparisonMatrix() {
    const res = await fetch(`${API_BASE_URL}/pro/compare/all`);
    if (!res.ok) throw new Error('Failed to fetch business comparison matrix');
    return await res.json();
  },

  // Financial Calculations
  async calculateProjectCost(marginCapital: number, marginPercentage: number = 10) {
    const res = await fetch(`${API_BASE_URL}/finance/project-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ margin_capital: marginCapital, margin_percentage: marginPercentage })
    });
    return await res.json();
  },

  async calculateEMI(principal: number, interestRate: number, tenureMonths: number, moratoriumMonths: number = 0) {
    const res = await fetch(`${API_BASE_URL}/finance/emi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal,
        annual_interest_rate: interestRate,
        tenure_months: tenureMonths,
        moratorium_months: moratoriumMonths
      })
    });
    return await res.json();
  },

  // AI Conversational Chat
  async sendChatMessage(message: string, conversationId?: string, preferredLang: string = 'hi') {
    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        preferred_language: preferredLang
      })
    });
    if (!res.ok) throw new Error('AI Chat endpoint returned error');
    return await res.json();
  },

  // Live APMC Mandi Data
  async getLiveMandiPrices(category?: string, district?: string, state?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (district && district !== 'All') params.append('district', district);
    if (state && state !== 'All') params.append('state', state);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/pro/mandi/live${queryString}`);
    if (!res.ok) throw new Error('Failed to fetch live Mandi prices');
    return await res.json();
  },

  // Pro ML Forecasting
  async getMLForecast(category: string, unitPrice: number, volume: number, months: number = 6) {
    const res = await fetch(`${API_BASE_URL}/pro/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        current_unit_price: unitPrice,
        monthly_base_volume: volume,
        months_ahead: months
      })
    });
    if (!res.ok) throw new Error('Failed to fetch ML forecast');
    return await res.json();
  },

  // Pro Document OCR Scanner
  async scanDocument(documentName: string, sampleText?: string) {
    const res = await fetch(`${API_BASE_URL}/pro/ocr/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_name: documentName,
        sample_text: sampleText
      })
    });
    if (!res.ok) throw new Error('Failed to scan document');
    return await res.json();
  }
};

