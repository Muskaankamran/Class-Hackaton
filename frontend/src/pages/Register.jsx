import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import gsap from "gsap";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const newUser = await register(formData);
      if (newUser.role === "patient") {
        navigate("/patient/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
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
            Join AuraMed
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Create your patient account to book and manage health appointments
          </p>
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
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Khan"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="sarah@example.com"
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
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] transition-all text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF0EB] border border-[#FAD9CB] rounded-2xl flex items-center gap-2 text-[#9E4522] text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#E07A5F] flex-shrink-0" />
              <span>Registering as a Patient. Doctor accounts are created by Clinic Admins.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#F5A281] to-[#E07A5F] hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-[#F5A281]/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#E07A5F] hover:text-[#C45E3A]">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
