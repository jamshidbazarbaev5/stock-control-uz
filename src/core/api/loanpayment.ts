import { createResourceApiHooks } from '../helpers/createResourceApi';

export interface LoanPayment {
  id?: number;
  loan: number;
  amount: string;
  notes: string;
  payment_method: string;
  paid_at: string;
}

const LOAN_PAYMENT_URL = 'loans/payments/';

export const {
  useGetResources: useGetLoanPayments,
  useGetResource: useGetLoanPayment,
  useCreateResource: useCreateLoanPayment,
  useUpdateResource: useUpdateLoanPayment,
  useDeleteResource: useDeleteLoanPayment,
} = createResourceApiHooks<LoanPayment>(LOAN_PAYMENT_URL, 'loanpayments');
