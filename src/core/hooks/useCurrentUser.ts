import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { getAccessToken } from '../api/auth';
import { decodeToken } from '../helpers/jwt';

export interface CurrentUser {
  id: number;
  name: string;
  phone_number: string;
  role: string;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<CurrentUser | null> => {
      const token = getAccessToken();
      if (!token) return null;

      const decoded = decodeToken(token);
      if (!decoded?.user_id) return null;

      const response = await api.get(`users/${decoded.user_id}/`);
      return response.data;
    },
    retry: false
  });
}