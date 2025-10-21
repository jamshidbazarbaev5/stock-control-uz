import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface StoreBudget {
  id: number;
  budget_type: string;
  amount: string;
}

export interface Store {
  id?: number;
  name: string;
  address: string;
  phone_number: string;
  budget: string;
  budgets?: StoreBudget[];
  is_main: boolean;
  parent_store?: number;
  owner: number;
  color: string; // hex color, e.g. #FF0000
}

// API endpoints
const STORE_URL = 'store/';

// Create store API hooks using the factory function
export const {
  useGetResources: useGetStores,
  useGetResource: useGetStore,
  useCreateResource: useCreateStore,
  useUpdateResource: useUpdateStore,
  useDeleteResource: useDeleteStore,
} = createResourceApiHooks<Store>(STORE_URL, 'stores');