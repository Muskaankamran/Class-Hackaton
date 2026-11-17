import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import gsap from "gsap";
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight,
  Shield,
  Stethoscope,
  TrendingUp,
  Check,
  Ban,
} from "lucide-react";
import {
  showConfirmDialog,
  showSuccessToast,
  showErrorAlert,
} from "../utils/alerts";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalUsers: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    rejectedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, appRes] = await Promise.all([
        API.get("/api/admin/stats"),
        API.get("/api/admin/appointments"),
      ]);
      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
      setRecentAppointments(appRes.data?.appointments?.slice(0, 5) || []);
    } catch (err) {
      console.error("Error loading admin data:", err);
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

  const handleAdminStatusChange = async (appointmentId, newStatus, patientName, doctorName) => {
    const isApprove = newStatus === "approved";
    const confirmed = await showConfirmDialog({
      title: isApprove ? "Approve Appointment?" : "Cancel Appointment?",
      text: isApprove
        ? `Are you sure you want to approve this appointment for ${patientName || "the patient"} with ${doctorName || "the doctor"}?`
        : `Are you sure you want to cancel this appointment for ${patientName || "the patient"}?`,
      confirmButtonText: isApprove ? "Yes, Approve" : "Yes, Cancel Appointment",
      confirmButtonColor: isApprove ? "#10b981" : "#E07A5F",
      icon: isApprove ? "question" : "warning",
    });

    if (!confirmed) return;

    setActionLoading(appointmentId);

    try {
      await API.patch(`/api/admin/appointments/${appointmentId}/status`, {
        status: newStatus,
      });

      showSuccessToast(
        `Appointment ${newStatus === "approved" ? "Approved" : "Cancelled"} successfully! 🎉`
      );

      // Re-fetch metrics and appointments
      fetchAdminData();
    } catch (err) {
      showErrorAlert(
        "Action Failed",
        err.response?.data?.message || `Failed to set status to ${newStatus}.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner - Soft gradient from peach #F5A281 to contrast terracotta */}
      <div className="bg-gradient-to-r from-[#DE7452] via-[#E88C6F] to-[#F5A281] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#F5A281]/15 gsap-card relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            Clinic Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="mt-2 text-white/90 text-sm sm:text-base leading-relaxed font-medium">
            Monitor clinic metrics, manage medical practitioners and registered patients, and supervise all
            patient appointment scheduling in real time.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#C45E3A] font-bold rounded-xl shadow-md hover:bg-[#FFF7F4] transition-all text-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#E07A5F]" />
              Manage Users & Staff
            </Link>
            <Link
              to="/admin/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 backdrop-blur-xs transition-all text-sm cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              All Appointments ({stats.totalAppointments})
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-6 rounded-3xl border border-[#F2E5DF] shadow-2xs flex items-center justify-between gsap-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Registered Patients
            </p>
            <p className="text-3xl font-extrabold text-stone-900 mt-1">{stats.totalPatients}</p>
            <p className="text-[11px] text-[#73938C] font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Active clinic members
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EEF5F3] text-[#73938C] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Doctors */}
        <div className="bg-white p-6 rounded-3xl border border-[#F2E5DF] shadow-2xs flex items-center justify-between gsap-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Active Doctors
            </p>
            <p className="text-3xl font-extrabold text-stone-900 mt-1">{stats.totalDoctors}</p>
            <p className="text-[11px] text-[#DE7452] font-semibold mt-1 flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              Clinical specialists
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FAF0EB] text-[#DE7452] flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white p-6 rounded-3xl border border-[#F2E5DF] shadow-2xs flex items-center justify-between gsap-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Appointments
            </p>
            <p className="text-3xl font-extrabold text-stone-900 mt-1">{stats.totalAppointments}</p>
            <p className="text-[11px] text-[#C45E3A] font-semibold mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              All-time consultations
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FAF0EB] text-[#C45E3A] flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-6 rounded-3xl border border-[#F2E5DF] shadow-2xs flex items-center justify-between gsap-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Pending Requests
            </p>
            <p className="text-3xl font-extrabold text-[#D97757] mt-1">
              {stats.pendingAppointments}
            </p>
            <p className="text-[11px] text-[#D97757] font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Awaiting doctor review
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Status Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center gap-3.5 gsap-card">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Approved Appointments
            </p>
            <p className="text-xl font-extrabold text-emerald-900">
              {stats.approvedAppointments}
            </p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-2xl flex items-center gap-3.5 gsap-card">
          <XCircle className="w-8 h-8 text-rose-600" />
          <div>
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Rejected Appointments
            </p>
            <p className="text-xl font-extrabold text-rose-900">
              {stats.rejectedAppointments}
            </p>
          </div>
        </div>

        <div className="bg-[#FAF7F5] border border-[#F0E4DE] p-4 rounded-2xl flex items-center gap-3.5 gsap-card">
          <Clock className="w-8 h-8 text-stone-500" />
          <div>
            <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Cancelled by Patients
            </p>
            <p className="text-xl font-extrabold text-stone-900">
              {stats.cancelledAppointments}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Appointments Table with Admin Action Controls */}
      <div className="bg-white rounded-3xl border border-[#F2E5DF] p-6 sm:p-8 shadow-2xs space-y-4 gsap-card">
        <div className="flex items-center justify-between border-b border-[#F7EFEA] pb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Recent Clinic Appointments</h2>
            <p className="text-sm text-stone-500">Supervise, approve, and cancel bookings directly</p>
          </div>
          <Link
            to="/admin/appointments"
            className="text-xs font-bold text-[#E07A5F] hover:text-[#C45E3A] flex items-center gap-1"
          >
            <span>View All ({stats.totalAppointments})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAppointments.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No appointments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F7EFEA] text-xs font-semibold uppercase text-stone-400">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7EFEA]">
                {recentAppointments.map((app) => {
                  const isLoading = actionLoading === app._id;
                  const isApproved = app.status === "approved";
                  const isCancelled = app.status === "cancelled";

                  return (
                    <tr key={app._id} className="hover:bg-[#FAF7F5] transition-colors">
                      <td className="py-3 font-bold text-stone-900">
                        {app.patient?.name || "Patient"}
                      </td>
                      <td className="py-3 text-stone-700">
                        {app.doctor?.name || "Doctor"}{" "}
                        <span className="text-xs text-[#DE7452] block font-semibold">
                          {app.doctor?.specialization}
                        </span>
                      </td>
                      <td className="py-3 text-stone-600 text-xs">
                        {new Date(app.appointmentDate).toLocaleDateString()} at {app.appointmentTime}
                      </td>
                      <td className="py-3 text-stone-600 text-xs max-w-xs truncate">{app.reason}</td>
                      <td className="py-3 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isApproved && (
                            <button
                              onClick={() =>
                                handleAdminStatusChange(
                                  app._id,
                                  "approved",
                                  app.patient?.name,
                                  app.doctor?.name
                                )
                              }
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Approve Appointment as Admin"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Approve</span>
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              onClick={() =>
                                handleAdminStatusChange(
                                  app._id,
                                  "cancelled",
                                  app.patient?.name,
                                  app.doctor?.name
                                )
                              }
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Cancel Appointment as Admin"
                            >
                              <Ban className="w-3 h-3 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
