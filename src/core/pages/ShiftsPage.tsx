import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceTable } from "../helpers/ResourseTable";
import { shiftsApi } from "../api/shift";
import type { Shift } from "../api/shift";
import { formatDate } from "../helpers/formatDate";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Printer } from "lucide-react";
import {
  shiftClosureReceiptService,
  type ShiftClosureData,
} from "@/services/shiftClosureReceiptService";

export default function ShiftsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [printingShiftId, setPrintingShiftId] = useState<number | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["shifts", page, searchTerm],
    queryFn: () => shiftsApi.getAll(),
  });

  const shifts = response?.data?.results || [];
  const totalCount = response?.data?.count || 0;
  const columns = [
    {
      header: t("table.store"),
      accessorKey: (row: any) => row.store?.name,
    },
    {
      header: t("table.register"),
      accessorKey: (row: any) => row.register?.name,
    },
    {
      header: t("table.cashier"),
      accessorKey: (row: any) => row.cashier?.name,
    },
    {
      header: t("table.total_expected"),
      accessorKey: "total_expected",
    },



    {
      header: t("table.opened_at"),
      accessorKey: "opened_at",
      cell: (row: Shift) => formatDate(row.opened_at),
    },
    {
      header: t("table.closed_at"),
      accessorKey: "closed_at",
      cell: (row: Shift) => (row.closed_at ? formatDate(row.closed_at) : "-"),
    },
    {
      header: t("table.opening_cash"),
      accessorKey: "opening_cash",
    },

    {
      header: t("table.status"),
      accessorKey: "is_active",
      cell: (row: Shift) =>
        row.is_active ? t("common.active") : t("common.closed"),
    },

    {
      header: "Печать",
      accessorKey: "print",
      cell: (row: Shift) => (
        <Button
          onClick={() => handlePrint(row)}
          disabled={printingShiftId === row.id || row.is_active}
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <Printer className="w-4 h-4 mr-1" />
          {printingShiftId === row.id ? "Печать..." : "Печать"}
        </Button>
      ),
    },
  ];

  const handleEdit = (shift: Shift) => {
    navigate(`/shifts/${shift.id}/edit`);
  };

  const handlePrint = async (shift: Shift) => {
    if (shift.is_active) {
      // Don't allow printing for active shifts
      shiftClosureReceiptService.showPrintNotification({
        success: false,
        method: "failed",
        message: "Нельзя печатать чек для активной смены",
        error: "Shift is still active",
      });
      return;
    }

    try {
      setPrintingShiftId(shift.id);
      console.log(`🖨️ Printing receipt for shift ${shift.id}...`);

      // Fetch full shift details from API
      const response = await shiftsApi.getById(shift.id);
      const shiftData = response.data;

      // Transform the API response to match ShiftClosureData interface
      const printData: ShiftClosureData = {
        id: shiftData.id,
        store: shiftData.store,
        register: shiftData.register,
        cashier: shiftData.cashier,
        total_expected: shiftData.total_expected,
        total_actual: shiftData.total_actual,
        total_sales_amount: shiftData.total_sales_amount,
        total_debt_amount: shiftData.total_debt_amount,
        total_sales_count: shiftData.total_sales_count,
        total_returns_amount: shiftData.total_returns_amount,
        total_returns_count: shiftData.total_returns_count,
        total_income: shiftData.total_income,
        total_expense: shiftData.total_expense,
        opened_at: shiftData.opened_at,
        closed_at: shiftData.closed_at || new Date().toISOString(),
        opening_cash: shiftData.opening_cash,
        closing_cash: shiftData.closing_cash || "0.00",
        opening_comment: shiftData.opening_comment || "",
        closing_comment: shiftData.closing_comment || "",
        approval_comment: shiftData.approval_comment,
        is_active: shiftData.is_active,
        is_awaiting_approval: shiftData.is_awaiting_approval,
        is_approved: shiftData.is_approved,
        approved_by: shiftData.approved_by,
        payments: shiftData.payments,
      };

      // Print the receipt
      const printResult =
        await shiftClosureReceiptService.printWithFallback(printData);
      shiftClosureReceiptService.showPrintNotification(printResult);
      console.log("✅ Print completed:", printResult);
    } catch (error) {
      console.error("❌ Print failed:", error);
      shiftClosureReceiptService.showPrintNotification({
        success: false,
        method: "failed",
        message: "Ошибка при печати чека",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setPrintingShiftId(null);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.shifts")}</h1>
        <Button onClick={() => navigate("/shifts/new")}>
          {t("common.create")}
        </Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder={t("placeholders.search_shifts")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ResourceTable<any>
        data={shifts}
        columns={columns}
        isLoading={isLoading}
        onEdit={currentUser?.is_superuser ? handleEdit : undefined}
        totalCount={totalCount}
        currentPage={page}
        onPageChange={setPage}
        pageSize={30}
      />
    </div>
  );
}
