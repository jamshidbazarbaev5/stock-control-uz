import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./api";

// Types
export interface StockDebtPayment {
  id?: number;
  stock: number;
  amount: number;
  comment?: string;
  paid_at?: string;
  worker_read?: {
    id: number;
    name: string;
  };
}

export interface StockDebtPaymentRequest {
  stock: number;
  amount: number;
  comment?: string;
}

export interface StockDebtPaymentResponse {
  id: number;
  stock: number;
  amount: string;
  comment: string;
  paid_at: string;
  worker_read: {
    id: number;
    name: string;
    phone_number: string;
    role: string;
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
    is_superuser: boolean;
  };
}

// API endpoints
const STOCK_DEBT_PAYMENT_URL = "stock_debt_payment/";

// Create stock debt payment API hooks
export const useCreateStockDebtPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: StockDebtPaymentRequest) => {
      const response = await api.post<StockDebtPaymentResponse>(
        `${STOCK_DEBT_PAYMENT_URL}pay/`,
        payment,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["stockDebtPayments"] });
    },
  });
};

// Get stock debt payments for a specific stock
export const useGetStockDebtPayments = (stockId: number) => {
  return useQuery({
    queryKey: ["stockDebtPayments", stockId],
    queryFn: async () => {
      const { data } = await api.get<StockDebtPaymentResponse[] | { results: StockDebtPaymentResponse[] }>(
        `${STOCK_DEBT_PAYMENT_URL}?stock=${stockId}`,
      );
      return Array.isArray(data) ? data : data.results || [];
    },
    enabled: !!stockId,
  });
};

// Direct API function for making stock debt payments
export const payStockDebt = async (payment: StockDebtPaymentRequest): Promise<StockDebtPaymentResponse> => {
  const response = await api.post<StockDebtPaymentResponse>(
    `${STOCK_DEBT_PAYMENT_URL}pay/`,
    payment,
  );
  return response.data;
};
