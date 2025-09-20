import api from './api';

export interface LoanTotalsByCurrency {
  currency: string;
  total_loan: number;
  total_paid: number;
  total_unpaid: number;
}

export const fetchLoanTotalsByCurrency = async (sponsorId: number): Promise<LoanTotalsByCurrency[]> => {
  const { data } = await api.get(`/sponsors/${sponsorId}/loans/totals-by-currency`);
  return data;
};
