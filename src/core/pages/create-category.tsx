import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Category } from '../api/category';
import { useCreateCategory } from '../api/category';

const categoryFields = [
  {
    name: 'category_name',
    label: 'Category Name',
    type: 'text',
    placeholder: 'Enter category name',
    required: true,
  },
];

export default function CreateCategory() {
  const navigate = useNavigate();
  const createCategory = useCreateCategory();
  const fields = categoryFields;

  const handleSubmit = async (data: Category) => {
    try {
      await createCategory.mutateAsync(data);
      toast.success('Category created successfully');
      navigate('/categories');
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Failed to create category:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Category>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createCategory.isPending}
        title="Create New Category"
      />
    </div>
  );
}
