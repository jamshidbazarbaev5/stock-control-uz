export interface ExpensesSummaryResponse {
  total_expense: number;
  expenses: Array<{
    expense_name__name: string;
    total_amount: number;
  }>;
}
