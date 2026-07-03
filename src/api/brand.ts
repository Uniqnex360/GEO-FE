import { api, API_V1 } from "./base";

const ENDPOINTS = {
  BRAND_LIST: `${API_V1}brand/list/`,
  BRAND_CREATE: `${API_V1}brand/create/`,
  BRAND_UPDATE: `${API_V1}brand/update`,
  BRAND_DELETE: `${API_V1}brand/delete`,
  BRAND_META_LIST: `${API_V1}brand/meta-list/`,
} as const;

export interface Brand {
  id: string;
  name: string;
  domain: string;
  industry: string;
  country: string;
  competitor: string;
}

// Enriched to accept tenant_id in request bodies dynamically
export type BrandCU = Omit<Brand, "id"> & {
  id?: string; // Included optionally for update handlers mapping data inline
  tenant_id?: number;
};

export type BrandList = {
  data: Brand[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export type AppMetaList = {
  id: number;
  value: string;
};

class BrandService {
  // Modified to take tenant_id (and potential pagination/filters) as a query parameter
  async getBrands(params?: { tenant_id?: number }): Promise<BrandList> {
    const res = await api.get<BrandList>(ENDPOINTS.BRAND_LIST, { params });
    return res.data;
  }

  async getMetaBrandList(tenant_id: number | null): Promise<AppMetaList[]> {
    const res = await api.get<AppMetaList[]>(ENDPOINTS.BRAND_META_LIST, {
      params: { tenant_id },
    });
    return res.data;
  }

  async createBrand(data: BrandCU): Promise<Brand> {
    const res = await api.post<Brand>(ENDPOINTS.BRAND_CREATE, data);
    return res.data;
  }

  async updateBrand(id: string, data: Partial<BrandCU>): Promise<Brand> {
    const res = await api.put<Brand>(`${ENDPOINTS.BRAND_UPDATE}/${id}/`, data);
    return res.data;
  }

  async deleteBrand(id: string): Promise<void> {
    await api.delete(`${ENDPOINTS.BRAND_DELETE}/${id}/`);
  }
}

export const brandService = new BrandService();
