import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface ProductMeasurement {
  measurement_write: number;
  number: number;
}

export interface Product {
  id?: number;
  product_name: string;
  category_write: number;
  store_write?: number;
  measurements?: ProductMeasurement[];
   measurement?: ProductMeasurement[];
  category_read?: {
    id: number;
    category_name: string;
    store_write: number;
  };
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    created_at: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
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
