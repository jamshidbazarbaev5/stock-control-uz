import api from '../api/api'
import { useQuery } from '@tanstack/react-query'

export interface Sponsor {
  id?: number;
  name: string;
  phone_number: string;
}

export async function fetchSponsors(): Promise<Sponsor[]> {
  const response = await api.get('/sponsors');
  return response.data;
}

export async function createSponsor(data: Omit<Sponsor, 'id'>): Promise<Sponsor> {
  const response = await api.post('/sponsors/', data);
  return response.data;
}

export async function updateSponsor(id: number, data: Omit<Sponsor, 'id'>): Promise<Sponsor> {
  const response = await api.put(`/sponsors/${id}/`, data);
  return response.data;
}

export async function deleteSponsor(id: number): Promise<void> {
  await api.delete(`/sponsors/${id}/`);
}

export function useGetSponsors(options?: any) {
  return useQuery({
    queryKey: ['sponsors'],
    queryFn: fetchSponsors,
    ...options,
  });
}
