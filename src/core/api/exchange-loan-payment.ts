import { createResourceApiHooks } from '../helpers/createResourceApi';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

// Types
export interface ExchangeLoanPayment {
  id?: number;
  amount: string | number;
  notes?: string;
  paid_at?: string;
}

export interface CreateExchangeLoanPaymentDTO {
  amount: number;
  notes?: string;
}

// API endpoints
const EXCHANGE_LOAN_PAYMENT_URL = 'exchange-loans/';

// Custom hooks for exchange loan payments
export const useGetExchangeLoanPayments = (loanId: number) => {
  return useQuery({
    queryKey: ['exchange-loan-payments', loanId],
    queryFn: async () => {
      const response = await api.get<ExchangeLoanPayment[]>(`${EXCHANGE_LOAN_PAYMENT_URL}${loanId}/payments`);
      return response.data;
    },
    enabled: !!loanId,
  });
};

export const useCreateExchangeLoanPayment = (loanId: number) => {
  const { useCreateResource } = createResourceApiHooks<ExchangeLoanPayment>(`${EXCHANGE_LOAN_PAYMENT_URL}${loanId}/payments/create/`, 'exchange-loan-payments');
  return useCreateResource();
};
