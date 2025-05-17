import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Measurement } from '../api/measurement';
import { useGetMeasurements, useDeleteMeasurement, useUpdateMeasurement } from '../api/measurement';
import { useGetStores } from '../api/store';
import { ResourceTable } from '../helpers/ResourseTable';
import { t } from 'i18next';

const columns = [
  // {
  //   header: '№',
  //   accessorKey: 'id',
  // },
  {
    header: t('forms.measurement_name'),
    accessorKey: 'measurement_name',
  },
  
];

const measurementFields = [
  {
    name: 'measurement_name',
    label: t('forms.measurement_name'),
    type: 'text',
    placeholder: t('placeholders.enter_measurement_name'),
    required: true,
  },
  
];

interface PaginatedResponse {
  links: {
    first: string | null;
    last: string | null;
    next: string | null;
    previous: string | null;
  };
  total_pages: number;
  current_page: number;
  page_range: number[];
  page_size: number;
  results: Measurement[];
  count: number;
}

export default function MeasurementsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const { data: measurementsData, isLoading } = useGetMeasurements();
  const { data: storesData } = useGetStores();
  const deleteMeasurement = useDeleteMeasurement();
  const { mutate: updateMeasurement, isPending: isUpdating } = useUpdateMeasurement();

  // Transform data for the table, handling the paginated response
  const measurements = (measurementsData as PaginatedResponse)?.results || [];

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

  const handleCreate = () => {
    navigate('/measurements/create');
  };

  const handleEdit = (measurement: Measurement) => {
    // Map the store_read data to store_write for the form
    const measurementWithStore = {
      ...measurement,
      store_write: measurement.store_read?.id || measurement.store_write
    } as Measurement;
    setEditingMeasurement(measurementWithStore);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Measurement>) => {
    if (!editingMeasurement?.id) return;

    const formattedData = {
      ...data,
      id: editingMeasurement.id,
      store_write: typeof data.store_write === 'string' ? parseInt(data.store_write, 10) : data.store_write,
      measurement_name: data.measurement_name || editingMeasurement.measurement_name
    };

    updateMeasurement(
      formattedData as Measurement,
      {
        onSuccess: () => {
          toast.success('Measurement successfully updated');
          setIsFormOpen(false);
          setEditingMeasurement(null);
        },
        onError: () => toast.error('Failed to update measurement'),
      }
    );
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this measurement?')) {
      try {
        await deleteMeasurement.mutateAsync(id);
        toast.success('Measurement deleted successfully');
      } catch (error) {
        toast.error('Failed to delete measurement');
        console.error('Failed to delete measurement:', error);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Measurements</h1>
        <Button onClick={handleCreate}>Create New Measurement</Button>
      </div>

      <ResourceTable<Measurement>
        data={measurements}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingMeasurement || undefined}
            isSubmitting={isUpdating}
            title="Edit Measurement"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}