import { api, API_V1 } from "./base";

const ENDPOINTS = {
  DASHBOARD_API: `${API_V1}citation/dashboard/`,
  UNIQUE_LIST: `${API_V1}citation/list/`
} as const;

interface CitationParams  {
  tenant_id?: number;
}

class CitationService {
  async getDetail(params?: CitationParams): Promise<any> {
    const res = await api.get(ENDPOINTS.DASHBOARD_API, {params});
    return res.data;
  }

  async getUniqueCitations(params?: CitationParams): Promise<any> {
    const res = await api.get(ENDPOINTS.UNIQUE_LIST, {params});
    return res.data;
  }
}

export const citationService = new CitationService();
