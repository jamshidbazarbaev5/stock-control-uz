import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface Budget {
  id?: number;
  store: number;
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
  amount: number;
  comment?: string;
  cash_inflow_name: number;
  cash_inflow_read?: {
    id: number;
    name: string;
  };
}

// API endpoints
const BUDGET_URL = 'budget/add_money/';

// Create budget API hooks using the factory function
export const {
  useGetResources: useGetBudgets,
  useGetResource: useGetBudget,
  useCreateResource: useCreateBudget,
  useUpdateResource: useUpdateBudget,
  useDeleteResource: useDeleteBudget,
} = createResourceApiHooks<Budget>(BUDGET_URL, 'budgets');
