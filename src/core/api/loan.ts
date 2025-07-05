import api from './api';

export interface Loan {
  id: number;
  sponsor_read: {
    id: number;
    name: string;
    phone_number: string;
  };
  is_paid: boolean;
  total_amount: string;
  currency: string;
  created_at: string;
  due_date: string;
  remainder: string;
  overpayment_unused: string;
}

export async function createLoan(sponsorId: number, data: { total_amount: number; currency: string; due_date: string; sponsor_write: number }) {
  const response = await api.post(`/sponsors/${sponsorId}/loans/`, data);
  return response.data;
}

export async function fetchLoans(sponsorId: number, currency: string): Promise<Loan[]> {
  const response = await api.get(`/sponsors/${sponsorId}/loans`, { params: { currency } });
  return response.data.results;
}
