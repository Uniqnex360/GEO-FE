import { api, API_V1 } from "./base";

const ENDPOINTS = {
  CATEGORY_LIST: `${API_V1}meta/category/list/`,
  INDUSTRY_LIST: `${API_V1}meta/industry/list/`,
  TAXONOMY_LIST: `${API_V1}meta/taxonomy/list/`
};

class MetaService {
  // Use arrow functions so 'this' context never breaks
  get_category = async (search: string, offset: number, limit: number) => {
    const res = await api.get(ENDPOINTS.CATEGORY_LIST, {
      params: { search, offset, limit },
    });

    // This perfectly matches your exact JSON payload structure
    return {
      items: res.data.items.map((item: any) => ({
        id: item.id,
        value: item.identity, // Maps "identity" from your network tab to "value"
      })),
      has_more: res.data.has_more,
      next_offset: res.data.next_offset,
    };
  };

  get_industry = async (search: string, offset: number, limit: number) => {
    const res = await api.get(ENDPOINTS.INDUSTRY_LIST, {
      params: { search, offset, limit },
    });

    return {
      items: res.data.items.map((item: any) => ({
        id: item.id,
        value: item.identity,
      })),
      has_more: res.data.has_more,
      next_offset: res.data.next_offset,
    };
  };

  get_taxonomy = async (
    search: string,
    page: number,
    limit: number,
    sort_by?: string,
    sort_order?: string,
  ) => {
    const res = await api.get(ENDPOINTS.TAXONOMY_LIST, {
      params: { search, page, limit, sort_by, sort_order },
    });

    return res.data;
  };
}

export const metaService = new MetaService();
