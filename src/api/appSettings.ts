import { api, API_V1 } from "./base";

const ENDPOINTS = {
  SETTINGS_API: `${API_V1}settings/`,
} as const;

class SettingsService {
  async getDetail(): Promise<any> {
    const res = await api.get(ENDPOINTS.SETTINGS_API);
    return res.data;
  }

  async updateSettings(): Promise<any> {
    const res = await api.put(ENDPOINTS.SETTINGS_API);
    return res.data;
  }
}

export const settingsService = new SettingsService();
