import api from './api';
import type { Register } from './shift';

const BASE_URL = 'pos/cash-registers/';

export const cashRegisterApi = {
  getAll: () => api.get<Register[]>(BASE_URL),
  getById: (id: number) => api.get<Register>(`${BASE_URL}${id}/`),
};