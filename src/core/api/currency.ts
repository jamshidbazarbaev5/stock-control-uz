import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface Currency {
  id?: number;
  name: string;
  short_name: string;
  is_base: boolean;
}

// API endpoints
const CURRENCY_URL = 'currency/currencies/';

// Create currency API hooks using the factory function
export const {
  useGetResources: useGetCurrencies,
  useGetResource: useGetCurrency,
  useCreateResource: useCreateCurrency,
  useUpdateResource: useUpdateCurrency,
  useDeleteResource: useDeleteCurrency,
} = createResourceApiHooks<Currency>(CURRENCY_URL, 'currencies');
