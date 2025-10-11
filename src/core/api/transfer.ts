import { createResourceApiHooks } from "../helpers/createResourceApi";

// Types
interface StoreInfo {
  id: number;
  name: string;
  address?: string;
  phone_number?: string;
  budget?: string;
  created_at: string;
  is_main: boolean;
  color?: string;
  parent_store: number | null;
}

interface ProductInfo {
  id: number;
  product_name: string;
  base_unit: number;
}

interface CurrencyInfo {
  id: number;
  name: string;
  short_name: string;
  is_base: boolean;
}

interface SupplierInfo {
  id: number;
  name: string;
}

interface PurchaseUnitInfo {
  id: number;
  measurement_name: string;
  short_name: string;
}

interface StockInfo {
  id: number;
  store: StoreInfo;
  product: ProductInfo;
  currency: CurrencyInfo;
  supplier: SupplierInfo | null;
  purchase_unit: PurchaseUnitInfo;
  quantity: string;
  purchase_unit_quantity: string;
  price_per_unit_currency: string;
  total_price_in_currency: string;
  price_per_unit_uz: string;
  total_price_in_uz: string;
  base_unit_in_currency: string;
  base_unit_in_uzs: string;
  date_of_arrived: string;
}

export interface Transfer {
  id?: number;
  from_stock: StockInfo | number;
  to_store: StoreInfo | number;
  to_stock: number;
  amount: string;
  comment: string;
  date_of_transfer?: string;
}

// API endpoints
const TRANSFER_URL = "transfer/";

// Create transfer API hooks using the factory function
export const {
  useGetResources: useGetTransfers,
  useGetResource: useGetTransfer,
  useCreateResource: useCreateTransfer,
  useUpdateResource: useUpdateTransfer,
  useDeleteResource: useDeleteTransfer,
} = createResourceApiHooks<Transfer>(TRANSFER_URL, "transfers");
