import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { getAccessToken } from '../api/auth';

export interface CurrentUser {
  id: number;
  name: string;
  phone_number: string;
  role: string;
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    budget: string;
    created_at: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<CurrentUser | null> => {
      const token = getAccessToken();
      if (!token) return null;

      const response = await api.get('users/me');
      return response.data;
    },
    retry: false
  });
}