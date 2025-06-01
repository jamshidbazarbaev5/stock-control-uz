import api from './api';

export interface ProductProfitabilityResponse {
  product_name: string;
  revenue: string;
  cost: string;
  profit: string;
  margin: number;
}

export interface UnsoldProductsResponse {
  product_name: string;
}

export interface SalesSummaryResponse {
  total_sales: number;
  total_revenue: number;
  trend: {
    day: string;
    total: number;
  }[];
}

export interface TopProductsResponse {
  product_name: string;
  total_quantity: string;
  total_revenue: string;
}

export interface StockByCategoryResponse {
  category: string;
  total_stock: string;
}

export interface ProductIntakeResponse {
  total_positions: number;
  total_sum: number;
  data: {
    day: string;
    total_price: number;
    total_quantity: number;
  }[];
}

export interface ClientDebtResponse {
  client_name: string;
  total_debt: string;
  total_paid: string;
  remaining_debt: string;
  deposit: string;
}

export interface TopSellersResponse {
  store_name: string;
  seller_name: string | null;
  seller_phone: string | null;
  total_revenue: number;
  total_sales: number;
}

type PeriodType = 'day' | 'week' | 'month';

export const getReportsSalesSummary = async (period?: PeriodType): Promise<SalesSummaryResponse> => {
  const params = period ? { period } : {};
  const response = await api.get<SalesSummaryResponse>('reports/sales-summary', { params });
  return response.data;
};

export const getTopProducts = async (period?: PeriodType, limit?: number): Promise<TopProductsResponse[]> => {
  const params: Record<string, string | number> = {};
  
  if (period) params.period = period;
  if (limit) params.limit = limit;
  
  const response = await api.get<TopProductsResponse[]>('reports/top-products', { params });
  return response.data;
};

export const getStockByCategory = async (): Promise<StockByCategoryResponse[]> => {
  const response = await api.get<StockByCategoryResponse[]>('reports/stock-by-category');
  return response.data;
};

export const getProductIntake = async (period?: PeriodType): Promise<ProductIntakeResponse> => {
  const params = period ? { period } : {};
  const response = await api.get<ProductIntakeResponse>('reports/product-intake', { params });
  return response.data;
};

export const getClientDebts = async (): Promise<ClientDebtResponse[]> => {
  const response = await api.get<ClientDebtResponse[]>('reports/client-debts');
  return response.data;
};

export const getUnsoldProducts = async (): Promise<UnsoldProductsResponse[]> => {
  const response = await api.get<UnsoldProductsResponse[]>('reports/unsold-products');
  return response.data;
};

export const getProductProfitability = async (): Promise<ProductProfitabilityResponse[]> => {
  const response = await api.get<ProductProfitabilityResponse[]>('reports/product-profitability');
  return response.data;
};

export const getTopSellers = async (period?: PeriodType): Promise<TopSellersResponse[]> => {
  const params = period ? { period } : {};
  const response = await api.get<TopSellersResponse[]>('reports/top-sellers', { params });
  return response.data;
};
