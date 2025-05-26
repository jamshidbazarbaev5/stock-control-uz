import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface CashInflowName {
  id?: number;
  name: string;
}

// API endpoints
const CASH_INFLOW_NAME_URL = 'budget/cash_inflow_name/';

// Create cash inflow name API hooks using the factory function
export const {
  useGetResources: useGetCashInflowNames,
  useGetResource: useGetCashInflowName,
  useCreateResource: useCreateCashInflowName,
  useUpdateResource: useUpdateCashInflowName,
  useDeleteResource: useDeleteCashInflowName,
} = createResourceApiHooks<CashInflowName>(CASH_INFLOW_NAME_URL, 'cashInflowNames');
