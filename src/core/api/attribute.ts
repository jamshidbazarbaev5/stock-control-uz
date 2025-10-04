import type { Attribute, CreateAttributeDto, UpdateAttributeDto } from '@/types/attribute';
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