import { createResourceApiHooks } from "../helpers/createResourceApi";
import api from "./api";

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
  quantity: number | string;
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
  purchase_unit_quantity?: number | string;
  total_price_in_currency?: number | string;
  price_per_unit_currency?: number | string;
  base_unit_in_uzs?: number | string;
  total_price_in_uz?: number | string;
}

export interface Stock {
  id?: number;
  total_amount?: number;
  total_pure_revenue?: number;
  stock_name?: string | null;
  // New nested object structure from API
  store?: {
    id: number;
    name: string;
  };
  product?: {
    id: number;
    product_name: string;
    base_unit: number;
  };
  currency?: {
    id: number;
    name: string;
    short_name: string;
    is_base: boolean;
  } | null;
  supplier?: {
    id: number;
    name: string;
  };
  purchase_unit?: {
    id: number;
    measurement_name: string;
    short_name: string;
  };
  // New price fields
  quantity?: string | number;
  purchase_unit_quantity?: string;
  price_per_unit_currency?: string;
  total_price_in_currency?: string;
  price_per_unit_uz?: string;
  total_price_in_uz?: string;
  base_unit_in_currency?: string;
  base_unit_in_uzs?: string;
  date_of_arrived?: string;
  // Additional fields used in various pages
  exchange_rate?: number | string;
  selling_price?: number | string;
  min_price?: number | string;
  purchase_price_in_us?: number | string;
  purchase_price_in_uz?: number | string;
  // Debt fields
  is_debt?: boolean;
  amount_of_debt?: number | string;
  advance_of_debt?: number | string;
  // Legacy fields for backward compatibility
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
      };
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
      };
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
    date_of_arrived: Date;
  };
}

// API response type
export interface StockResponse {
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
  // Additional fields that might be calculated
  quantity?: number;
  total_price_in_uz?: number;
  price_per_unit_uz?: number;
  base_unit_in_currency?: number;
  base_unit_in_uzs?: number;
}

export interface DynamicField {
  value: number | string | object | null;
  editable: boolean;
  show: boolean;
  label: string;
}

export interface StockCalculationResponse {
  // Nested objects from API response
  store?: {
    id: number;
    name: string;
  };
  product?: {
    id: number;
    product_name: string;
    base_unit: number;
  };
  currency?: {
    id: number;
    name: string;
    short_name: string;
    is_base: boolean;
  };
  supplier?: {
    id: number;
    name: string;
  };
  purchase_unit?: {
    id: number;
    measurement_name: string;
    short_name: string;
    translations?: any;
    related_model?: any;
  };
  // Dynamic fields containing calculated values
  dynamic_fields: {
    [fieldName: string]: DynamicField;
  };
}

// Bulk stock entry types
export interface StockItemEntry {
  product: number;
  purchase_unit: number;
  currency: number;
  exchange_rate: number;
  quantity: number;
  purchase_unit_quantity: number;
  price_per_unit_uz: number;
  total_price_in_uz: number;
  price_per_unit_currency: number;
  total_price_in_currency: number;
  base_unit_in_uzs?: number;
  base_unit_in_currency?: number;
}

export interface BulkStockEntryRequest {
  store: number;
  supplier: number;
  date_of_arrived: string;
  is_debt?: boolean;
  amount_of_debt?: number;
  advance_of_debt?: number;
  stocks: StockItemEntry[];
}

// Stock Entry types
export interface StockEntry {
  id: number;
  supplier: {
    id: number;
    name: string;
  };
  store: {
    id: number;
    name: string;
  };
  total_amount: string;
  is_debt: boolean;
  stock_count: number;
  amount_of_debt: string | null;
  advance_of_debt: string | null;
  date_of_arrived: string;
}

export interface StockEntryResponse {
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
  results: StockEntry[];
  count: number;
}

// API endpoints
const STOCK_URL = "items/stock/";
const STOCK_CALCULATE_URL = "items/stock/calculate/";
const STOCK_ENTRIES_URL = "items/stock-entries/";

// Stock calculation API function
export const calculateStock = async (
  data: StockCalculationRequest,
): Promise<StockCalculationResponse> => {
  const response = await api.post(STOCK_CALCULATE_URL, data);
  return response.data;
};

// Bulk stock entry API function
export const createBulkStockEntry = async (
  data: BulkStockEntryRequest,
): Promise<any> => {
  const response = await api.post(STOCK_ENTRIES_URL, data);
  return response.data;
};

// Create stock API hooks using the factory function
export const {
  useGetResources: useGetStocks,
  useGetResource: useGetStock,
  useCreateResource: useCreateStock,
  useUpdateResource: useUpdateStock,
  useDeleteResource: useDeleteStock,
} = createResourceApiHooks<Stock, StockResponse>(STOCK_URL, "stocks");

// Fetch stock items by product ID
export const fetchStockByProduct = async (
  productId: number,
  productZero: boolean = false,
): Promise<Stock[]> => {
  try {
    const response = await api.get(
      `${STOCK_URL}?product=${productId}&product_zero=${productZero}`,
    );
    return response.data.results || [];
  } catch (error) {
    console.error("Error fetching stock by product:", error);
    return [];
  }
};

// Create stock entry API hooks
export const {
  useGetResources: useGetStockEntries,
  useGetResource: useGetStockEntry,
} = createResourceApiHooks<StockEntry, StockEntryResponse>(STOCK_ENTRIES_URL, "stock-entries");
