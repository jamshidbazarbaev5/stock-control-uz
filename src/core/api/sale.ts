import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
interface SaleDebt {
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

interface SaleItem {
  id?: number;
  stock_write: number;
  stock_read?: {
    id: number;
    product_read?: {
      id: number;
      product_name: string;
      category_read?: {
        id: number;
        category_name: string;
      };
      measurement?: Array<{
        id: number;
        measurement_read?: {
          id: number;
          measurement_name: string;
        };
        number: string;
        for_sale: boolean;
      }>;
    };
  };
  selling_method: 'Штук' | 'Ед.измерения';
  quantity: string;
  
  subtotal: string;
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
  sale_payments?: {
    payment_method: string;
    amount: string;
  }[] | undefined;
  client?: number;
  created_at?: string;
  sold_date?: string;
  worker_read?:any
}

// API endpoints
const SALE_URL = 'sales/';

// Create sale API hooks using the factory function
export const {
  useGetResources: useGetSales,
  useGetResource: useGetSale,
  useCreateResource: useCreateSale,
  useUpdateResource: useUpdateSale,
  useDeleteResource: useDeleteSale,
} = createResourceApiHooks<Sale>(SALE_URL, 'sales');