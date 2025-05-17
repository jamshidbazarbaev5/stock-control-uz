import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { Supplier } from '../api/supplier';
import { useCreateSupplier } from '../api/supplier';
import { toast } from 'sonner';

const supplierFields = [
  {
    name: 'name',
    label: 'Supplier Name',
    type: 'text',
    placeholder: 'Enter supplier name',
    required: true,
  },
  {
    name: 'phone_number',
    label: 'Phone Number',
    type: 'text',
    placeholder: '+998 XX XXX XX XX',
    required: true,
  },
];

export default function CreateSupplier() {
  const navigate = useNavigate();
  const createSupplier = useCreateSupplier();

  const handleSubmit = async (data: Supplier) => {
    try {
      await createSupplier.mutateAsync(data);
      toast.success('Supplier created successfully');
      navigate('/suppliers');
    } catch (error) {
      toast.error('Failed to create supplier');
      console.error('Failed to create supplier:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Supplier>
        fields={supplierFields}
        onSubmit={handleSubmit}
        isSubmitting={createSupplier.isPending}
        title="Create New Supplier"
      />
    </div>
  );
}