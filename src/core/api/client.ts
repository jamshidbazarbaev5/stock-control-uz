import { createResourceApiHooks } from '../helpers/createResourceApi';

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