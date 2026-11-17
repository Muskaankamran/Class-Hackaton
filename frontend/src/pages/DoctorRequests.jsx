import React, { useState, useEffect, useRef } from "react";
import API from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import gsap from "gsap";
import {
  Check,
  X,
  Calendar,
  Clock,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
} from "lucide-react";
import {
  showSuccessToast,
  showErrorAlert,
  showConfirmDialog,
} from "../utils/alerts";

export default function DoctorRequests() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/appointments/doctor"
          : `/api/appointments/doctor?status=${statusFilter}`;
      const res = await API.get(url);
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      console.error("Error fetching doctor requests:", err);
      showErrorAlert("Error", "Failed to load requests from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".gsap-fade"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }
      );
    }
  }, [loading]);

  const handleStatusChange = async (appointmentId, newStatus, patientName) => {
    if (newStatus === "rejected") {
      const confirmed = await showConfirmDialog({
        title: "Reject Appointment Request?",
        text: `Are you sure you want to reject the appointment request from ${patientName || "this patient"}?`,
        confirmButtonText: "Yes, Reject Request",
        confirmButtonColor: "#E07A5F",
        icon: "warning",
      });
      if (!confirmed) return;
    }

    setActionLoading(appointmentId);

    try {
      await API.patch(`/api/appointments/${appointmentId}/status`, {
        status: newStatus,
      });

      showSuccessToast(
        `Appointment with ${patientName || "patient"} marked as ${newStatus.toUpperCase()}! 🎉`
      );

      // Update local state
      setAppointments((prev) =>
        prev.map((app) =>
          app._id === appointmentId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      showErrorAlert(
        "Update Failed",
        err.response?.data?.message || `Failed to update status to ${newStatus}.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: "all", label: "All Requests" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="gsap-fade">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Appointment Requests
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Review patient appointments assigned to you and update their approval status
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F2E5DF] pb-2 overflow-x-auto gsap-fade">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === tab.key
                ? "bg-[#E07A5F] text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF0EB]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white p-6 rounded-3xl border border-[#F2E5DF] animate-pulse h-32"
            ></div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#F2E5DF] p-12 text-center gsap-fade">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-700 font-bold text-base">No appointment requests found</p>
          <p className="text-stone-400 text-sm mt-1">
            {statusFilter === "all"
              ? "You have no appointments assigned yet."
              : `No appointments with status '${statusFilter}'.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => {
            const isPending = app.status === "pending";
            const isLoading = actionLoading === app._id;

            return (
              <div
                key={app._id}
                className="bg-white rounded-3xl border border-[#F2E5DF] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 gsap-fade"
              >
                {/* Patient Details */}
                <div className="flex items-start gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-[#FAF0EB] border border-[#FAD9CB] flex items-center justify-center font-bold text-[#C45E3A] text-xl flex-shrink-0">
                    {app.patient?.name ? app.patient.name.charAt(0).toUpperCase() : "P"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900">
                        {app.patient?.name || "Patient"}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{app.patient?.email}</span>
                      <span className="text-stone-300">•</span>
                      <span
                        className={`font-semibold ${
                          app.patient?.isActive !== false ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {app.patient?.isActive !== false ? "Active Patient" : "Deactivated"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-stone-800 bg-[#FAF7F5] px-2.5 py-0.5 rounded-lg border border-[#F0E4DE]">
                        <Calendar className="w-3.5 h-3.5 text-[#DE7452]" />
                        {new Date(app.appointmentDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-stone-800 bg-[#FAF7F5] px-2.5 py-0.5 rounded-lg border border-[#F0E4DE]">
                        <Clock className="w-3.5 h-3.5 text-[#DE7452]" />
                        {app.appointmentTime}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-stone-700 bg-[#FAF7F5] rounded-xl p-2.5 border border-[#F2E5DF]">
                      <span className="font-bold text-stone-900">Patient Reason:</span> {app.reason}
                    </div>
                  </div>
                </div>

                {/* Actions: Approve / Reject */}
                <div className="flex items-center sm:self-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F7EFEA]">
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(app._id, "approved", app.patient?.name)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(app._id, "rejected", app.patient?.name)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-xs font-bold text-stone-600 capitalize">
                        Status: <span className="text-stone-900">{app.status}</span>
                      </p>
                      <div className="flex gap-2 mt-1">
                        {app.status !== "approved" && (
                          <button
                            onClick={() => handleStatusChange(app._id, "approved", app.patient?.name)}
                            disabled={isLoading}
                            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Mark Approved
                          </button>
                        )}
                        {app.status !== "rejected" && (
                          <button
                            onClick={() => handleStatusChange(app._id, "rejected", app.patient?.name)}
                            disabled={isLoading}
                            className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                          >
                            Mark Rejected
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
