import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface Debt {
  id?: number;
  remainder: number;
  due_date: string;
  total_amount: string;
  deposit: string;
  is_paid: boolean;
  created_at: string;
  sale: number;
  client: number;
}

export interface DebtPayment {
  id?: number;
  debt: number;
  amount: number;
}

// API endpoints
const DEBT_URL = 'debts/';
const DEBT_PAYMENT_URL = 'debts/:id/payments/';

// Create debt API hooks using the factory function
export const {
  useGetResources: useGetDebts,
  useGetResource: useGetDebt,
  useCreateResource: useCreateDebt,
  useUpdateResource: useUpdateDebt,
  useDeleteResource: useDeleteDebt,
} = createResourceApiHooks<Debt>(DEBT_URL, 'debts');

// Create debt payment API hooks
export const {
  useCreateResource: useCreateDebtPayment,
} = createResourceApiHooks<DebtPayment>(DEBT_PAYMENT_URL, 'debtPayments');