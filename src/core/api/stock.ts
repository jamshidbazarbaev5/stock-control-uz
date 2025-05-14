import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface StockMeasurement {
  measurement_write: number;
  number: number;
}

export interface CreateStockDTO {
  store_write: number;
  product_write: number;
  purchase_price: string;
  selling_price: string;
  min_price: string;
  quantity: number;
  measurement_write: StockMeasurement[];
}

export interface Stock extends CreateStockDTO {
  id?: number;
  product_read?: {
    id: number;
    product_name: string;
    category_read?: {
      id: number;
      category_name: string;
      store_read?: {
        id: number;
        name: string;
        address: string;
        phone_number: string;
        created_at: string;
        is_main: boolean;
        parent_store: number | null;
        owner: number;
      }
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
    }
  };
  measurement_read?: Array<{
    id: number;
    measurement_write: number;
    measurement_read?: {
      id: number;
      measurement_name: string;
      store_read?: {
        id: number;
        name: string;
        address: string;
        phone_number: string;
        created_at: string;
        is_main: boolean;
        parent_store: number | null;
        owner: number;
      }
    };
    number: number;
  }>;
}

// API response type
export interface StockResponse {
  results: Stock[];
  count: number;
}

// API endpoints
const STOCK_URL = 'items/stock/';

// Create stock API hooks using the factory function
export const {
  useGetResources: useGetStocks,
  useGetResource: useGetStock,
  useCreateResource: useCreateStock,
  useUpdateResource: useUpdateStock,
  useDeleteResource: useDeleteStock,
} = createResourceApiHooks<Stock, StockResponse>(STOCK_URL, 'stocks');
