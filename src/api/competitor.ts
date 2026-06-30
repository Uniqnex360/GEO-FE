import { api, API_V1 } from "./base";

const ENDPOINTS = {
  DASHBOARD_API: `${API_V1}competitor/dashboard/`,
} as const;

class CompetitorService {
  async getDetail(): Promise<any> {
    const res = await api.get(ENDPOINTS.DASHBOARD_API);
    return res.data;
  }
}

export const competitorService = new CompetitorService();
