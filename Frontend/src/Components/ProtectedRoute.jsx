import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  //  get token and user separately
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  //  If token missing → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, allow access to the protected page
  return children;
}
