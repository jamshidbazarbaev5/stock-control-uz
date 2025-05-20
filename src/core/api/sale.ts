import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
interface SaleDebt {
  client: number;
  due_date: string;
  client_read?: {
    id: number;
    name: string;
    phone_number: string;
    address: string;
  };
}

interface SaleItem {
  stock: number;
  selling_method: 'Штук' | 'Ед.измерения';
  quantity: number;
}

export interface Sale {
  id?: number;
  store: number;
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
  payment_method: string;
  sale_items: SaleItem[];
  on_credit: boolean;
  sale_debt?: SaleDebt;
  created_at?: string;
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