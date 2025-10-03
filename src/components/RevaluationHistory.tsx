import React from "react";
import { useRevaluationHistory } from "../core/api/revaluation";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { ResourceTable } from "../core/helpers/ResourseTable";

interface RevaluationProduct {
  product: number;
  product_name: string;
  old_selling_price: string;
  old_min_price: string;
}

interface Revaluation {
  id: number;
  created_at: string;
  comment: string;
  new_selling_price: string;
  new_min_price: string;
  revaluation_products: RevaluationProduct[];
}

export const RevaluationHistory: React.FC = () => {
  const { data: revaluations, isLoading } = useRevaluationHistory();
  const { t } = useTranslation();

  const columns = [
    {
      header: t("date"),
      accessorKey: "created_at",
      cell: (row: Revaluation) => format(new Date(row.created_at), "dd.MM.yyyy HH:mm"),
    },
    {
      header: t("comment"),
      accessorKey: "comment",
    },
    {
      header: t("new_selling_price"),
      accessorKey: "new_selling_price",
    },
    {
      header: t("new_min_price"),
      accessorKey: "new_min_price",
    },
    {
      header: t("products"),
      accessorKey: "revaluation_products",
      cell: (row: Revaluation) => (
        <div className="space-y-1">
          {row.revaluation_products.map((product: RevaluationProduct) => (
            <div key={product.product} className="text-sm">
              <div>{product.product_name}</div>
              <div className="text-muted-foreground">
                {t("old_selling_price")}: {product.old_selling_price}
              </div>
              <div className="text-muted-foreground">
                {t("old_min_price")}: {product.old_min_price}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <ResourceTable
        data={revaluations || []}
        columns={columns}
        isLoading={isLoading}
        pageSize={10}
        totalCount={revaluations?.length || 0}
      />
    </div>
  );
};