import { createResourceApiHooks } from '../helpers/createResourceApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Types
export interface Debt {
  id?: number;
  sale_read: {
    id: number;
    store_read: {
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
    on_credit: boolean;
    sale_items: Array<{
      id: number;
      stock_read: {
        id: number;
        product_read: {
          id: number;
          product_name: string;
          category_read: {
            id: number;
            category_name: string;
          };
        };
        quantity: number;
        selling_price: number;
      };
      quantity: string;
      selling_method: string;
      subtotal: string;
    }>;
    total_amount: string;
  };
  client_read: {
    id: number;
    type: string;
    name: string;
    phone_number: string;
    address: string;
    ceo_name?: string;
    balance?: string;
  };
  due_date: string;
  total_amount: string;
  deposit: string;
  is_paid: boolean;
  created_at: string;
  remainder: number;
}

export interface DebtPayment {
  id?: number;
  debt: number;
  amount: number;
  paid_at?: string;
  payment_method: string;
}

// API endpoints
const DEBT_URL = 'debts/';

// Create debt API hooks using the factory function
export const {
  useGetResources: useGetDebts,
  useGetResource: useGetDebt,
  useCreateResource: useCreateDebt,
  useUpdateResource: useUpdateDebt,
  useDeleteResource: useDeleteDebt,
} = createResourceApiHooks<Debt>(DEBT_URL, 'debts');

// Create debt payment API hooks
export const useCreateDebtPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: DebtPayment) => {
      const response = await api.post<DebtPayment>(`debts/${payment.debt}/payments/`, payment);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtPayments'] });
    },
  });
};

export const useGetDebtPayments = (debtId: string | number) => {
  return useQuery({
    queryKey: ['debtPayments', debtId],
    queryFn: async () => {
      const response = await api.get<DebtPayment[]>(`debts/${debtId}/payments/`);
      return response.data;
    },
  });
};