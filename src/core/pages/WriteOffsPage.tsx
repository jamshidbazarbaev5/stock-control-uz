import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetWriteoffs } from "../api/writeoff";
import { ResourceTable } from "../helpers/ResourseTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface WriteOffItem {
  id: number;
  stock_read: {
    id: number;
    store: {
      id: number;
      name: string;
    };
    product: {
      id: number;
      product_name: string;
      base_unit: number;
      attribute_values: any[];
    };
    stock_name: string | null;
    currency: {
      id: number;
      name: string;
      short_name: string;
      is_base: boolean;
    };
    supplier: {
      id: number;
      name: string;
    };
    purchase_unit: {
      id: number;
      measurement_name: string;
      short_name: string;
    };
    dynamic_fields: any;
    is_debt: boolean;
    amount_of_debt: string;
    advance_of_debt: string | null;
    date_of_arrived: string;
  };
  quantity: string;
}

interface WriteOff {
  id: number;
  items: WriteOffItem[];
  reason: string;
  notes: string;
  created_at: string;
  store: number;
  created_by: number;
}

export default function WriteOffsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: writeoffsData, isLoading } = useGetWriteoffs();
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const writeoffs = Array.isArray(writeoffsData) ? writeoffsData : writeoffsData?.results || [];

  const columns: Array<{ header: string; accessorKey: string; cell: (row: WriteOff) => React.ReactNode }> = [
    {
      header: "№",
      accessorKey: "id",
      cell: (row: WriteOff) => row.id,
    },
    {
      header: t("table.store"),
      accessorKey: "store",
      cell: (row: WriteOff) => {
        const item = row.items?.[0];
        return item?.stock_read?.store?.name || "-";
      },
    },
    {
      header: t("common.reason"),
      accessorKey: "reason",
      cell: (row: WriteOff) => row.reason,
    },
    {
      header: t("common.notes"),
      accessorKey: "notes",
      cell: (row: WriteOff) => (
        <div className="max-w-xs truncate" title={row.notes}>
          {row.notes || "-"}
        </div>
      ),
    },
    {
      header: "Количество товаров",
      accessorKey: "items_count",
      cell: (row: WriteOff) => row.items?.length || 0,
    },
    {
      header: t("table.date"),
      accessorKey: "created_at",
      cell: (row: WriteOff) => {
        try {
          return new Date(row.created_at).toLocaleString("ru-RU");
        } catch {
          return row.created_at;
        }
      },
    },
    {
      header: "Действия",
      accessorKey: "actions",
      cell: (row: WriteOff) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/writeoffs/${row.id}`);
          }}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Просмотр</span>
        </Button>
      ),
    },
  ];

  const renderExpandedRow = (writeoff: WriteOff) => {
    return (
      <div className="p-4 sm:p-6 bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Товары в списании</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[600px] bg-white rounded-lg border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">
                  Товар
                </th>
                <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">
                  Поставщик
                </th>
                <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">
                  Количество
                </th>
                <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">
                  Ед. изм.
                </th>
                <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">
                  Дата поступления
                </th>
              </tr>
            </thead>
            <tbody>
              {writeoff.items.map((item) => (
                <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    <div className="font-medium">{item.stock_read.product.product_name}</div>
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    {item.stock_read.supplier.name}
                  </td>
                  <td className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm">
                    {parseFloat(item.quantity).toFixed(2)}
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    {item.stock_read.purchase_unit.short_name}
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">
                    {new Date(item.stock_read.date_of_arrived).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // @ts-ignore
  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t("navigation.writeoffs")}</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Список всех списаний товаров
        </p>
      </div>

      <Card className="p-3 sm:p-4 md:p-6">
        <ResourceTable<WriteOff>
          data={writeoffs}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(writeoff) => {
            setExpandedRowId(expandedRowId === writeoff.id ? null : writeoff.id ?? null);
          }}
          expandedRowRenderer={expandedRowId !== null ? renderExpandedRow : undefined}
        />
      </Card>
    </div>
  );
}
