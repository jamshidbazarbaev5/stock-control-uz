import "./App.css";
import "./index.css";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./core/pages/login";
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
import { Toaster } from "sonner";


const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/create-transfer" element={<CreateTransfer />} />
          <Route path="/" element={<Navigate to="/users" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
