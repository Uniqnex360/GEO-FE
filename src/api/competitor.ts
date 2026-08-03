import { api, API_V1 } from "./base";

const ENDPOINTS = {
  DASHBOARD_API: `${API_V1}competitor/dashboard/`,
} as const;

interface CompetitorParams {
  tenant_id: number;
}
class CompetitorService {
  async getDetail(params?: CompetitorParams): Promise<any> {
    const res = await api.get(ENDPOINTS.DASHBOARD_API, {params});
    return res.data;
  }
}

export const competitorService = new CompetitorService();
