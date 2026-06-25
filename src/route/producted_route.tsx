import { Navigate } from "react-router-dom";
import { tokenStorage } from "../helpers/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = tokenStorage.getAccess();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
