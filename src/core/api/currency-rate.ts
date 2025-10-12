import { createResourceApiHooks } from "../helpers/createResourceApi";

// Types
export interface CurrencyRate {
  id?: number;
  rate: string;
  currency: number;
  currency_detail?: {
    id: number;
    name: string;
    short_name: string;
    is_base: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateCurrencyRateDTO {
  rate: string;
  currency: number;
}

export interface UpdateCurrencyRateDTO {
  rate: string;
  currency: number;
}

// API endpoints
const CURRENCY_RATE_URL = "currency/rates/";

// Create currency rate API hooks using the factory function
export const {
  useGetResources: useGetCurrencyRates,
  useGetResource: useGetCurrencyRate,
  useCreateResource: useCreateCurrencyRate,
  useUpdateResource: useUpdateCurrencyRate,
  useDeleteResource: useDeleteCurrencyRate,
} = createResourceApiHooks<CurrencyRate>(CURRENCY_RATE_URL, "currency-rates");
