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
  id: number;
  from_to_read: {
    id: number;
    store_read: {
      id: number;
      name: string;
      address: string;
      phone_number: string;
      budget: string;
      created_at: string;
      is_main: boolean;
      parent_store: number | null;
      owner: number;
    };
    product_read: {
      id: number;
      product_name: string;
      category_read: {
        id: number;
        category_name: string;
      };
      measurement: Array<{
        id: number;
        measurement_read: {
          id: number;
          measurement_name: string;
        };
        number: string;
        for_sale: boolean;
      }>;
    };
  };
  to_product_read: {
    id: number;
    product_name: string;
    category_read: {
      id: number;
      category_name: string;
    };
    measurement: Array<{
      id: number;
      measurement_read: {
        id: number;
        measurement_name: string;
      };
      number: string;
      for_sale: boolean;
    }>;
  };
  to_stock_read: {
    id: number;
    store_read: {
      id: number;
      name: string;
      address: string;
      phone_number: string;
      budget: string;
      created_at: string;
      is_main: boolean;
      parent_store: number | null;
      owner: number;
    };
  };
}

export interface PaginatedRecyclings {
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
  results: Recycling[];
  count: number;
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
} = createResourceApiHooks<Recycling, PaginatedRecyclings>(RECYCLING_URL, 'recyclings');