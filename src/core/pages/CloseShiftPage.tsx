import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Calculator, Printer } from "lucide-react";
import {
  shiftsApi,
  type ShiftSummary,
  type CloseShiftData,
  type CloseShiftPayment,
} from "@/core/api/shift";
import { useCurrentUser } from "@/core/hooks/useCurrentUser";
import { useAuth } from "@/core/context/AuthContext";
import {
  shiftClosureReceiptService,
  type ShiftClosureData,
} from "@/services/shiftClosureReceiptService";
import {toast} from "sonner";

const CloseShiftPage = () => {
  const navigate = useNavigate();
  const { shiftId } = useParams<{ shiftId: string }>();
  const { data: userData } = useCurrentUser();
  const { refreshUser } = useAuth();

  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [payments, setPayments] = useState<CloseShiftPayment[]>([]);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [closingComment, setClosingComment] = useState<string>("");

  // Printer state
  const [printerStatus, setPrinterStatus] = useState<
    "checking" | "ready" | "not-ready" | "unknown"
  >("unknown");
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      // Handle the case where shiftId is "active" - we need to get the actual shift ID
      let actualShiftId: number;

      if (shiftId === "active") {
        // For now, we'll need to get the shift ID from the user data or make an API call
        // Since the user data structure doesn't include shift ID, we'll use a different approach
        // We can get all shifts and find the active one, or modify the API to support /active endpoint
        try {
          const shiftsResponse = await shiftsApi.getAll();
          const activeShift = shiftsResponse.data.results.find(
            (shift) => shift.is_active,
          );
          if (!activeShift) {
            setError("Активная смена не найдена");
            setLoading(false);
            return;
          }
          actualShiftId = activeShift.id;
        } catch {
          setError("Ошибка при поиске активной смены");
          setLoading(false);
          return;
        }
      } else {
        actualShiftId = parseInt(shiftId || "0");
        if (isNaN(actualShiftId)) {
          setError("Неверный ID смены");
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        const response = await shiftsApi.getSummary(actualShiftId);
        setSummary(response.data);

        // Initialize payments with expected values
        const initialPayments = response.data.payments.map((payment) => ({
          payment_method: payment.payment_method,
          actual: payment.expected,
        }));
        setPayments(initialPayments);

        // Set initial closing cash to a default value
        setClosingCash(0);
      } catch (err) {
        setError("Ошибка при загрузке данных смены");
        console.error("Error fetching shift summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [shiftId, userData]);

  // Check printer status on component mount
  useEffect(() => {
    const checkPrinter = async () => {
      setPrinterStatus("checking");
      try {
        const status = await shiftClosureReceiptService.checkPrinterStatus();
        setPrinterStatus(status.printer_ready ? "ready" : "not-ready");
      } catch (error) {
        console.warn("Printer service not available:", error);
        setPrinterStatus("not-ready");
      }
    };

    checkPrinter();
  }, []);

  const handlePaymentChange = (index: number, value: number) => {
    const updatedPayments = [...payments];
    updatedPayments[index].actual = value;
    setPayments(updatedPayments);
  };

  const calculateDifference = (expected: number, actual: number) => {
    const diff = actual - expected;
    return {
      amount: Math.abs(diff),
      isPositive: diff >= 0,
      isZero: diff === 0,
    };
  };

  const getTotalActual = () => {
    return payments.reduce((sum, payment) => sum + payment.actual, 0);
  };

  const getTotalExpected = () => {
    return summary?.total_expected || 0;
  };

  const handleSubmit = async () => {
    if (!summary) return;

    try {
      setSubmitting(true);

      // Get the actual shift ID from summary data
      const actualShiftId = summary.shift_id;

      const closeData: CloseShiftData = {
        payments,
        closing_cash: closingCash,
        closing_comment: closingComment,
      };

      // Close the shift first
      const closeResponse = await shiftsApi.closeShift(
        actualShiftId,
        closeData,
      );
      console.log("✅ Shift closed successfully:", closeResponse);

      // Use the data from close endpoint response - it contains all we need
      const shiftData = closeResponse.data;
      console.log("📊 Shift close response data:", shiftData);

      // Prepare data for printing using the close endpoint response
      // Use the summary data we fetched before closing for sales statistics
      const printData: ShiftClosureData = {
        id: shiftData.id,
        store: shiftData.store,
        register: shiftData.register,
        cashier: shiftData.cashier,
        total_expected: shiftData.total_expected,
        total_actual: shiftData.total_actual || "0",
        total_sales_amount: shiftData.total_sales_amount || 0,
        total_debt_amount: shiftData.total_debt_amount || 0,
        total_sales_count: shiftData.total_sales_count || 0,
        total_returns_amount: shiftData.total_returns_amount || 0,
        total_returns_count: shiftData.total_returns_count || 0,
        total_income: shiftData.total_income || 0,
        total_expense: shiftData.total_expense || 0,
        opened_at: shiftData.opened_at,
        closed_at: shiftData.closed_at || new Date().toISOString(),
        opening_cash: shiftData.opening_cash,
        closing_cash: shiftData.closing_cash || closingCash.toString(),
        opening_comment: shiftData.opening_comment || "",
        closing_comment: shiftData.closing_comment || closingComment,
        approval_comment: shiftData.approval_comment,
        is_active: shiftData.is_active,
        is_awaiting_approval: shiftData.is_awaiting_approval,
        is_approved: shiftData.is_approved,
        approved_by: shiftData.approved_by,
        payments: shiftData.payments,
      };

      // Attempt automatic printing
      setPrinting(true);
      try {
        const printResult =
          await shiftClosureReceiptService.printWithFallback(printData);
        shiftClosureReceiptService.showPrintNotification(printResult);
        console.log("🖨️ Print result:", printResult);
      } catch (printError) {
        console.error("❌ Printing failed:", printError);
        shiftClosureReceiptService.showPrintNotification({
          success: false,
          method: "failed",
          message: "Не удалось напечатать чек",
          error:
            printError instanceof Error ? printError.message : "Unknown error",
        });
      } finally {
        setPrinting(false);
      }

      // Refresh user data to update has_active_shift status
      await refreshUser();
      toast.success('Смена закрыто успешно')

      // Navigate back to POS interface - it will show OpenShiftForm since shift is now closed
      navigate("/pos");
    } catch (err) {
      setError("Ошибка при закрытии смены");
      console.error("Error closing shift:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setPrinting(true);
      await shiftClosureReceiptService.printTestReceipt();
      shiftClosureReceiptService.showPrintNotification({
        success: true,
        method: "thermal",
        message: "Тестовый чек напечатан успешно",
      });
    } catch (error) {
      console.error("Test print failed:", error);
      shiftClosureReceiptService.showPrintNotification({
        success: false,
        method: "failed",
        message: "Ошибка печати тестового чека",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Данные не найдены"}</p>
          <Button onClick={() => navigate("/pos")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться
          </Button>
        </div>
      </div>
    );
  }

  const totalDifference = calculateDifference(
    getTotalExpected(),
    getTotalActual(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 md:mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/pos")}
                variant="outline"
                size="sm"
                className="rounded-full border-2 hover:bg-gray-50 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Назад</span>
              </Button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                    ЗАКРЫТИЕ КАССЫ
                  </h1>
                  <p className="text-gray-500 text-xs sm:text-sm truncate">
                    Магазин {summary.store} • Открыта{" "}
                    {new Date(summary.opened_at).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Printer Status Indicator */}
              <div className="flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-gray-100">
                <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {printerStatus === "checking" && "🔄"}
                  {printerStatus === "ready" && "✅"}
                  {printerStatus === "not-ready" && "❌"}
                  {printerStatus === "unknown" && "❓"}
                  <span className="hidden sm:inline ml-1">
                    {printerStatus === "checking" && "Проверка..."}
                    {printerStatus === "ready" && "Готов"}
                    {printerStatus === "not-ready" && "Не готов"}
                    {printerStatus === "unknown" && "Неизвестно"}
                  </span>
                </span>
              </div>

              {/* Test Print Button */}
              <Button
                onClick={handleTestPrint}
                disabled={printing || printerStatus !== "ready"}
                variant="outline"
                size="sm"
                className="rounded-full text-xs sm:text-sm px-2 sm:px-4"
              >
                <Printer className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">{printing ? "Печать..." : "Тест"}</span>
              </Button>

              {/* Close Shift Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || printing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-base flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                {submitting
                  ? "Закрытие..."
                  : printing
                    ? "Печать..."
                    : "Закрыть кассу"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 sm:p-4 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3" />
                Способы оплаты
              </h2>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 rounded-lg">
                      <th className="text-left py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 font-semibold text-gray-700 rounded-l-lg text-xs sm:text-sm">
                        Тип
                      </th>
                      <th className="text-right py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 font-semibold text-gray-700 text-xs sm:text-sm">
                        Поступило
                      </th>
                      <th className="text-right py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 font-semibold text-gray-700 text-xs sm:text-sm">
                        Ушло
                      </th>
                      <th className="text-right py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 font-semibold text-gray-700 text-xs sm:text-sm">
                        Ожидается
                      </th>
                      <th className="text-right py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 font-semibold text-gray-700 text-xs sm:text-sm">
                        Фактически
                      </th>
                      <th className="text-right py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 font-semibold text-gray-700 rounded-r-lg text-xs sm:text-sm">
                        Разница
                      </th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {summary.payments.map((payment, index) => {
                      const actualValue = payments[index]?.actual || 0;
                      const difference = calculateDifference(
                        payment.expected,
                        actualValue,
                      );

                      return (
                        <tr
                          key={payment.payment_method}
                          className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100"
                        >
                          <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 font-semibold text-gray-800 text-xs sm:text-sm">
                            {payment.payment_method_display}
                          </td>
                          <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 text-right text-gray-600">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                              {payment.income.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 text-right text-gray-600">
                            <span className="bg-orange-100 text-orange-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                              {payment.expense.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 text-right">
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                              {payment.expected.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 text-right">
                            <Input
                              type="number"
                              value={actualValue}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-24 sm:w-32 md:w-36 text-right border-2 border-blue-200 focus:border-blue-500 rounded-xl bg-blue-50 font-semibold text-xs sm:text-sm"
                              step="0.01"
                            />
                          </td>
                          <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-md whitespace-nowrap ${
                                difference.isZero
                                  ? "bg-green-500 text-white"
                                  : difference.isPositive
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                              }`}
                            >
                              {difference.isZero
                                ? "0"
                                : (difference.isPositive ? "+" : "-") +
                                  difference.amount.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Closing Cash and Comments in a row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Closing Cash */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  💰 Наличные в кассе
                </h3>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Сумма наличных при закрытии
                    </label>
                    <Input
                      type="number"
                      value={closingCash}
                      onChange={(e) =>
                        setClosingCash(parseFloat(e.target.value) || 0)
                      }
                      className="w-full border-2 border-green-200 focus:border-green-500 rounded-xl bg-green-50 text-lg font-bold text-center py-4"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-bold text-white">📝 Комментарий</h3>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                <Textarea
                  value={closingComment}
                  onChange={(e) => setClosingComment(e.target.value)}
                  placeholder="Добавьте комментарий к закрытию смены..."
                  className="w-full border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-orange-50 resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Totals Summary - Moved to bottom */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-3 sm:p-4 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center">
                📊 Итоги смены
              </h2>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                <div className="bg-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border-l-4 border-blue-500">
                  <div className="text-xs sm:text-sm text-blue-600 font-medium">
                    Всего продаж
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">
                    {summary.total_sales_count}
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-2 sm:p-3 md:p-4 border-l-4 border-green-500">
                  <div className="text-xs sm:text-sm text-green-600 font-medium">
                    Сумма продаж
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-800 truncate">
                    {summary.total_sales_amount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-2 sm:p-3 md:p-4 border-l-4 border-orange-500">
                  <div className="text-xs sm:text-sm text-orange-600 font-medium">
                    Возвратов
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-800">
                    {summary.total_returns_count}
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-2 sm:p-3 md:p-4 border-l-4 border-red-500">
                  <div className="text-xs sm:text-sm text-red-600 font-medium">
                    Сумма возвратов
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-800 truncate">
                    {summary.total_returns_amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-lg font-semibold text-gray-700">
                    Ожидается:
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    {getTotalExpected().toLocaleString()} UZS
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-lg font-semibold text-gray-700">
                    Фактически:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {getTotalActual().toLocaleString()} UZS
                  </span>
                </div>
                <div className="flex justify-between items-center py-4 bg-white rounded-xl px-6 shadow-md">
                  <span className="text-xl font-bold text-gray-800">
                    Разница:
                  </span>
                  <span
                    className={`text-3xl font-black px-6 py-2 rounded-full shadow-lg ${
                      totalDifference.isZero
                        ? "bg-green-500 text-white"
                        : totalDifference.isPositive
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                    }`}
                  >
                    {totalDifference.isZero
                      ? "0"
                      : (totalDifference.isPositive ? "+" : "-") +
                        totalDifference.amount.toLocaleString()}{" "}
                    UZS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloseShiftPage;
