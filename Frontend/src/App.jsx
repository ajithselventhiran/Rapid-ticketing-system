import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import TicketForm from "./Pages/TicketForm.jsx";
import LoginPage from "./Pages/Login.jsx";
import TechnicianDashboard from "./Pages/TechnicianDashboard.jsx";
import AdminDashboard from "./Pages/AdminDashboard.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

export default function App() {
  return (
    <>
      <Routes>
        {/* Default route → login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ticket" element={<TicketForm />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician"
          element={
            <ProtectedRoute>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
