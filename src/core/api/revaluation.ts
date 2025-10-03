import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./api";

interface RevaluationProduct {
  product: number;
  product_name: string;
  old_selling_price: string;
  old_min_price: string;
}

interface RevaluationHistoryItem {
  id: number;
  created_at: string;
  comment: string;
  new_selling_price: string;
  new_min_price: string;
  revaluation_products: RevaluationProduct[];
}

interface RevaluationData {
  comment: string;
  new_selling_price: string;
  new_min_price: string;
  product_ids: number[];
}

export const useProductRevaluation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RevaluationData) =>
      api.post("revaluation/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["revaluation-history"] });
    },
  });
};

export const useRevaluationHistory = () => {
  return useQuery<RevaluationHistoryItem[]>({
    queryKey: ["revaluation-history"],
    queryFn: () => api.get("revaluation/").then((res) => res.data),
  });
};