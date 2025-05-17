import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface Transfer {
  id?: number;
  from_stock: number;
  to_stock: number;
  amount: string;
  comment: string;
}

// API endpoints
const TRANSFER_URL = 'transfer/';

// Create transfer API hooks using the factory function
export const {
  useGetResources: useGetTransfers,
  useGetResource: useGetTransfer,
  useCreateResource: useCreateTransfer,
  useUpdateResource: useUpdateTransfer,
  useDeleteResource: useDeleteTransfer,
} = createResourceApiHooks<Transfer>(TRANSFER_URL, 'transfers');
