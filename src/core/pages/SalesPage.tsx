import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceTable } from "../helpers/ResourseTable";
import { type Sale, useGetSales, useDeleteSale } from "../api/sale";
// import { useGetProducts } from '../api/product';
import { toast } from "sonner";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  SmartphoneNfc,
  Landmark,
} from "lucide-react";
import { type Store, useGetStores } from "@/core/api/store.ts";
import "../../expanded-row-dark.css";

type PaginatedData<T> = { results: T[]; count: number } | T[];
export default function SalesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const { data: currentUser } = useCurrentUser();
  // const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  // const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Set initial states
  const [_selectedProduct, setSelectedProduct] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [creditStatus, setCreditStatus] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [productName, setProductName] = useState<string>("");

  const { data: storesData } = useGetStores({});
  const { data: salesData, isLoading } = useGetSales({
    params: {
      page,
      // product: selectedProduct !== "all" ? selectedProduct : undefined,
      store: selectedStore === "all" ? undefined : selectedStore,
      start_date: startDate || undefined,
      product: productName || undefined, // Send as product_name
      end_date: endDate || undefined,
      on_credit: creditStatus !== "all" ? creditStatus === "true" : undefined,
    },
  });
  const getPaginatedData = <T extends { id?: number }>(
    data: PaginatedData<T> | undefined
  ): T[] => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.results;
  };
  // const { data: productsData } = useGetProducts({});
  // const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
  const stores = getPaginatedData<Store>(storesData);
  const deleteSale = useDeleteSale();

  // Get sales array and total count
  const sales = Array.isArray(salesData) ? salesData : salesData?.results || [];
  const totalCount = Array.isArray(salesData)
    ? sales.length
    : salesData?.count || 0;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("ru-RU").format(Number(amount));
  };

  // const formatDate = (dateString: string) => {
  //   try {
  //     const date = new Date(dateString);
  //     return date.toLocaleDateString('ru-RU', {
  //       year: 'numeric',
  //       month: '2-digit',
  //       day: '2-digit',
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     });
  //   } catch (error) {
  //     return '-';
  //   }
  // };

  const handleDelete = async (id: number) => {
    // Find the sale to be deleted
    const saleToDelete = sales.find((sale: any) => sale.id === id);
    if (!saleToDelete) {
      toast.error(t("messages.error.delete", { item: t("navigation.sales") }));
      return;
    }
    // Get the store budget and sale total_amount
    // Some store_read objects may not have budget, so fallback to 0 if missing
    const storeBudget = Number((saleToDelete.store_read && 'budget' in saleToDelete.store_read) ? (saleToDelete.store_read as any).budget : 0);
    const saleAmount = Number(saleToDelete.total_amount ?? 0);
    // If deleting would make budget negative, show error
    if (storeBudget - saleAmount < 0) {
      toast.error(t("messages.error.delete_budget_negative", { item: t("navigation.sales") }) || "Cannot delete: store budget would be negative.");
      return;
    }
    try {
      await deleteSale.mutateAsync(id);
      toast.success(
        t("messages.success.deleted", { item: t("navigation.sales") })
      );
      // setIsDetailsModalOpen(false);
    } catch (error) {
      toast.error(t("messages.error.delete", { item: t("navigation.sales") }));
      console.error("Failed to delete sale:", error);
    }
  };

  const handleClearFilters = () => {
    setSelectedProduct("all");
    setStartDate("");
    setEndDate("");
    setCreditStatus("all");
    setPage(1);
  };

  const handleRowClick = (row: Sale) => {
    if (row.id === expandedRowId) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(row.id || null);
    }
  };

  const renderExpandedRow = (row: Sale) => {
    if (!row.sale_items?.length)
      return (
        <div className="p-4 text-center text-gray-500">
          {t("messages.no_items_found")}
        </div>
      );

    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          {t("common.sale_items")}
          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {row.sale_items.length}
          </span>
        </h3>
        <div className="space-y-3">
          {row.sale_items.map((item, index) => (
            <div
              key={index}
              className=" dark:bg-expanded-row-dark p-4 rounded-lg transition-all duration-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    {t("table.product")}
                  </span>
                  <span
                    className="font-medium line-clamp-2"
                    title={item.stock_read?.product_read?.product_name || "-"}
                  >
                    {item.stock_read?.product_read?.product_name || "-"}
                  </span>
                  {item.stock_read?.product_read?.category_read && (
                    <span className="text-xs text-gray-500">
                      {item.stock_read.product_read.category_read.category_name}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    {t("table.quantity")}
                  </span>
                  <span className="font-medium">
                    {(item.stock_read?.product_read as any)?.has_metr
                      ? `${item.quantity} метр`
                      : (item.stock_read?.product_read as any)?.has_shtuk
                      ? `${item.quantity} штук`
                      : `${item.quantity} ${
                          item.selling_method === "Штук"
                            ? t("table.pieces")
                            : item.stock_read?.product_read?.measurement?.find(
                                (m: {
                                  for_sale: boolean;
                                  measurement_read?: {
                                    measurement_name: string;
                                  };
                                }) => m.for_sale
                              )?.measurement_read?.measurement_name || ""
                        }`}
                  </span>
                </div>
                {/* <div>
                  <span className="text-sm text-gray-500 block mb-1">{t('table.price')}</span>
                  <span className="font-medium">
                    {formatCurrency(Number(item.subtotal) / Number(item.quantity))} 
                  </span>
                </div> */}
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    {t("forms.amount4")}
                  </span>
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(item.subtotal)} UZS
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const columns = [
    {
      header: t("table.store"),
      accessorKey: "store_read",
      cell: (row: Sale) => row.store_read?.name || "-",
    },
    {
      header: t("table.payment_method"),
      accessorKey: "sale_payments",
      cell: (row: any) => (
        <div className="flex flex-col items-center gap-1">
          {row.sale_payments.map((payment: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-1 text-xs justify-center"
            >
              {payment.payment_method === "Наличные" && (
                <Wallet className="h-4 w-4 text-green-600" />
              )}
              {payment.payment_method === "Карта" && (
                <CreditCard className="h-4 w-4 text-blue-600" />
              )}
              {payment.payment_method === "Click" && (
                <SmartphoneNfc className="h-4 w-4 text-purple-600" />
              )}
              {payment.payment_method === "Перечисление" && (
                <Landmark className="h-4 w-4 text-orange-500" />
              )}{" "}
              {/* New method */}
              <span className="whitespace-nowrap">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: t("table.items"),
      accessorKey: "sale_items",
      cell: (row: Sale) => {
        if (!row.sale_items?.length) return "-";
        const itemsText = row.sale_items
          .map((item) => {
            const product = item.stock_read?.product_read?.product_name || "-";
            return `${product}`;
          })
          .join(" • ");
        return (
          <div className="max-w-[300px]">
            <p className="text-sm truncate" title={itemsText}>
              {itemsText}
            </p>
          </div>
        );
      },
    },
    {
      header: t("table.quantity"),
      accessorKey: "quantity",
      cell: (row: Sale) => {
        if (!row.sale_items?.length) return "-";
        const quantities = row.sale_items
          .map((item) => {
            const product = item.stock_read?.product_read as any;
            if (product?.has_metr) {
              return `${item.quantity} метр`;
            } else if (product?.has_shtuk) {
              return `${item.quantity} штук`;
            } else {
              let measurement =
                item.selling_method === "Штук"
                  ? t("table.pieces")
                  : product?.measurement?.find(
                      (m: {
                        for_sale: boolean;
                        measurement_read?: { measurement_name: string };
                      }) => m.for_sale
                    )?.measurement_read?.measurement_name || "";
              return `${item.quantity} ${measurement}`;
            }
          })
          .join(" • ");
        return (
          <div className="max-w-[200px]">
            <p className="text-sm truncate" title={quantities}>
              {quantities}
            </p>
          </div>
        );
      },
    },
    {
      header: t("table.total_amount"),
      accessorKey: "total_amount",
      cell: (row: Sale) => (
        <span className="font-medium text-emerald-600">
          {formatCurrency(row.total_amount)}
        </span>
      ),
    },
    // Show for all superusers OR if role is Администратор
    ...(currentUser?.is_superuser || currentUser?.role === "Администратор"
      ? [
          {
            header: t("table.total_pure_revenue"),
            accessorKey: "total_pure_revenue",
            cell: (row: Sale) => (
              <span className="font-medium text-emerald-600">
                {formatCurrency(row.total_pure_revenue || "0")}
              </span>
            ),
          },
        ]
      : []),
    {
      header: t("table.status"),
      accessorKey: "on_credit",
      cell: (row: Sale) => (
        <div className="flex flex-col gap-1">
          {row.is_paid ? (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <CheckCircle2 className="h-3 w-3" />
              {t("common.paid")}
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                row.on_credit
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {row.on_credit ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              {row.on_credit ? t("common.on_credit") : t("common.paid2")}
            </div>
          )}
        </div>
      ),
    },

    {
      header: t("table.sold_date"),
      accessorKey: "sold_date",
      cell: (row: Sale) => (
        <div className="whitespace-nowrap">
          {row.sold_date
            ? new Date(row.sold_date).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </div>
      ),
    },
    // {
    //   header: t('common.actions'),
    //   accessorKey: 'actions',
    //   cell: (row: Sale) => (
    //     <div className="flex items-center gap-2">
    //       <Button
    //         variant="outline"
    //         size="sm"
    //         onClick={() => {
    //           setSelectedSale(row);
    //           setIsDetailsModalOpen(true);
    //         }}
    //       >
    //         {t('common.details')}
    //       </Button>
    //     </div>
    //   ),
    // }
  ];

  // Fetch all products with pagination

  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-8 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">
          {t("navigation.sales")}
        </h1>
        <Button
          onClick={() => navigate("/create-sale")}
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
        >
          {t("common.create")}
        </Button>
      </div>

      {/* Filters */}
      {/* <Card className="p-3 sm:p-4 mb-4 sm:mb-6"> */}
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-medium">
          {t("common.filters")}
        </h2>
        <Button variant="outline" size="sm" onClick={handleClearFilters}>
          {t("common.reset") || "Сбросить"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("forms.type_product_name")}
          </label>
          <Input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t("forms.type_product_name")}
            className="w-full"
          />
        </div>
        {currentUser?.is_superuser && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("forms.select_store")}
            </label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("forms.select_store")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("forms.all_stores")}</SelectItem>
                {stores?.map((store: Store) =>
                  store.id ? (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ) : null
                ) || null}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("forms.start_date")}</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("forms.end_date")}</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("table.credit_status")}
          </label>
          <Select value={creditStatus} onValueChange={setCreditStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("placeholders.select_status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="true">{t("common.on_credit")}</SelectItem>
              <SelectItem value="false">{t("common.paid2")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* </Card> */}

      {/* Table */}
      <div className="overflow-hidden rounded-lg mb-4 sm:mb-6">
        <Card className="overflow-x-auto">
          <div className="min-w-[800px]">
            <ResourceTable
              data={sales}
              columns={columns}
              isLoading={isLoading}
              onDelete={
                currentUser?.role === "Продавец" ? undefined : handleDelete
              }
              totalCount={totalCount}
              onEdit={
                currentUser?.is_superuser
                  ? (sale: Sale) => navigate(`/edit-sale/${sale.id}`)
                  : undefined
              }
              pageSize={30}
              currentPage={page}
              onPageChange={(newPage) => setPage(newPage)}
              expandedRowRenderer={(row: Sale) => renderExpandedRow(row)}
              onRowClick={(row: Sale) => handleRowClick(row)}
            />
          </div>
        </Card>
      </div>

      {/*<Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>*/}
      {/*  <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">*/}
      {/*    <DialogHeader className="border-b p-6">*/}
      {/*      <DialogTitle className="flex items-center gap-2 text-xl">*/}
      {/*        <span>{t('navigation.sales')} #{selectedSale?.id}</span>*/}
      {/*        {selectedSale?.on_credit && (*/}
      {/*          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">*/}
      {/*            <AlertCircle className="h-3 w-3" />*/}
      {/*            {t('common.on_credit')}*/}
      {/*          </span>*/}
      {/*        )}*/}
      {/*      </DialogTitle>*/}
      {/*    </DialogHeader>*/}
      {/*    */}
      {/*    <ScrollArea className="flex-1 p-6">*/}
      {/*      {selectedSale && (*/}
      {/*        <div className="space-y-6">*/}
      {/*          /!* Header Information *!/*/}
      {/*          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50 p-4 rounded-lg">*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <Store className="h-5 w-5 text-gray-400 mt-0.5" />*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('table.store')}</h3>*/}
      {/*                <p className="text-gray-900 font-medium">{selectedSale.store_read?.name || '-'}</p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <div className="flex-shrink-0">*/}
      {/*                {selectedSale?.sale_payments?.[0]?.payment_method === 'Наличные' && <Wallet className="h-5 w-5 text-green-500 mt-0.5" />}*/}
      {/*                {selectedSale?.sale_payments?.[0]?.payment_method === 'Карта' && <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />}*/}
      {/*                {selectedSale?.sale_payments?.[0]?.payment_method === 'Click' && <SmartphoneNfc className="h-5 w-5 text-purple-500 mt-0.5" />}*/}
      {/*              </div>*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('table.payment_method')}</h3>*/}
      {/*                <div className="space-y-1">*/}
      {/*                  {selectedSale?.sale_payments?.map((payment, index) => (*/}
      {/*                    <div key={index} className="flex items-center gap-2">*/}
      {/*                      {payment.payment_method === 'Наличные' && <span className="text-green-600 font-medium">Наличные</span>}*/}
      {/*                      {payment.payment_method === 'Карта' && <span className="text-blue-600 font-medium">Карта</span>}*/}
      {/*                      {payment.payment_method === 'Click' && <span className="text-purple-600 font-medium">Click</span>}*/}
      {/*                      <span className="text-sm text-gray-600">({formatCurrency(payment.amount)} UZS)</span>*/}
      {/*                    </div>*/}
      {/*                  ))}*/}
      {/*                </div>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <Tag className="h-5 w-5 text-emerald-500 mt-0.5" />*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('forms.total_amount')}</h3>*/}
      {/*                <p className="font-medium text-emerald-600">{formatCurrency(selectedSale.total_amount)} UZS</p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-start gap-2">*/}
      {/*              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />*/}
      {/*              <div>*/}
      {/*                <h3 className="font-medium text-gray-500 text-sm">{t('forms.payment_date')}</h3>*/}
      {/*                <p className="text-gray-900">{selectedSale.created_at ? formatDate(selectedSale.created_at) : '-'}</p>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          /!* Sale Items *!/*/}
      {/*          <div className="bg-white rounded-lg">*/}
      {/*            <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">*/}
      {/*              {t('common.sale_items')} */}
      {/*              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">*/}
      {/*                {selectedSale.sale_items?.length || 0}*/}
      {/*              </span>*/}
      {/*            </h3>*/}
      {/*            <div className="space-y-3">*/}
      {/*              {selectedSale.sale_items?.map((item, index) => (*/}
      {/*                <div key={index} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all duration-200">*/}
      {/*                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('table.product')}</span>*/}
      {/*                      <span className="font-medium line-clamp-2" title={item.stock_read?.product_read?.product_name || '-'}>*/}
      {/*                        {item.stock_read?.product_read?.product_name || '-'}*/}
      {/*                      </span>*/}
      {/*                    </div>*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('table.quantity')}</span>*/}
      {/*                      <span className="font-medium">*/}
      {/*                        {item.quantity} {item.selling_method === 'Штук' ? t('table.pieces') : t('table.measurement')}*/}
      {/*                      </span>*/}
      {/*                    </div>*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('table.price')}</span>*/}
      {/*                      <span className="font-medium">*/}
      {/*                        {formatCurrency(Number(item.subtotal) / Number(item.quantity))} */}
      {/*                      </span>*/}
      {/*                    </div>*/}
      {/*                    <div>*/}
      {/*                      <span className="text-sm text-gray-500 block mb-1">{t('forms.amount3')}</span>*/}
      {/*                      <span className="font-medium text-emerald-600">{formatCurrency(item.subtotal)}</span>*/}
      {/*                    </div>*/}
      {/*                  </div>*/}
      {/*                </div>*/}
      {/*              ))}*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          /!* Credit Information *!/*/}
      {/*          {selectedSale.on_credit && selectedSale.sale_debt && (*/}
      {/*            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">*/}
      {/*              <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">*/}
      {/*                {t('table.credit_info')}*/}
      {/*                <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">*/}
      {/*                  <AlertCircle className="h-3 w-3" />*/}
      {/*                  {t('common.on_credit')}*/}
      {/*                </span>*/}
      {/*              </h3>*/}
      {/*              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">*/}
      {/*                <div>*/}
      {/*                  <span className="text-sm text-gray-500 block mb-1">{t('table.client')}</span>*/}
      {/*                  <div className="font-medium flex flex-col">*/}
      {/*                    <span>{selectedSale.sale_debt.client_read?.name || '-'}</span>*/}
      {/*                    {selectedSale.sale_debt.client_read?.phone_number && (*/}
      {/*                      <span className="text-sm text-amber-600">*/}
      {/*                        {selectedSale.sale_debt.client_read.phone_number}*/}
      {/*                      </span>*/}
      {/*                    )}*/}
      {/*                  </div>*/}
      {/*                </div>*/}
      {/*                <div>*/}
      {/*                  <span className="text-sm text-gray-500 block mb-1">{t('forms.due_date')}</span>*/}
      {/*                  <span className="font-medium">*/}
      {/*                    {selectedSale.sale_debt.due_date ? formatDate(selectedSale.sale_debt.due_date) : '-'}*/}
      {/*                  </span>*/}
      {/*                </div>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*          )}*/}
      {/*        </div>*/}
      {/*      )}*/}
      {/*    </ScrollArea>*/}

      {/*    <div className="border-t p-6 mt-auto flex justify-between items-center">*/}
      {/*      <Button */}
      {/*        variant="destructive"*/}
      {/*        size="sm"*/}
      {/*        onClick={() => handleDelete(selectedSale?.id || 0)}*/}
      {/*      >*/}
      {/*        {t('common.delete')}*/}
      {/*      </Button>*/}
      {/*      <div className="flex gap-2">*/}
      {/*        <Button */}
      {/*          variant="outline" */}
      {/*          onClick={() => setIsDetailsModalOpen(false)}*/}
      {/*        >*/}
      {/*          {t('common.close')}*/}
      {/*        </Button>*/}
      {/*        <Button */}
      {/*          variant="default"*/}
      {/*          onClick={() => navigate(`/edit-sale/${selectedSale?.id}`)}*/}
      {/*        >*/}
      {/*          {t('common.edit')}*/}
      {/*        </Button>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </DialogContent>*/}
      {/*</Dialog>*/}
    </div>
  );
}
