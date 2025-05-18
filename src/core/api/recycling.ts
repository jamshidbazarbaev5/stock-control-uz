import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface CreateRecyclingDTO {
  from_to: number;
  to_product: number;
  spent_amount: string;
  get_amount: string;
  date_of_recycle: string;
  purchase_price_in_uz: number;
  purchase_price_in_us: number;
  selling_price: number;
  min_price: number;
  exchange_rate: number;
  color: string;
  store: number;
}

export interface Recycling extends CreateRecyclingDTO {
  id?: number;
  from_stock_read?: {
    id: number;
    product_read?: {
      id: number;
      product_name: string;
    };
  };
  to_product_read?: {
    id: number;
    product_name: string;
  };
  store_read?: {
    id: number;
    name: string;
  };
}

// API endpoints
const RECYCLING_URL = 'recycling/';

// Create recycling API hooks using the factory function
export const {
  useGetResources: useGetRecyclings,
  useGetResource: useGetRecycling,
  useCreateResource: useCreateRecycling,
  useUpdateResource: useUpdateRecycling,
  useDeleteResource: useDeleteRecycling,
} = createResourceApiHooks<Recycling>(RECYCLING_URL, 'recyclings');