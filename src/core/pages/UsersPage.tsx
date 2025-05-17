import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '../helpers/ResourseTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type User, useGetUsers, useUpdateUser, useDeleteUser } from '../api/user';

const userFields = [
  {
    name: 'name',
    label: 'ФИО',
    type: 'text',
    placeholder: 'Введите ФИО',
    required: true,
  },
  {
    name: 'phone_number',
    label: 'Номер телефона',
    type: 'text',
    placeholder: '+998 XX XXX XX XX',
    required: true,
  },
  {
    name: 'role',
    label: 'Роль',
    type: 'select',
    placeholder: 'Выберите роль пользователя',
    required: true,
    options: [
      { value: 'Владелец', label: 'Владелец' },
      { value: 'Администратор', label: 'Администратор' },
      { value: 'Продавец', label: 'Продавец' },
    ],
  },
  {
    name: 'password',
    label: 'Password',
    type: 'text',
    placeholder: 'Enter password',
  },
];

const columns = [
  // {
  //   header: '№',
  //   accessorKey: 'displayId',
  // },
  {
    header: 'ФИО',
    accessorKey: 'name',
  },
  {
    header: 'Телефон',
    accessorKey: 'phone_number',
  },
  {
    header: 'Роль',
    accessorKey: 'role',
  },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: usersData, isLoading } = useGetUsers({
    params: {
      page: page,
      page_size: 10,
      ordering: '-created_at',
    },
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
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id, {
        onSuccess: () => toast.success('User successfully deleted'),
        onError: () => toast.error('Failed to delete user'),
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={users}
        columns={columns}
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
            fields={userFields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingUser || {}}
            isSubmitting={isUpdating}
            title="Edit User"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
