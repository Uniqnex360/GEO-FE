import { api, API_V1 } from "./base";


const ENDPOINTS = {
  DASHBOARD_API: `${API_V1}dashboard/`,
} as const;

class DashboardService {
  async getDashboard(tenant_id: number): Promise<any> {
    const res = await api.get(ENDPOINTS.DASHBOARD_API, {
        params: {tenant_id}
    });
    return res.data;
  }
}

export const dashboardService = new DashboardService();
