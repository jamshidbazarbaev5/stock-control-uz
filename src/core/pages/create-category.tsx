import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import type { Category } from '../api/category';
import { useCreateCategory } from '../api/category';
import { useTranslation } from 'react-i18next';

const categoryFields = [
  {
    name: 'category_name',
    label: 'forms.category_name',
    type: 'text',
    placeholder: 'placeholders.enter_name',
    required: true,
  },
];

export default function CreateCategory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createCategory = useCreateCategory();
  const fields = categoryFields;

  const handleSubmit = async (data: Category) => {
    try {
      await createCategory.mutateAsync(data);
      toast.success(t('messages.success.created', { item: t('navigation.categories') }));
      navigate('/categories');
    } catch (error) {
      toast.error(t('messages.error.create', { item: t('navigation.categories') }));
      console.error('Failed to create category:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<Category>
        fields={fields.map(field => ({
          ...field,
          label: t(field.label),
          placeholder: t(field.placeholder)
        }))}
        onSubmit={handleSubmit}
        isSubmitting={createCategory.isPending}
        title={t('common.create')}
      />
    </div>
  );
}
