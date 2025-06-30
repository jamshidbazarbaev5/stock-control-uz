import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface LoanSponsor {
  id?: number;
  sponsor_write: number; // sponsor id
  total_amount: number;
  currency: string;
  due_date: string;
  sponsor_read?: {
    id: number;
    name: string;
    phone_number?: string;
  };
  is_paid?: boolean;
  created_at?: string;
  remainder?: number;
}

// API endpoints
const LOANSPONSOR_URL = '/loans/';

export const {
  useGetResources: useGetLoanSponsors,
  useGetResource: useGetLoanSponsor,
  useCreateResource: useCreateLoanSponsor,
  useUpdateResource: useUpdateLoanSponsor,
  useDeleteResource: useDeleteLoanSponsor,
} = createResourceApiHooks<LoanSponsor>(LOANSPONSOR_URL, 'loansponsors');
