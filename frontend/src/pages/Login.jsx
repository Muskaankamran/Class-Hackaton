import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import gsap from "gsap";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { showSuccessToast, showErrorAlert } from "../utils/alerts";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".gsap-fade"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      showSuccessToast(`Welcome, ${loggedUser.name}! (${loggedUser.role.toUpperCase()})`);

      if (loggedUser.role === "admin") {
        navigate("/admin/dashboard");
      } else if (loggedUser.role === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to log in. Please check your credentials.";
      setError(msg);
      showErrorAlert("Authentication Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError("");
  };

  return (
    <div
      ref={containerRef}
      className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF7F5]"
    >
      <div className="max-w-md w-full space-y-6">
        <div className="text-center gsap-fade flex flex-col items-center">
          <BrandLogo size="lg" className="mb-2" showSubtitle={false} />
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1">
            Welcome to AuraMed
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Sign in to access your role-based healthcare portal
          </p>
        </div>

        {/* Quick Demo Login Cards for Evaluator */}
        <div className="bg-white/80 border border-[#F2E5DF] rounded-2xl p-4 gsap-fade shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C45E3A] mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#E07A5F]" />
            Quick Demo Accounts (1-Click Fill)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin("admin@clinic.com", "admin123")}
              className="px-2.5 py-1.5 bg-[#FAF0EB] hover:bg-[#F5E2D9] text-[#A64522] text-xs font-bold rounded-xl border border-[#FAD8C9] transition-colors cursor-pointer text-center"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin("ahmed@clinic.com", "doctor123")}
              className="px-2.5 py-1.5 bg-[#EEF5F3] hover:bg-[#DCEEEA] text-[#426C63] text-xs font-bold rounded-xl border border-[#CFE4DF] transition-colors cursor-pointer text-center"
            >
              🩺 Dr. Ahmed
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin("patient@clinic.com", "patient123")}
              className="px-2.5 py-1.5 bg-[#F9F4F0] hover:bg-[#F2E8E0] text-[#7A5B4C] text-xs font-bold rounded-xl border border-[#E8DACF] transition-colors cursor-pointer text-center"
            >
              🧑 Patient
            </button>
          </div>
        </div>

        <div className="bg-white p-8 border border-[#F0E4DE] rounded-3xl shadow-xl shadow-[#F5A281]/5 gsap-fade">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#F5A281] to-[#E07A5F] hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-[#F5A281]/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-[#E07A5F] hover:text-[#C45E3A]">
              Register as Patient
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
