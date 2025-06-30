import api from './api';

export interface PayLoanPayload {
  amount: number;
  loan: number;
  notes?: string;
  payment_method: string;
}

export async function payLoan(loanId: number, payload: PayLoanPayload) {
  const res = await api.post(`/loans/${loanId}/payments/`, payload);
  return res.data;
}
