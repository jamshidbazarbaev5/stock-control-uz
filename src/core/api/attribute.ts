import type { Attribute, CreateAttributeDto, UpdateAttributeDto } from '@/types/attribute';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

const ATTRIBUTES_URL = 'items/attributes/';

export const attributeApi = {
  getAll: async () => {
    const response = await api.get<Attribute[]>(ATTRIBUTES_URL);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Attribute>(`${ATTRIBUTES_URL}${id}/`);
    return response.data;
  },

  create: async (data: CreateAttributeDto) => {
    const response = await api.post<Attribute>(ATTRIBUTES_URL, data);
    return response.data;
  },

  update: async (id: number, data: UpdateAttributeDto) => {
    const response = await api.patch<Attribute>(`${ATTRIBUTES_URL}${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`${ATTRIBUTES_URL}${id}/`);
  },
};

// React Query hooks
export const useGetAttributes = () => {
  return useQuery({
    queryKey: ['attributes'],
    queryFn: attributeApi.getAll,
  });
};

export const useGetAttribute = (id: number) => {
  return useQuery({
    queryKey: ['attributes', id],
    queryFn: () => attributeApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attributeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });
};

export const useUpdateAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAttributeDto }) =>
      attributeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });
};

export const useDeleteAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attributeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });
};