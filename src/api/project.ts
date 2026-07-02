import { api, API_V1 } from "./base";

const ENDPOINTS = {
  LIST_API: `${API_V1}tenant/list/`,
  CREATE_API: `${API_V1}tenant/create/`,
  UPDATE_API: (id: number | string) => `${API_V1}tenant/update/${id}/`,
  DELETE_API: (id: number | string) => `${API_V1}tenant/delete/${id}/`,
} as const;

class ProjectService {
  async getList(): Promise<any> {
    const res = await api.get(ENDPOINTS.LIST_API);
    // Explicitly handling both raw structures: { data: [...] } or direct array responses
    return res.data;
  }

  async createProject(data: any) {
    const res = await api.post(ENDPOINTS.CREATE_API, data);
    return res.data;
  }

  async updateProject(id: number, data: any) {
    const res = await api.put(ENDPOINTS.UPDATE_API(id), data);
    return res.data;
  }

  async deleteProject(id: number) {
    const res = await api.delete(ENDPOINTS.DELETE_API(id));
    return res.data;
  }
}

export const projectService = new ProjectService();
