import "./App.css";
import "./index.css";
import "./i18n";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./core/pages/login";
import { LanguageProvider } from "./core/context/LanguageContext";
import CreateUser from "./core/pages/create-user";
import CreateStore from "./core/pages/create-store";
import CreateCategory from "./core/pages/create-category";
import UsersPage from "./core/pages/UsersPage";
import StoresPage from "./core/pages/StoresPage";
import CategoriesPage from "./core/pages/CategoriesPage";
import ProductsPage from "./core/pages/ProductsPage";
import CreateProduct from "./core/pages/create-product";
import StocksPage from "./core/pages/StocksPage";
import CreateStock from "./core/pages/create-stock";
import EditStock from "./core/pages/edit-stock";
import Layout from "./core/layout/Layout";
import MeasurementsPage from "./core/pages/MeasurementsPage";
import CreateMeasurement from "./core/pages/create-measurement";
import SuppliersPage from "./core/pages/SuppliersPage";
import CreateSupplier from "./core/pages/create-supplier";
import TransfersPage from "./core/pages/TransfersPage";
import CreateTransfer from "./core/pages/create-transfer";
import RecyclingsPage from "./core/pages/RecyclingsPage";
import CreateRecycling from "./core/pages/create-recycling";
import ClientsPage from "./core/pages/ClientsPage";
import CreateClient from "./core/pages/create-client";
import EditClient from "./core/pages/edit-client";
import SalesPage from "./core/pages/SalesPage";
import { Toaster } from "sonner";
import DebtsPage from "./core/pages/DebtsPage";
import StaffPage from "./core/pages/StaffPage";
import CreateStaff from "./core/pages/create-staff";
import DebtPaymentHistoryPage from "./core/pages/DebtPaymentHistoryPage";
import EditSale from "./core/pages/edit-sale";
import DebtDetailsPage from "./core/pages/DebtDetailsPage";
import CreateSale from "./core/pages/create-sale";
import ExpenseNamesPage from "./core/pages/ExpenseNamesPage";
import CreateExpenseName from "./core/pages/create-expense-name";
import ExpensesPage from "./core/pages/ExpensesPage";
import CreateExpense from "./core/pages/create-expense";
import AddMoney from "./core/pages/add-money";
import CashInflowNamesPage from "./core/pages/CashInflowNamesPage";
import EditExpensePage from "./core/pages/edit-expense";
import CashInflowHistoryPage from "./core/pages/CashInflowHistoryPage";
import EditMoney from "./core/pages/edit-money";
import EditProduct from "./core/pages/edit-product";

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes wrapped in Layout */}
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/create-user" element={<CreateUser />} /> 
            <Route path="/users" element={<UsersPage />} />
            <Route path="/create-store" element={<CreateStore />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/create-category" element={<CreateCategory />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="//measurements/create" element={<CreateMeasurement />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/create-product" element={<CreateProduct />} />
            <Route path="/stock" element={<StocksPage />} />
            <Route path="/create-stock" element={<CreateStock />} />
            <Route path="/edit-stock/:id" element={<EditStock />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/create-supplier" element={<CreateSupplier />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/create-client" element={<CreateClient />} />
            <Route path="/edit-client/:id" element={<EditClient />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/create-transfer" element={<CreateTransfer />} />
            <Route path="/recyclings" element={<RecyclingsPage />} />
            <Route path="/create-recycling" element={<CreateRecycling />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/create-sale" element={<CreateSale />} />
            <Route path="/edit-sale/:id" element={<EditSale />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/debts/:id/history" element={<DebtPaymentHistoryPage />} />
            <Route path="/debts/:id" element={<DebtDetailsPage />} />
            <Route path="/expense-name" element={<ExpenseNamesPage />} />
            <Route path="/create-expense-name" element={<CreateExpenseName />} />
            <Route path="/expense" element={<ExpensesPage />} />
            <Route path="/create-expense" element={<CreateExpense />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/edit-debt/:id" element={<DebtDetailsPage />} />
            <Route path="/create-staff" element={<CreateStaff />} />
            <Route path="/add-money" element={<AddMoney />} />
            <Route path="/edit-expense/:id" element={<EditExpensePage />} />
            <Route path="/cash-inflow-names" element={<CashInflowNamesPage />} />
            <Route path="/finance" element={<CashInflowHistoryPage />} />
            <Route path="/edit-money/:id" element={<EditMoney />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />
            <Route path="/" element={<Navigate to="/users" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
