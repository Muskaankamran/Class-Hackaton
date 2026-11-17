import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "./StatusBadge";
import BrandLogo from "./BrandLogo";
import {
  Calendar,
  Users,
  Clock,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Stethoscope,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-[#F2E7E2] sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="group">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1.5">
              {/* Admin Links */}
              {isAdmin && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive("/admin/dashboard")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive("/admin/users")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Link>
                  <Link
                    to="/admin/appointments"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive("/admin/appointments")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    All Appointments
                  </Link>
                </>
              )}

              {/* Doctor Links */}
              {isDoctor && (
                <>
                  <Link
                    to="/doctor/dashboard"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive("/doctor/dashboard")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    Doctor Dashboard
                  </Link>
                  <Link
                    to="/doctor/requests"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive("/doctor/requests")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Appointment Requests
                  </Link>
                </>
              )}

              {/* Patient Links */}
              {isPatient && (
                <>
                  <Link
                    to="/patient/dashboard"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive("/patient/dashboard")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/patient/book"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive("/patient/book")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Book Appointment
                  </Link>
                  <Link
                    to="/patient/appointments"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive("/patient/appointments")
                        ? "bg-[#FDF1EB] text-[#C45E3A]"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF2EE]"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    My Appointments
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* User profile & Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 pl-2">
                  <div className="w-9 h-9 rounded-full bg-[#FAF0EB] border border-[#FAD9CB] flex items-center justify-center font-bold text-[#C45E3A] text-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-stone-800 leading-tight">
                      {user?.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusBadge status={user?.role} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-stone-700 hover:text-[#DE7452] hover:bg-[#FAF2EE] rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#F5A281] to-[#E07A5F] hover:opacity-95 rounded-xl shadow-xs shadow-[#F5A281]/30 transition-all hover:shadow-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#F2E7E2] flex flex-col gap-1">
            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  Manage Users
                </Link>
                <Link
                  to="/admin/appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  All Appointments
                </Link>
              </>
            )}

            {isDoctor && (
              <>
                <Link
                  to="/doctor/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  Doctor Dashboard
                </Link>
                <Link
                  to="/doctor/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  Appointment Requests
                </Link>
              </>
            )}

            {isPatient && (
              <>
                <Link
                  to="/patient/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/patient/book"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  Book Appointment
                </Link>
                <Link
                  to="/patient/appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-[#FAF2EE]"
                >
                  My Appointments
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
