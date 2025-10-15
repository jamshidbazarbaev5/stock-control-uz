import { useTranslation } from "react-i18next";
import { ResourceTable } from "../helpers/ResourseTable";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "../api/api";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetStores } from "../api/store";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "@/components/ui/button";

interface ProductStockBalance {
  product__product_name: string;
  store__name: string;
  total_quantity: number;
}

interface StockBalanceResponse {
  count: number;
  total: number;
  total_volume: number;
  total_pages: number;
  current_page: number;
  page_range: number[];
  links: {
    first: string | null;
    last: string | null;
    next: string | null;
    previous: string | null;
  };
  page_size: number;
  results: {
    total_product: number;
    total: number;
    info_products: ProductStockBalance[];
    total_volume: number;
  };
}

export default function ProductStockBalancePage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [showZeroStock, setShowZeroStock] = useState<"true" | "false">("false");

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStore, showZeroStock]);

  const { data: storesData } = useGetStores({});
  const stores = Array.isArray(storesData)
    ? storesData
    : storesData?.results || [];
  const { data: currentUser } = useCurrentUser();
  const { data, isLoading } = useQuery<StockBalanceResponse>({
    queryKey: ["stockBalance", currentPage, selectedStore, showZeroStock],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
      });
      if (selectedStore !== "all") {
        params.append("store", selectedStore);
      }
      params.append("product_zero", showZeroStock);
      const response = await api.get(
        `/dashboard/item_dashboard/?${params.toString()}`,
      );
      return response.data;
    },
  });

  const columns = [
    {
      header: t("table.product"),
      accessorKey: "product__product_name",
    },
    {
      header: t("table.store"),
      accessorKey: "store__name",
    },
    {
      header: t("table.quantity"),
      accessorKey: "total_quantity",
      cell: (row: any) => row.total_quantity?.toLocaleString(),
    },
    {
      header: t("table.total_kub_volume"),
      accessorKey: "total_kub_volume",
      cell: (row: any) => {
        const kub =
          typeof row?.total_kub === "number"
            ? row.total_kub.toFixed(2).replace(".", ",")
            : null;
        const kubVol =
          typeof row?.total_kub_volume === "number"
            ? row.total_kub_volume.toFixed(2).replace(".", ",")
            : null;
        if (kub && kubVol) return `${kub} / ${kubVol}`;
        if (kub) return kub;
        if (kubVol) return kubVol;
        return "0,00";
      },
    },
  ];

  // Change handler to ensure correct type
  const handleShowZeroStockChange = (value: string) => {
    setShowZeroStock(value === "true" ? "true" : "false");
  };

  // Add Excel export handler
  const handleExportExcel = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
    });
    if (selectedStore !== "all") {
      params.append("store", selectedStore);
    }
    params.append("product_zero", showZeroStock);
    try {
      const response = await api.get(
        `/dashboard/excel_export/?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "stock_balance.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      // Optionally show error to user
      alert("Ошибка при экспорте Excel");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">{t("navigation.stock_balance")}</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {currentUser?.is_superuser && (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder={t("forms.select_store")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("forms.all_stores")}</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id?.toString() || ""}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={showZeroStock}
            onValueChange={handleShowZeroStockChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Показать нулевые остатки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Показать нулевые остатки</SelectItem>
              <SelectItem value="false">
                Не показывать нулевые остатки
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">
            {t("table.total_volume")}
            {/* Show as 135,37 if value exists */}
            {typeof data?.results.total === "number" && (
              <span> {data.results.total.toFixed(2).replace(".", ",")}</span>
            )}
          </h1>
          <Button onClick={handleExportExcel} variant="outline">
            {t("buttons.export_excel", "Экспорт в Excel")}
          </Button>
        </div>
      </div>
      <Card className="mt-4">
        <ResourceTable
          data={data?.results.info_products || []}
          columns={columns}
          isLoading={isLoading}
          pageSize={30}
          totalCount={data?.count || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
