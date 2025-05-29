import { createResourceApiHooks } from '../helpers/createResourceApi';
import { useQuery } from '@tanstack/react-query';
import api from './api';

// Types
export interface BaseClient {
  id?: number;
  name: string;
  phone_number: string;
  address: string;
}

export interface IndividualClient extends BaseClient {
  type: 'Физ.лицо';
}

export interface CorporateClient extends BaseClient {
  type: 'Юр.лицо';
  ceo_name: string;
  balance: number;
}

export type Client = IndividualClient | CorporateClient;

export interface ClientHistoryEntry {
  sale: {
    id: number;
    total_amount: string;
    on_credit: boolean;
    sold_date: string;
    store: number;
    sold_by: number;
    client: number;
  };
  previous_balance: string;
  new_balance: string;
  amount_deducted: string;
  timestamp: string;
}

// API endpoints
const CLIENT_URL = 'clients/';

// Create client API hooks using the factory function
export const {
  useGetResources: useGetClients,
  useGetResource: useGetClient,
  useCreateResource: useCreateClient,
  useUpdateResource: useUpdateClient,
  useDeleteResource: useDeleteClient,
} = createResourceApiHooks<Client>(CLIENT_URL, 'clients');

// Client history hook
export const useGetClientHistory = (clientId: number, params?: { sale?: string; start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: ['clientHistory', clientId, params],
    queryFn: async () => {
      const response = await api.get<ClientHistoryEntry[]>(`${CLIENT_URL}${clientId}/history/`, { params });
      return response.data;
    },
    enabled: !!clientId,
  });
};