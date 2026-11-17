import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import PatientDashboard from "./pages/PatientDashboard";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";

import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorRequests from "./pages/DoctorRequests";

import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import AllAppointments from "./pages/AllAppointments";

// Root redirect handler
function HomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#FAF7F5] flex flex-col font-sans selection:bg-[#F5A281] selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Home */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Public Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Patient Routes */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/book"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <MyAppointments />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/requests"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorRequests />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/appointments"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AllAppointments />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-[#F0E4DE] bg-white/80 py-6 text-center text-xs text-stone-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} AuraMed Health Clinic Appointment Management System</p>
              <p className="font-medium text-stone-500">MERN Stack Hackathon Evaluation Build</p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
