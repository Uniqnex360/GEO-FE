import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/login/Login";
import Dashboard from "../pages/Dashboard/dashboard";
import User from "../pages/User/User";
import Layout from "../components/layout/Layout";

import ProtectedRoute from "./producted_route";
import BrandRoutes from "./brand";
import ProductRoutes from "./product_route";
import AISandboxRoutes from "./AISandbox";
import ChatRoutes from "./Chat";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        {AISandboxRoutes}

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/admin" />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<User />} />
          {/* routes */}
          {BrandRoutes}
          {ProductRoutes}
          {ChatRoutes}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
