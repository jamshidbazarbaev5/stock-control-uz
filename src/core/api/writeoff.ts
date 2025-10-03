import { useMutation, useQueryClient } from '@tanstack/react-query';
import api  from './api';

export type WriteOffItem = {
  stock: number;
  quantity: number;
};

export type WriteOff = {
  store: number;
  reason: string;
  notes: string;
  items: WriteOffItem[];
};

export const WRITEOFF_REASONS = {
  'Брак': 'Брак',
  'Просрочено': 'Просрочено',
  'Потеря': 'Потеря',
  'Другое': 'Другое',
} as const;

export const useCreateWriteOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WriteOff) => {
      const response = await api.post('/writeoffs/create', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
    },
  });
};