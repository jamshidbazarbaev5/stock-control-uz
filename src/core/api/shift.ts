import api from './api';

export interface Register {
  id: number;
  store: number;
  name: string;
  is_active: boolean;
  last_opened_at: string | null;
  last_closing_cash: number;
}

export interface Shift {
  id: number;
  store: number;
  register: Register;
  cashier: number;
  opened_at: string;
  closed_at: string | null;
  opening_cash: string;
  closing_cash: string | null;
  comment: string;
  is_active: boolean;
}

export interface OpenShiftData {
  store: number;
  register_id: number;
  opening_cash: string;
  comment?: string;
}

export interface ShiftCreateData {
  store: number;
  register: number;
  cashier: number;
  opened_at: string;
  opening_cash: string;
  comment?: string;
}

export interface ShiftUpdateData extends Partial<ShiftCreateData> {
  closed_at?: string;
  closing_cash?: string;
  is_active?: boolean;
}

const BASE_URL = 'pos/shifts/';
const OPEN_SHIFT_URL = 'api/v1/pos/shifts/open/';

export const shiftsApi = {
  getAll: () => api.get<Shift[]>(BASE_URL),
  getById: (id: number) => api.get<Shift>(`${BASE_URL}${id}/`),
  create: (data: ShiftCreateData) => api.post<Shift>(BASE_URL, data),
  update: (id: number, data: ShiftUpdateData) => api.patch<Shift>(`${BASE_URL}${id}/`, data),
  delete: (id: number) => api.delete(`${BASE_URL}${id}/`),
  openShift: (data: OpenShiftData) => api.post<Shift>(OPEN_SHIFT_URL, data),
};