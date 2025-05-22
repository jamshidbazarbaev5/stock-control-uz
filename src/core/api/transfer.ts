import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
interface StoreInfo {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  created_at: string;
  is_main: boolean;
  parent_store: number | null;
  owner: number;
}

interface ProductInfo {
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
}

interface StockInfo {
  id: number;
  store_read: StoreInfo;
  product_read: ProductInfo;
  purchase_price_in_uz: number;
  purchase_price_in_us: number;
  selling_price: number;
  min_price: number;
  exchange_rate: number;
  quantity: number;
  history_of_prices?: {
    quantity: number;
    min_price: number;
    exchange_rate: number;
    selling_price: number;
    purchase_price_in_us: number;
    purchase_price_in_uz: number;
  };
  color: string | null;
  supplier_read?: {
    id: number;
    name: string;
    phone_number: string;
  };
}

export interface Transfer {
  id?: number;
  from_stock: number;
  to_stock: number;
  amount: string;
  comment: string;
  date_of_transfer?: string;
  stock?: number | null;
  from_stock_read?: StockInfo;
  to_stock_read?: StoreInfo;
}

// API endpoints
const TRANSFER_URL = 'transfer/';

// Create transfer API hooks using the factory function
export const {
  useGetResources: useGetTransfers,
  useGetResource: useGetTransfer,
  useCreateResource: useCreateTransfer,
  useUpdateResource: useUpdateTransfer,
  useDeleteResource: useDeleteTransfer,
} = createResourceApiHooks<Transfer>(TRANSFER_URL, 'transfers');
