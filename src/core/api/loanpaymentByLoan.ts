// Fetch payments for a loan (for use outside React hooks)
export async function fetchLoanPaymentsByLoan(sponsorId: string, loanId: string) {
  if (!sponsorId || !loanId) return [];
  try {
    const res = await api.get(`/sponsors/${sponsorId}/loans/${loanId}/payments/`);
    if (res.status !== 200) return [];
    return res.data;
  } catch (error) {
    return [];
  }
}
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

export function useGetLoanPaymentsByLoan(sponsorId?: string, loanId?: string) {
  return useQuery<LoanPayment[]>({
    queryKey: ['loanPayments', sponsorId, loanId],
    queryFn: async () => {
      if (!sponsorId || !loanId) return [];
      const res = await api.get(`/sponsors/${sponsorId}/loans/${loanId}/payments/`);
      if (res.status !== 200) throw new Error('Failed to fetch payments');
      return res.data;
    },
    enabled: !!sponsorId && !!loanId,
  });
}
