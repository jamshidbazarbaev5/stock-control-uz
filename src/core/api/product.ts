import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Attribute } from '@/types/attribute';

// Types
export interface ProductMeasurement {
  id?: number;
  measurement_write: number;
  measurement_read?: {
    id: number;
    measurement_name: string;
    short_name?: string;
  };
  number: number | string;
  for_sale: boolean;
}

// Attribute value interface for API responses
export interface AttributeValueResponse {
  id: number;
  attribute: Attribute;
  value: string | number | boolean;
}

export interface Product {
  id?: number;
  has_barcode?: boolean;
  barcode?: string;
  product_name: string;
  color?: string;
  category_write: number;
  store_write?: number;
  has_color?: boolean;
  measurement?: ProductMeasurement[];
  category_read?: {
    id: number;
    category_name: string;
    store_write?: number;
    attributes_read?: Attribute[];
  };
  min_price?: number;
  selling_price?: number;
  // For form submission (create/update)
  attribute_values?: Array<{
    attribute_id: number;
    value: string | number | boolean;
  }>;
  // For API response (get)
  attribute_values_response?: AttributeValueResponse[];
  has_kub?: boolean;
  kub?: number;
  has_recycling?: boolean;
  categories_for_recycling?: number[];
  is_list?: boolean;
  length?: number;
  static_weight?: number;
  has_metr?: boolean;
  has_shtuk?: boolean;
  base_unit?: number;
  ikpu?: string;
  history?: any;
}

// API endpoints
const PRODUCT_URL = 'items/product/';

// Create product API hooks using the factory function
export const {
  useGetResources: useGetProducts,
  useGetResource: useGetProduct,
  useCreateResource: useCreateProduct,
  useUpdateResource: useUpdateProduct,
  useDeleteResource: useDeleteProduct,
} = createResourceApiHooks<Product>(PRODUCT_URL, 'products');
