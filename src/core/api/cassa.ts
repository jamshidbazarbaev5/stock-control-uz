import { createResourceApiHooks } from '../helpers/createResourceApi'

// Types
export interface Cassa {
    id?:number;
    name: string;
}

// API endpoints
const CASSA_URL
    = 'pos/cash-registers/';

// Create category API hooks using the factory function
export const {
    useGetResources: useGetCassas,
    useGetResource: useGetCassa,
    useCreateResource: useCreateCassa,
    useUpdateResource: useUpdateCassa,
    useDeleteResource: useDeleteCassa,
} = createResourceApiHooks<Cassa>(CASSA_URL, 'cassa');
