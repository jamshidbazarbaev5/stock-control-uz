import { createResourceApiHooks } from '../helpers/createResourceApi'

// Types
export interface LabelSize {
  id?: number;
  width: number;
  height: number;
}

// API endpoints
const LABEL_SIZE_URL = 'items/labelSize/';

// Create label size API hooks using the factory function
export const {
  useGetResources: useGetLabelSizes,
  useGetResource: useGetLabelSize,
  useCreateResource: useCreateLabelSize,
  useUpdateResource: useUpdateLabelSize,
  useDeleteResource: useDeleteLabelSize,
} = createResourceApiHooks<LabelSize>(LABEL_SIZE_URL, 'labelSizes');
