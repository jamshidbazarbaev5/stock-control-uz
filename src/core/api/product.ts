import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface ProductMeasurement {
  id?: number;
  measurement_write: number;
  measurement_read?: {
    id: number;
    measurement_name: string;
  };
  number: number | string;
  for_sale: boolean;
}

export interface Product {
  id?: number;
  product_name: string;
  color?: string;
  category_write: number;
  store_write?: number;
  has_color?: boolean;
  measurement?: ProductMeasurement[];
  category_read?: {
    id: number;
    category_name: string;
    store_write: number;
  };
  has_kub?: boolean;
  kub?: number;
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
