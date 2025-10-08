import { createResourceApiHooks } from '../helpers/createResourceApi';

// Types
export interface Measurement {
  id?: number;
  measurement_name: string;
  short_name?: string;
  store_write: number;
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    created_at: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
}

// API endpoints
const MEASUREMENT_URL = 'items/measurement/';

// Create measurement API hooks using the factory function
export const {
  useGetResources: useGetMeasurements,
  useGetResource: useGetMeasurement,
  useCreateResource: useCreateMeasurement,
  useUpdateResource: useUpdateMeasurement,
  useDeleteResource: useDeleteMeasurement,
} = createResourceApiHooks<Measurement>(MEASUREMENT_URL, 'measurements');