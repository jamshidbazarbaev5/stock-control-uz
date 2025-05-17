import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface Supplier {
  id?: number;
  name: string;
  phone_number: string;
}

// API endpoints
const SUPPLIER_URL = 'suppliers/';

// Create supplier API hooks using the factory function
export const {
  useGetResources: useGetSuppliers,
  useGetResource: useGetSupplier,
  useCreateResource: useCreateSupplier,
  useUpdateResource: useUpdateSupplier,
  useDeleteResource: useDeleteSupplier,
} = createResourceApiHooks<Supplier>(SUPPLIER_URL, 'suppliers');