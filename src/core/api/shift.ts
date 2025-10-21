import api from "./api";

export interface Store {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  budget: string;
  created_at: string;
  is_main: boolean;
  color: string;
  parent_store: number | null;
}

export interface Cashier {
  id: number;
  name: string;
  phone_number: string;
  role: string;
}

export interface Register {
  id: number;
  store: Store;
  name: string;
  is_active: boolean;
  last_opened_at: string | null;
  last_closing_cash: number;
}

export interface Payment {
  id: number;
  payment_method: string;
  income: string;
  expense: string;
  expected: string;
  actual: string;
}

export interface Shift {
  id: number;
  store: Store;
  register: Register;
  cashier: Cashier;
  total_expected: string;
  total_actual: string;
  total_sales_amount: number;
  total_debt_amount: number;
  total_sales_count: number;
  total_returns_amount: number;
  total_returns_count: number;
  total_income: number;
  total_expense: number;
  opened_at: string;
  closed_at: string | null;
  opening_cash: string;
  closing_cash: string | null;
  opening_comment: string | null;
  closing_comment: string | null;
  approval_comment: string | null;
  is_active: boolean;
  is_awaiting_approval: boolean;
  is_approved: boolean;
  approved_by: number | null;
  payments: Payment[];
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
  opening_comment?: string;
}

export interface ShiftUpdateData extends Partial<ShiftCreateData> {
  closed_at?: string;
  closing_cash?: string;
  opening_comment?: string;
  closing_comment?: string;
  approval_comment?: string;
  total_expected?: string;
  total_actual?: string;
  is_active?: boolean;
  is_awaiting_approval?: boolean;
  is_approved?: boolean;
  approved_by?: number;
  payments?: Payment[];
}

export interface ShiftSummaryPayment {
  payment_method: string;
  payment_method_display: string;
  income: number;
  expense: number;
  expected: number;
  actual: number;
}

export interface ShiftSummary {
  shift_id: number;
  total_debt_amount: number;
  cashier: string | null;
  store: string;
  opened_at: string;
  payments: ShiftSummaryPayment[];
  total_expected: number;
  total_sales_amount: number;
  total_sales_count: number;
  total_returns_amount: number;
  total_returns_count: number;
  total_income: number;
  total_expense: number;
}

export interface CloseShiftPayment {
  payment_method: string;
  actual: number;
}

export interface CloseShiftData {
  payments: CloseShiftPayment[];
  closing_cash: number;
  closing_comment: string;
}

// API response type
export interface ShiftResponse {
  results: Shift[];
  count: number;
  links: {
    first: string | null;
    last: string | null;
    next: string | null;
    previous: string | null;
  };
  total_pages: number;
  current_page: number;
  page_range: number[];
  page_size: number;
}
const BASE_URL = "pos/shifts/";
const OPEN_SHIFT_URL = "pos/shifts/open/";

export const shiftsApi = {
  getAll: (params?: {
    store?: number;
    register?: number;
    cashier?: number;
    approved_by?: number;
    is_active?: boolean;
    is_approved?: boolean;
    is_awaiting_approval?: boolean;
  }) => api.get<ShiftResponse>(BASE_URL, { params }),
  getById: (id: number) => api.get<Shift>(`${BASE_URL}${id}/`),
  create: (data: ShiftCreateData) => api.post<Shift>(BASE_URL, data),
  update: (id: number, data: ShiftUpdateData) =>
    api.patch<Shift>(`${BASE_URL}${id}/`, data),
  delete: (id: number) => api.delete(`${BASE_URL}${id}/`),
  openShift: (data: {
    opening_cash: string;
    opening_comment: string;
    store: number;
    register_id: number;
  }) => api.post<Shift>(OPEN_SHIFT_URL, data),
  getSummary: (id: number) =>
    api.get<ShiftSummary>(`${BASE_URL}${id}/summary/`),
  closeShift: (id: number, data: CloseShiftData) =>
    api.post<Shift>(`${BASE_URL}${id}/close/`, data),
};
