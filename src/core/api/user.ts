import { createResourceApiHooks } from '../helpers/createResourceApi'

// Types
export interface User {
  id?: number;
  name: string;
  phone_number: string;
  role: string;
  password?: string;
  is_active: boolean;
  store_write?: number | null;
}

// API endpoints
const USER_URL = 'users/';

// Create user API hooks using the factory function
export const {
  useGetResources: useGetUsers,
  useGetResource: useGetUser,
  useCreateResource: useCreateUser,
  useUpdateResource: useUpdateUser,
  useDeleteResource: useDeleteUser,
} = createResourceApiHooks<User>(USER_URL, 'users');
