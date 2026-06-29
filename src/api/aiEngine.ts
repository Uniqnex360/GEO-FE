import { api, API_V1 } from "./base";

const ENDPOINTS = {
  AIENGINE_DETAIL: `${API_V1}ai-engine/list/`,
} as const;

class AIEngineService {
  async getDetail(): Promise<any> {
    const res = await api.get(ENDPOINTS.AIENGINE_DETAIL);
    return res.data;
  }
}

export const aiEngineService = new AIEngineService();
