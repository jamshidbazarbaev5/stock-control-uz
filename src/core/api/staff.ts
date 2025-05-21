import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface Staff {
  id?: number;
  is_active: boolean;
  date_joined: string;
  store: number;
  user: number;
  user_write?:string | number;
  store_write?:number,
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
  user_read?: {
    id: number;
    name: string;
    phone_number: string;
    role: string;
  };
}

// API endpoints
const STAFF_URL = 'personel/staff/';

// Create staff API hooks using the factory function
export const {
  useGetResources: useGetStaffs,
  useGetResource: useGetStaff,
  useCreateResource: useCreateStaff,
  useUpdateResource: useUpdateStaff,
  useDeleteResource: useDeleteStaff,
} = createResourceApiHooks<Staff>(STAFF_URL, 'staffs');
