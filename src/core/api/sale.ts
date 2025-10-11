import { createResourceApiHooks } from "../helpers/createResourceApi";
import { useQuery } from "@tanstack/react-query";
import api from "./api";

// Types
export interface SaleDebt {
  client: number;
  due_date: string;
  deposit?: string;
  client_read?: {
    id: number;
    name: string;
    phone_number: string;
    address: string;
  };
}

export interface SaleItem {
  stock_read?: any;
  price_per_unit?: string;
  id?: number;
  stock_write?: number;
  product_read?: {
    id: number;
    product_name: string;
    barcode: string;
    ikpu: string;
    category_read?: {
      id: number;
      category_name: string;
    };
    base_unit?: number;
    measurement?: Array<{
      id: number;
      from_unit?: {
        id: number;
        measurement_name: string;
        short_name: string;
      };
      to_unit?: {
        id: number;
        measurement_name: string;
        short_name: string;
      };
      number: string;
    }>;
    available_units?: Array<{
      id: number;
      short_name: string;
      factor: number;
      is_base: boolean;
    }>;
  };
  selling_unit?: number;
  selling_method?: "Штук" | "Ед.измерения";
  quantity: string;
  subtotal?: string;
}

export interface Sale {
  id?: number;

  store?: number;
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
  payment_method: string;
  sale_items: SaleItem[];
  on_credit: boolean;
  is_paid?: boolean;
  sale_debt?: SaleDebt;
  total_amount: string;
  total_pure_revenue?: string;
  sale_payments?:
    | {
        payment_method: string;
        amount: string;
      }[]
    | undefined;
  client?: number;
  created_at?: string;
  sold_date?: string;
  worker_read?: any;
}

// API endpoints
const SALE_CREATE_URL = "sales/create/";
const SALE_LIST_URL = "sales/";

// Create hooks for write operations (create, update, delete)
const {
  useCreateResource: useCreateSale,
  useUpdateResource: useUpdateSale,
  useDeleteResource: useDeleteSale,
} = createResourceApiHooks<Sale>(SALE_CREATE_URL, "sales");

// Custom GET hooks using the correct /sales/ endpoint
export const useGetSales = (options?: { params?: Record<string, any> }) => {
  return useQuery({
    queryKey: ["sales", options?.params],
    queryFn: async () => {
      const response = await api.get<
        Sale[] | { results: Sale[]; count: number }
      >(SALE_LIST_URL, { params: options?.params });
      return response.data;
    },
  });
};

export const useGetSale = (id: number) => {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: async () => {
      const response = await api.get<Sale>(`${SALE_LIST_URL}${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export { useCreateSale, useUpdateSale, useDeleteSale };
