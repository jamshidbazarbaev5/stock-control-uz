import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

export const useGetWriteoffs = () => {
  return useQuery({
    queryKey: ['writeoffs'],
    queryFn: async () => {
      const response = await api.get('/writeoffs/');
      return response.data;
    },
  });
};

export const useGetWriteoff = (id: number) => {
  return useQuery({
    queryKey: ['writeoffs', id],
    queryFn: async () => {
      const response = await api.get(`/writeoffs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateWriteOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WriteOff) => {
      const response = await api.post('/writeoffs/create/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['writeoffs'] });
    },
  });
};
