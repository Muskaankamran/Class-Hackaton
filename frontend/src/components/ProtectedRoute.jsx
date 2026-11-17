import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { showAccessDeniedAlert } from "../utils/alerts";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const isRoleUnauthorized =
    isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role);

  useEffect(() => {
    if (isRoleUnauthorized) {
      if (allowedRoles.includes("admin")) {
        showAccessDeniedAlert(
          `Access Denied! You are logged in as a ${user?.role}. Only the Administrator is authorized to access the Admin Panel.`
        );
      } else {
        showAccessDeniedAlert(
          `Access Denied! Your current role (${user?.role}) does not have permission to view this page.`
        );
      }
    }
  }, [isRoleUnauthorized, allowedRoles, user?.role, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Validating role access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isRoleUnauthorized) {
    // Strictly redirect unauthorized user away from Admin panel to their role dashboard
    if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === "patient") return <Navigate to="/patient/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
