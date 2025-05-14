import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Measurement } from '../api/measurement';
import { useCreateMeasurement } from '../api/measurement';
import { toast } from 'sonner';
import { useGetStores } from '../api/store';

const measurementFields = [
  {
    name: 'measurement_name',
    label: 'Measurement Name',
    type: 'text',
    placeholder: 'Enter measurement name',
    required: true,
  },
  {
    name: 'store_write',
    label: 'Store',
    type: 'select',
    placeholder: 'Select store',
    required: true,
    options: [], // Will be populated with stores
  },
];

export default function CreateMeasurement() {
  const navigate = useNavigate();
  const createMeasurement = useCreateMeasurement();
  const { data: storesData } = useGetStores();

  // Transform stores data into options for the select field
  const stores = Array.isArray(storesData) ? storesData : storesData?.results || [];
  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name,
  }));

  // Update the store_write field options
  const fields = measurementFields.map(field => 
    field.name === 'store_write' 
      ? { ...field, options: storeOptions }
      : field
  );

  const handleSubmit = async (data: Measurement) => {
    try {
      // Convert string values to proper types if needed
      const formattedData = {
        ...data,
        store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write,
      };

      await createMeasurement.mutateAsync(formattedData);
      toast.success('Measurement created successfully');
      navigate('/measurements');
    } catch (error) {
      toast.error('Failed to create measurement');
      console.error('Failed to create measurement:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Measurement>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createMeasurement.isPending}
        title="Create New Measurement"
      />
    </div>
  );
}