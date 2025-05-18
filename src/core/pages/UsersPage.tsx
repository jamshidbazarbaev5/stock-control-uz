import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type User, useGetUsers, useUpdateUser, useDeleteUser } from '../api/user';
import { useTranslation } from 'react-i18next';

const userFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.fio'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
  {
    name: 'phone_number',
    label: t('forms.phone_number'),
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
      { value: t('roles.owner'), label: t('roles.owner') },
      { value: t('roles.admin'), label: t('roles.admin') },
      { value: t('roles.seller'), label: t('roles.seller') },
    ],
  },
  {
    name: 'password',
    label: t('forms.password'),
    type: 'text',
    placeholder: t('placeholders.enter_password'),
  },
];

const columns = (t: any) => [
  // {
  //   header: '№',
  //   accessorKey: 'displayId',
  // },
  {
    header: t('forms.fio'),
    accessorKey: 'name',
  },
  {
    header: t('forms.phone_number'),
    accessorKey: 'phone_number',
  },
  {
    header: t('forms.role'),
    accessorKey: 'role',
  },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
const { t } = useTranslation();

  const { data: usersData, isLoading } = useGetUsers({
   
  });

  // Handle both array and object response formats
  const results = Array.isArray(usersData) ? usersData : usersData?.results || [];
  const totalCount = Array.isArray(usersData) ? usersData.length : usersData?.count || 0;

  const users = results.map((user, index) => ({
    ...user,
    displayId: (page - 1) * 10 + index + 1,
  }));

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<User>) => {
    if (!editingUser?.id) return;

    updateUser(
      { ...data, id: editingUser.id } as User,
      {
        onSuccess: () => {
          toast.success('User successfully updated');
          setIsFormOpen(false);
          setEditingUser(null);
        },
        onError: () => toast.error('Failed to update user'),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteUser(id, {
      onSuccess: () => toast.success('User successfully deleted'),
      onError: () => toast.error('Failed to delete user'),
    });
  };

  return (
    <div className="container mx-auto py-6">
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.users')}</h1>
        {/* <Button onClick={() => navigate('/create-recycling')}>
          {t('common.create')} {t('navigation.recyclings')}
        </Button> */}
      </div>
      <ResourceTable
        data={users}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-user')}
        totalCount={totalCount}
        pageSize={10}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={userFields(t)}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingUser || {}}
            isSubmitting={isUpdating}
            title={t('common.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
