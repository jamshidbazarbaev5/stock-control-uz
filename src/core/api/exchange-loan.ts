import { createResourceApiHooks } from '../helpers/createResourceApi';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

// Types
export interface ExchangeLoan {
  id?: number;
  total_amount: string | number;
  remaining_balance?: string | number;
  currency_rate: string | number;
  deposit_amount: string | number;
  due_date: string;
  notes?: string;
  is_paid?: boolean;
  created_at?: string;
  store?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    budget: string;
    created_at: string;
    is_main: boolean;
    color: string;
    parent_store: number | null;
  };
  currency?: {
    id: number;
    name: string;
    short_name: string;
    is_base: boolean;
  };
}

export interface CreateExchangeLoanDTO {
  total_amount: number;
  store: number;
  currency: number;
  currency_rate: number;
  deposit_amount: number;
  due_date: string;
  notes?: string;
}

// API endpoints
const EXCHANGE_LOAN_URL = 'exchange-loans/';
const EXCHANGE_LOAN_CREATE_URL = 'exchange-loans/create/';

// Create exchange loan API hooks using the factory function
export const {
  useGetResources: useGetExchangeLoans,
  useGetResource: useGetExchangeLoanWithSlash, // Keep original with slash
  useUpdateResource: useUpdateExchangeLoan,
  useDeleteResource: useDeleteExchangeLoan,
} = createResourceApiHooks<ExchangeLoan>(EXCHANGE_LOAN_URL, 'exchange-loans');

// Custom hook for getting single exchange loan without trailing slash
export const useGetExchangeLoan = (id: number) => {
  return useQuery({
    queryKey: ['exchange-loans', id],
    queryFn: async () => {
      const response = await api.get<ExchangeLoan>(`${EXCHANGE_LOAN_URL}${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Custom create hook using the correct create endpoint
export const useCreateExchangeLoan = () => {
  const { useCreateResource } = createResourceApiHooks<ExchangeLoan>(EXCHANGE_LOAN_CREATE_URL, 'exchange-loans');
  return useCreateResource();
};

// Custom hook for getting individual exchange loan from the list
export const useGetExchangeLoanCustom = (id: number) => {
  return useQuery({
    queryKey: ['exchange-loan', id],
    queryFn: async () => {
      // Get all loans and find the one with matching ID
      const response = await api.get<ExchangeLoan[] | { results: ExchangeLoan[], count: number }>(EXCHANGE_LOAN_URL);
      const loans = Array.isArray(response.data) ? response.data : response.data?.results || [];
      const loan = loans.find((loan: ExchangeLoan) => loan.id === id);
      if (!loan) {
        throw new Error('Exchange loan not found');
      }
      return loan;
    },
    enabled: !!id,
  });
};
