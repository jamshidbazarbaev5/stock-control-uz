import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { User } from '../api/user';
import { useCreateUser } from '../api/user';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function CreateUser() {
  const navigate = useNavigate();
  const createUser = useCreateUser();
  const { t } = useTranslation();

  const userFields = [
    {
      name: 'name',
      label: t('forms.name'),
      type: 'text',
      placeholder: t('placeholders.enter_name'),
      required: true,
    },
    {
      name: 'phone_number',
      label: t('forms.phone'),
      type: 'text',
      placeholder: t('placeholders.enter_phone'),
      required: true,
    },
    {
      name: 'role',
      label: t('forms.role'),
      type: 'select',
      placeholder: t('placeholders.select_role'),
      required: true,
      options: [
        { value: 'Владелец', label: t('roles.owner') },
        { value: 'Администратор', label: t('roles.admin') },
        { value: 'Продавец', label: t('roles.seller') },
      ],
    },
    {
      name: 'password',
      label: t('forms.password'),
      type: 'text',
      placeholder: t('placeholders.enter_password'),
      required: true,
    },
  ];

  const handleSubmit = async (data: User) => {
    try {
      await createUser.mutateAsync(data);
      toast.success(t('messages.success.created', { item: t('navigation.users') }));
      navigate('/users');
    } catch (error) {
      toast.error(t('messages.error.create', { item: t('navigation.users') }));
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<User>
        fields={userFields}
        onSubmit={handleSubmit}
        isSubmitting={createUser.isPending}
        title={t('common.create') + ' ' + t('navigation.users')}
      />
    </div>
  );
}