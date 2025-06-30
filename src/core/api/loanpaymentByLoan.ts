import { useQuery } from '@tanstack/react-query';
import api from './api';

export interface LoanPayment {
  id: number;
  loan: number;
  amount: string;
  notes: string;
  payment_method: string;
  paid_at: string;
}

export function useGetLoanPaymentsByLoan(loanId?: string) {
  return useQuery<LoanPayment[]>({
    queryKey: ['loanPayments', loanId],
    queryFn: async () => {
      if (!loanId) return [];
      const res = await api.get(`/loans/${loanId}/payments`);
      if (res.status !== 200) throw new Error('Failed to fetch payments');
      return await res.data
    },
    enabled: !!loanId,
  });
}
