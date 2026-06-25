import { Navigate } from "react-router-dom";
import { tokenStorage } from "../helpers/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = tokenStorage.getAccess();
  const refreshToekn = tokenStorage.getRefresh();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
