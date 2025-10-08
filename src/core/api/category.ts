import { createResourceApiHooks } from '../helpers/createResourceApi'
import api from './api'

import type { Attribute } from '@/types/attribute';

// Types
export interface Category {
  id?: number;
  category_name: string;
  attributes?: number[];
  attributes_read?: Attribute[];
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

export interface CategoryWithAttributesResponse {
  links: {
    first: string | null;
    last: string | null;
    next: string | null;
    previous: string | null;
  };
  total_pages: number;
  current_page: number;
  page_range: number[];
  page_size: number;
  results: Category[];
  count: number;
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

// Function to fetch categories with attributes
export const fetchCategoriesWithAttributes = async (categoryName?: string): Promise<CategoryWithAttributesResponse> => {
  const params = categoryName ? { category_name: categoryName } : {};
  const response = await api.get<CategoryWithAttributesResponse>(CATEGORY_URL, { params });
  return response.data;
};
