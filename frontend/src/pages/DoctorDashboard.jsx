import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import gsap from "gsap";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Award,
  Activity,
  ArrowRight,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/appointments/doctor");
      setAppointments(res.data?.appointments || []);
      if (res.data?.counts) {
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error("Error fetching doctor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".gsap-card"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, [loading]);

  const pendingRequests = appointments.filter((a) => a.status === "pending");

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Doctor Profile Banner - Soft gradient from sage to peach #F5A281 */}
      <div className="bg-gradient-to-r from-[#63847D] via-[#D97D62] to-[#F5A281] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#F5A281]/15 gsap-card relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center font-extrabold text-white text-2xl sm:text-3xl flex-shrink-0 shadow-inner">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : "D"}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Doctor Profile
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-400/20 text-white border border-emerald-300/40 text-xs font-semibold">
                  Active
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.name}
              </h1>

              <p className="text-white/95 font-semibold text-sm sm:text-base">
                {user?.specialization || "General Medicine"} Specialist
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-white/90 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Award className="w-4 h-4 text-amber-200" />
                  {user?.experience || 1}+ Years Clinical Experience
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Mail className="w-4 h-4 text-white/80" />
                  {user?.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2">
            <Link
              to="/doctor/requests"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#C45E3A] font-bold rounded-xl shadow-md hover:bg-[#FFF7F4] transition-all text-sm cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#E07A5F]" />
              Manage Requests ({counts.pending})
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#F2E5DF] shadow-2xs gsap-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Appointments
            </p>
            <div className="w-8 h-8 rounded-xl bg-[#FAF0EB] text-[#DE7452] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-stone-900 mt-2">{counts.total}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F2E5DF] shadow-2xs gsap-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Pending Requests
            </p>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#D97757] mt-2">{counts.pending}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F2E5DF] shadow-2xs gsap-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Approved
            </p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{counts.approved}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F2E5DF] shadow-2xs gsap-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Rejected
            </p>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{counts.rejected}</p>
        </div>
      </div>

      {/* Pending Requests Queue Preview */}
      <div className="bg-white rounded-3xl border border-[#F2E5DF] p-6 sm:p-8 shadow-2xs space-y-6 gsap-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F7EFEA] pb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Pending Appointment Requests</h2>
            <p className="text-sm text-stone-500">
              Review patient appointment requests and take action
            </p>
          </div>
          <Link
            to="/doctor/requests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E07A5F] hover:text-[#C45E3A]"
          >
            <span>View All Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-[#FAF7F5] p-5 rounded-2xl animate-pulse h-24 border border-[#F2E5DF]"
              ></div>
            ))}
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle className="w-12 h-12 text-[#73938C] mx-auto mb-2" />
            <p className="text-stone-800 font-bold text-base">All Caught Up!</p>
            <p className="text-stone-400 text-sm mt-0.5">
              You have no pending appointment requests at this moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F7EFEA]">
            {pendingRequests.slice(0, 4).map((app) => (
              <div
                key={app._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#FAF0EB] text-[#C45E3A] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {app.patient?.name ? app.patient.name.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-stone-900">{app.patient?.name}</p>
                      <span className="text-xs text-stone-400">({app.patient?.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                      <span className="font-semibold text-stone-700">Date:</span>
                      <span>
                        {new Date(app.appointmentDate).toLocaleDateString()} at {app.appointmentTime}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 italic">
                      <span className="font-semibold text-stone-700 not-italic">Reason:</span>{" "}
                      {app.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to="/doctor/requests"
                    className="px-3.5 py-1.5 bg-[#FAF0EB] text-[#C45E3A] hover:bg-[#F5E2D9] rounded-xl text-xs font-bold transition-colors"
                  >
                    Review in Requests
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
