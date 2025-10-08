import { createResourceApiHooks } from '../helpers/createResourceApi';
import api from './api';

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
  selling_price_in_us?: string;
  min_price: string;
  quantity: number;
  supplier_write: number;
  color?: string;
  measurement_write: StockMeasurement[];
  purchase_price_in_us: string;
  exchange_rate: string;
  purchase_price_in_uz: string;
  date_of_arrived?: string;
  income_weight?: string;
  date?: string;
  // New fields for backend calculation
  currency?: number;
  purchase_unit?: number;
  purchase_unit_quantity?: number;
  total_price_in_currency?: number;
  price_per_unit_currency?: number;
  base_unit_in_uzs?: number;
  total_price_in_uz?: number;
}

export interface Stock extends CreateStockDTO {
  id?: number;
  total_amount?:number;
  total_pure_revenue?:number;
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
  supplier_read?: {
    id: number;
    name: string;
    phone_number: string;
  };
  quantity_for_history?: number;
  history_of_prices?: {
    quantity: number;
    min_price: number;
    exchange_rate: number;
    selling_price: number;
    purchase_price_in_us: number;
    purchase_price_in_uz: number;
    date_of_arrived:Date;
  };
}

// API response type
export interface StockResponse {
  results: Stock[];
  count: number;
}

// Stock calculation types
export interface StockCalculationRequest {
  store?: number;
  product?: number;
  currency?: number;
  purchase_unit?: number;
  supplier?: number;
  date_of_arrived?: string;
  exchange_rate?: number;
  purchase_unit_quantity?: number;
  total_price_in_currency?: number;
  price_per_unit_currency?: number;
}

export interface DynamicField {
  value: number | string | null;
  editable: boolean;
  show: boolean;
  label: string;
}

export interface StockCalculationResponse {
  dynamic_fields: {
    [fieldName: string]: DynamicField;
  };
}

// API endpoints
const STOCK_URL = 'items/stock/';
const STOCK_CALCULATE_URL = 'items/stock/calculate/';

// Stock calculation API function
export const calculateStock = async (data: StockCalculationRequest): Promise<StockCalculationResponse> => {
  const response = await api.post(STOCK_CALCULATE_URL, data);
  return response.data;
};

// Create stock API hooks using the factory function
export const {
  useGetResources: useGetStocks,
  useGetResource: useGetStock,
  useCreateResource: useCreateStock,
  useUpdateResource: useUpdateStock,
  useDeleteResource: useDeleteStock,
} = createResourceApiHooks<Stock, StockResponse>(STOCK_URL, 'stocks');
