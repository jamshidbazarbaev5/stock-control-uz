import { useNavigate } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import type { User } from '../api/user';
import { useCreateUser as useCreateUser } from '../api/user';

const userFields = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter full name',
    required: true,
  },
  {
    name: 'phone_number',
    label: 'Phone Number',
    type: 'text',
    placeholder: '+998 XX XXX XX XX',
    required: true,
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    placeholder: 'Select user role',
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
    required: true,
  },
];

export default function CreateUser() {
  const navigate = useNavigate();
  const createUser = useCreateUser();

  const handleSubmit = async (data: User) => {
    try {
      await createUser.mutateAsync(data);
      // Redirect to users list after successful creation
      navigate('/users');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<User>
        fields={userFields}
        onSubmit={handleSubmit}
        isSubmitting={createUser.isPending}
        title="Create New User"
      />
    </div>
  );
}