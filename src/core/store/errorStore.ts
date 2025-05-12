import { create } from 'zustand';

interface ErrorState {
  isOpen: boolean;
  message: string | null;
  setError: (message: string | null) => void;
  clearError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  isOpen: false,
  message: null,
  setError: (message: string | null) => set({ isOpen: !!message, message }),
  clearError: () => set({ isOpen: false, message: null }),
}));