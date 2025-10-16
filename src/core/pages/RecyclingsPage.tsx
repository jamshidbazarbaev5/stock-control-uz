import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ResourceTable } from "../helpers/ResourseTable";
import { toast } from "sonner";
import { useGetRecyclings, useDeleteRecycling } from "../api/recycling";
import { format } from "date-fns";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Input } from "@/components/ui/input";

const columns = (t: any) => [
  {
    header: t("table.from_stock"),
    accessorKey: "from_to_read",
    cell: (row: any) => {
      const fromStore = row.from_to_read?.store?.name;
      const fromProduct = row.from_to_read?.product?.product_name;
      return fromStore && fromProduct ? `${fromProduct} (${fromStore})` : "-";
    },
  },
  {
    header: t("table.spent_amount"),
    accessorKey: "spent_amount",
  },
  {
    header: t("table.outputs"),
    accessorKey: "outputs",
    cell: (row: any) => {
      const outputs = row.outputs || [];
      if (outputs.length === 0) return "-";

      return (
        <div className="space-y-1">
          {outputs.map((output: any, index: number) => {
            const productName = output.to_product_read?.product_name || "-";
            const storeName = output.to_stock_read?.store?.name || "-";
            const amount = output.get_amount || 0;

            return (
              <div key={index} className="text-sm">
                {productName} ({storeName}): {amount}
              </div>
            );
          })}
        </div>
      );
    },
  },
  {
    header: t("table.date"),
    accessorKey: "date_of_recycle",
    cell: (row: any) => {
      const date = row.date_of_recycle;
      return date ? format(new Date(date), "dd/MM/yyyy") : "-";
    },
  },
];

export default function RecyclingsPage() {
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [id, setId] = useState<string>("");

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [id]);

  // Fetch recyclings with pagination
  const { data: recyclingsData, isLoading } = useGetRecyclings({
    params: {
      page,
      id: id || undefined,
    },
  });

  const recyclings = recyclingsData?.results || [];
  const totalCount = recyclingsData?.count || 0;

  const { mutate: deleteRecycling } = useDeleteRecycling();
  const { data: currentUser } = useCurrentUser();
  const handleDelete = (id: number) => {
    deleteRecycling(id, {
      onSuccess: () =>
        toast.success(
          t("messages.success.deleted", { item: t("navigation.recyclings") }),
        ),
      onError: () =>
        toast.error(
          t("messages.error.delete", { item: t("navigation.recyclings") }),
        ),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.recyclings")}</h1>
      </div>
      <Input
        value={id}
        onChange={(e) => setId(String(e.target.value))}
        placeholder={t("table.id")}
      />

      <ResourceTable
        data={recyclings}
        columns={columns(t)}
        isLoading={isLoading}
        onDelete={currentUser?.is_superuser ? handleDelete : undefined}
        pageSize={30}
        totalCount={totalCount}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  );
}
