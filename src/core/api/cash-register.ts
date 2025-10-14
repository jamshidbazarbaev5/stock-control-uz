import api from "./api";
import type { Register } from "./shift";
import { useQuery } from "@tanstack/react-query";

const BASE_URL = "pos/cash-registers/";

interface CashRegisterResponse {
  results: Register[];
  count: number;
}

export const cashRegisterApi = {
  getAll: () => api.get<CashRegisterResponse>(BASE_URL),
  getById: (id: number) => api.get<Register>(`${BASE_URL}${id}/`),
};

export const useGetCashRegisters = () => {
  return useQuery({
    queryKey: ["cash-registers"],
    queryFn: async () => {
      const response = await cashRegisterApi.getAll();
      return response.data;
    },
  });
};
