import { useState } from "react";
import { WriteOffDialog } from "../components/dialogs/WriteOffDialog";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";
import { toast } from "sonner";
import type { Stock } from "../api/stock";
import type { Store } from "../api/store";
import type { Supplier } from "../api/supplier";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useGetStocks, useDeleteStock } from "../api/stock";
import { useGetStores } from "../api/store";
import { useGetSuppliers } from "../api/supplier";
import { ResourceTable } from "../helpers/ResourseTable";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type PaginatedData<T> = { results: T[]; count: number } | T[];

export default function StocksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  // Removed selectedStock state - using dedicated edit page instead
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<Stock | null>(null);
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productName, setProductName] = useState<string>(""); // New state for product name
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [productZero, setProductZero] = useState(false); // Show zero arrivals filter
  const pageSize = 30;
  const [productId, setProductId] = useState<string>("");
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  // Columns definition
  const [selectedStocks, setSelectedStocks] = useState<number[]>([]);

  const columns = [
    {
      header: t("table.select"),
      accessorKey: "select",
      cell: (stock: any) => {
        return (
          <input
            type="checkbox"
            checked={stock?.id ? selectedStocks.includes(stock?.id) : false}
            onChange={(e) => {
              e.stopPropagation();
              if (stock?.id) {
                setSelectedStocks((prev) =>
                  prev.includes(stock.id)
                    ? prev.filter((id) => id !== stock.id)
                    : [...prev, stock.id],
                );
              }
            }}
            className="w-4 h-4"
          />
        );
      },
    },
    {
      header: t("table.id"),
      accessorKey: "stock_id",
      cell: (row: Stock) => row.id,
    },
    {
      header: t("table.product"),
      accessorKey: "product",
      cell: (row: Stock) =>
        row.product?.product_name || row.product_read?.product_name || "-",
    },
    {
      header: t("table.store"),
      accessorKey: "store",
      cell: (row: any) => row.store?.name || row.store_read?.name || "-",
    },
    {
      header: "Поставщик",
      accessorKey: "supplier",
      cell: (row: Stock) =>
        row.supplier?.name || row.supplier_read?.name || "-",
    },
    {
      header: "Валюта",
      accessorKey: "currency",
      cell: (row: Stock) =>
        row.currency ? `${row.currency.short_name}` : "UZS",
    },
    {
      header: "Единица закупки",
      accessorKey: "purchase_unit",
      cell: (row: Stock) => row.purchase_unit?.short_name || "-",
    },
    {
      header: "Цена за единицу (валюта)",
      accessorKey: "price_per_unit_currency",
      cell: (row: Stock) =>
        row.price_per_unit_currency
          ? `${row.price_per_unit_currency} ${row.currency?.short_name || "UZS"}`
          : "-",
    },
    {
      header: "Общая цена (валюта)",
      accessorKey: "total_price_in_currency",
      cell: (row: Stock) =>
        row.total_price_in_currency
          ? `${row.total_price_in_currency} ${row.currency?.short_name || "UZS"}`
          : "-",
    },
    {
      header: "Цена за единицу (UZS)",
      accessorKey: "price_per_unit_uz",
      cell: (row: Stock) =>
        row.price_per_unit_uz
          ? `${Number(row.price_per_unit_uz).toLocaleString()} UZS`
          : "-",
    },
    {
      header: "Общая цена (UZS)",
      accessorKey: "total_price_in_uz",
      cell: (row: Stock) =>
        row.total_price_in_uz
          ? `${Number(row.total_price_in_uz).toLocaleString()} UZS`
          : "-",
    },
    {
      header: t("table.date_of_arrived"),
      accessorKey: "date",
      cell: (row: any) => <p>{formatDate(row.date_of_arrived)}</p>,
    },
    {
      header: "Количество (базовая единица)",
      accessorKey: "quantity",
      cell: (row: any) =>
        row.quantity !== undefined && row.quantity !== null
          ? `${Number(row.quantity).toFixed(2)}`
          : "-",
    },
    {
      header: "Количество (единица закупки)",
      accessorKey: "purchase_unit_quantity",
      cell: (row: Stock) =>
        row.purchase_unit_quantity
          ? `${Number(row.purchase_unit_quantity).toFixed(2)} ${row.purchase_unit?.short_name || ""}`
          : "-",
    },
    {
      header: t("table.actions"),
      accessorKey: "actions",
      cell: (row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/stocks/${row.id}/history`)}
            >
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v5h5" />
                  <path d="M3 3l6.1 6.1" />
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                {t("navigation.history")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              {t("common.edit")}
            </DropdownMenuItem>
            {/* Only show remove if superuser */}
            {currentUser?.is_superuser ? (
              <DropdownMenuItem
                onClick={() => {
                  setStockToDelete(row);
                  setDeleteModalOpen(true);
                }}
              >
                {t("common.remove")}
              </DropdownMenuItem>
            ) : null}

            {currentUser?.role?.toLowerCase() !== "продавец" && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    navigate(
                      `/create-transfer?fromProductId=${row.product?.id || row.product_read?.id}&fromStockId=${row.id}`,
                    )
                  }
                >
                  {t("common.create")} {t("navigation.transfer")}
                </DropdownMenuItem>
                {(row.product_read?.has_recycling ||
                  row.product?.has_recycling) && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        `/create-recycling?fromProductId=${row.product?.id || row.product_read?.id}&fromStockId=${row.id}&storeId=${row.store?.id || row.store_read?.id}`,
                      )
                    }
                  >
                    {t("common.create")} {t("navigation.recycling")}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Removed stockFields - using dedicated create/edit pages instead

  const { data: stocksData, isLoading } = useGetStocks({
    params: {
      product_name: productName || undefined, // Send as product_name
      supplier: selectedSupplier === "all" ? undefined : selectedSupplier,
      date_of_arrived_gte: dateFrom || undefined,
      date_of_arrived_lte: dateTo || undefined,
      page: currentPage,
      product_zero: productZero, // Add product_zero param
      store: selectedStore === "all" ? undefined : selectedStore, // Add store filter
      id: productId,
    },
  });

  // Get the stocks array from the paginated response
  const stocks = stocksData?.results || [];

  // Fetch stores and suppliers for the filter dropdowns
  const { data: storesData } = useGetStores({});
  const { data: suppliersData } = useGetSuppliers({});

  // Extract data from paginated responses
  const getPaginatedData = <T extends { id?: number }>(
    data: PaginatedData<T> | undefined,
  ): T[] => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.results;
  };

  const stores = getPaginatedData<Store>(storesData);
  const suppliers = getPaginatedData<Supplier>(suppliersData);

  // Mutations
  const deleteStock = useDeleteStock();

  // Removed fields configuration - using dedicated edit page instead

  // Handlers
  const handleEdit = (stock: Stock) => {
    navigate(`/edit-stock/${stock.id}`);
  };

  // Removed inline edit functionality - use dedicated edit page instead

  const handleDelete = async (id: number) => {
    try {
      await deleteStock.mutateAsync(id);
      toast.success(
        t("messages.success.deleted", { item: t("table.product") }),
      );
      setDeleteModalOpen(false);
      setStockToDelete(null);
    } catch (error) {
      toast.error(t("messages.error.delete", { item: t("table.product") }));
      console.error("Failed to delete stock:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.stocks")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWriteOffDialogOpen(true)}>
            {t("common.create")} {t("navigation.writeoff")}
          </Button>
          <Button onClick={() => navigate("/create-stock")}>
            {t("common.create")}{" "}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        {/* Removed store selection dropdown */}
        <Input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder={t("forms.type_product_id")}
        />{" "}
        <Input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder={t("forms.type_product_name")}
        />
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger>
            <SelectValue placeholder={t("forms.select_supplier")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("forms.all_suppliers")}</SelectItem>
            {suppliers?.map((supplier: Supplier) =>
              supplier.id ? (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </SelectItem>
              ) : null,
            ) || null}
          </SelectContent>
        </Select>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger>
            <SelectValue placeholder={t("forms.select_store")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("forms.all_stores")}</SelectItem>
            {stores?.map((store: Store) =>
              store.id ? (
                <SelectItem key={store.id} value={store.id.toString()}>
                  {store.name}
                </SelectItem>
              ) : null,
            ) || null}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder={t("forms.from_date")}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder={t("forms.to_date")}
        />
        <Select
          value={productZero ? "true" : "false"}
          onValueChange={(val) => setProductZero(val === "true")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Показать нулевые приходы?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">ненулевые приходы</SelectItem>
            <SelectItem value="true">показать нулевые приходы</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ResourceTable
        data={stocks}
        columns={columns}
        isLoading={isLoading}
        // onEdit={handleEdit}
        // onDelete={currentUser?.is_superuser ? handleDelete : undefined}
        pageSize={pageSize}
        totalCount={stocksData?.count || 0}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Inline edit dialog removed - use dedicated edit page instead */}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setStockToDelete(null);
        }}
        onConfirm={() =>
          stockToDelete?.id !== undefined && handleDelete(stockToDelete.id)
        }
        title={t("common.delete") + " " + t("table.product")}
        // description={t('messages.confirm.delete', { item: t('table.product') })}
      />

      <WriteOffDialog
        open={writeOffDialogOpen}
        onClose={() => {
          setWriteOffDialogOpen(false);
          setSelectedStocks([]);
        }}
        selectedStocks={selectedStocks}
        stocksData={stocksData}
      />
    </div>
  );
}
