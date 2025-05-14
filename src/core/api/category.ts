import { createResourceApiHooks } from '../helpers/createResourceApi'

// Types
export interface Category {
  id?: number;
  category_name: string;
  store_write?: number;
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
const CATEGORY_URL = 'items/category/';

// Create category API hooks using the factory function
export const {
  useGetResources: useGetCategories,
  useGetResource: useGetCategory,
  useCreateResource: useCreateCategory,
  useUpdateResource: useUpdateCategory,
  useDeleteResource: useDeleteCategory,
} = createResourceApiHooks<Category>(CATEGORY_URL, 'categories');
