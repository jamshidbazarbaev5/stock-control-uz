import "./App.css";
import "./index.css";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./core/pages/login";
import CreateUser from "./core/pages/create-user";
import CreateStore from "./core/pages/create-store";
import UsersPage from "./core/pages/UsersPage";
import StoresPage from "./core/pages/StoresPage";
import Layout from "./core/layout/Layout";
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
          <Route path="/" element={<Navigate to="/users" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
