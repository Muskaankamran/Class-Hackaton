import React, { useState, useEffect, useRef } from "react";
import API from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import gsap from "gsap";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  User,
  Stethoscope,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Ban,
  Check,
  X,
} from "lucide-react";
import {
  showConfirmDialog,
  showSuccessToast,
  showErrorAlert,
} from "../utils/alerts";

export default function AllAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
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
          ? "/api/admin/appointments"
          : `/api/admin/appointments?status=${statusFilter}`;
      const res = await API.get(url);
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      console.error("Error loading admin appointments:", err);
      showErrorAlert("Error", "Failed to load clinic appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".gsap-fade"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }
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

      // Optimistically update appointment state
      setAppointments((prev) =>
        prev.map((app) =>
          app._id === appointmentId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      showErrorAlert(
        "Action Failed",
        err.response?.data?.message || `Failed to set status to ${newStatus}.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Bonus Challenge: Search appointments by patient name (or doctor name or reason)
  const filteredAppointments = appointments.filter((app) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      app.patient?.name?.toLowerCase().includes(term) ||
      app.doctor?.name?.toLowerCase().includes(term) ||
      app.reason?.toLowerCase().includes(term)
    );
  });

  const tabs = [
    { key: "all", label: "All Appointments" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="gsap-fade flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0EB] text-[#C45E3A] border border-[#FAD9CB] text-xs font-bold uppercase tracking-wider">
              Admin Appointment Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            All Clinic Appointments
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Administer, approve, or cancel patient bookings across every clinic specialist
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#F2E5DF] shadow-2xs gsap-fade">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-[#E07A5F] text-white shadow-2xs"
                  : "text-stone-600 hover:bg-[#FAF0EB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bonus Challenge: Search by patient name */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, doctor, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] w-full sm:w-80"
          />
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-3xl border border-[#F2E5DF] overflow-hidden shadow-2xs gsap-fade">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-[#FAF7F5] rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-700 font-bold">No appointments match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F5] border-b border-[#F2E5DF] text-xs font-bold uppercase text-stone-500">
                <tr>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Assigned Doctor</th>
                  <th className="py-3.5 px-6">Date & Slot</th>
                  <th className="py-3.5 px-6">Reason for Visit</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7EFEA]">
                {filteredAppointments.map((app) => {
                  const isLoading = actionLoading === app._id;
                  const isApproved = app.status === "approved";
                  const isCancelled = app.status === "cancelled";

                  return (
                    <tr key={app._id} className="hover:bg-[#FAF7F5] transition-colors">
                      {/* Patient */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#FAF0EB] text-[#C45E3A] border border-[#FAD9CB] flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {app.patient?.name ? app.patient.name.charAt(0).toUpperCase() : "P"}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{app.patient?.name || "Patient"}</p>
                            <p className="text-xs text-stone-400">{app.patient?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-stone-900">{app.doctor?.name || "Doctor"}</p>
                          <p className="text-xs text-[#DE7452] font-semibold">
                            {app.doctor?.specialization || "General Medicine"}
                          </p>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-6 text-xs text-stone-600 whitespace-nowrap">
                        <div className="font-bold text-stone-800">
                          {new Date(app.appointmentDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-stone-400 mt-0.5">{app.appointmentTime}</div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-6 text-xs text-stone-700 max-w-xs">
                        <p className="truncate font-medium">{app.reason}</p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>

                      {/* Admin Actions: Approve or Cancel */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve Button */}
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
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Approve Appointment as Admin"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Cancel Button */}
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
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Cancel Appointment as Admin"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                          )}

                          {isApproved && isCancelled && (
                            <span className="text-xs text-stone-400 italic">No actions</span>
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
