import { createResourceApiHooks } from '../helpers/createResourceApi'

// Types
export interface User {
  id?: number;
  name: string;
    phone_number: string;
    role: string;
    password: string;
}

// API endpoints
const USER_URL = 'personel/users/';

// Create user API hooks using the factory function
export const {
  useGetResources: useGetUsers,
  useGetResource: useGetUser,
  useCreateResource: useCreateUser,
  useUpdateResource: useUpdateUser,
  useDeleteResource: useDeleteUser,
} = createResourceApiHooks<User>(USER_URL, 'users');
