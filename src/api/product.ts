import { api, API_V1 } from "./base";

const ENDPOINTS = {
  PRODUCT_LIST: `${API_V1}product/list/`,
  PRODUCT_CREATE: `${API_V1}product/create/`,
  PRODUCT_UPDATE: `${API_V1}product/update`,
  PRODUCT_DELETE: `${API_V1}product/delete`,
  PRODUCT_DETAIL: `${API_V1}product/detail`,
} as const;

// ==========================================
// Types & Interfaces (Matching Python Schemas)
// ==========================================

export interface ProductFeature {
  value: string;
}

export interface ProductFAQ {
  question: string;
  answer: string;
  sort_order: number;
}

export interface Product {
  id: number; // Linked directly to Pydantic 'id: int'
  brand_id: number;
  name: string;
  brand_name?: string | null;
  manufacturer?: string | null;
  model_number?: string | null;
  product_type?: string | null;
  category?: string | null;

  // Identifiers
  sku?: string | null;
  mpn?: string | null;
  upc?: string | null;
  gtin?: string | null;
  ean?: string | null;

  // Descriptions & Info
  product_url?: string | null;
  taxonomy?: string | null;
  short_description?: string | null;
  long_description?: string | null;
  specifications?: string | null;

  // Pricing
  regular_price?: number | null;
  sale_price?: number | null;
  currency?: string | null;

  // Metadata & Analytics
  rating?: number | null;
  rating_count?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  // Nested structures from relational fields
  features: ProductFeature[];
  faqs: ProductFAQ[];

  // Included optional front-end specific display fields for UI tables
  visibility?: number;
  rank?: number;
  trend?: number;
}

// Clean mapping types for Data Operations
export type ProductCU = Omit<Product, "id"> & { id?: number };

export interface ProductList {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ==========================================
// API Client Implementation
// ==========================================

class ProductService {
  /**
   * Fetches a paginated sequence of product schemas
   */
  async getProducts(): Promise<ProductList> {
    const res = await api.get<ProductList>(ENDPOINTS.PRODUCT_LIST);
    return res.data;
  }

  /**
   * Creates a brand-new entity based on ProductCreate schema rules
   */
  async createProduct(data: ProductCU): Promise<Product> {
    const res = await api.post<Product>(ENDPOINTS.PRODUCT_CREATE, data);
    return res.data;
  }

  /**
   * Updates an existing database entity corresponding to ProductUpdate rules
   */
  async updateProduct(id: number, data: Partial<ProductCU>): Promise<Product> {
    const res = await api.put<Product>(
      `${ENDPOINTS.PRODUCT_UPDATE}/${id}/`,
      data,
    );
    return res.data;
  }

  async productDetail(id: number) {
    const res = await api.get(`${ENDPOINTS.PRODUCT_DETAIL}/${id}/`);
    return res.data;
  }

  /**
   * Deletes target record mapping clean trailing routes
   */
  async deleteProduct(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.PRODUCT_DELETE}/${id}/`);
  }
}

export const productService = new ProductService();
