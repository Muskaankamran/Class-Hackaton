import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import gsap from "gsap";
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  XCircle,
  CheckCircle2,
  PlusCircle,
  FileText,
  Filter,
} from "lucide-react";
import {
  showConfirmDialog,
  showSuccessToast,
  showErrorAlert,
} from "../utils/alerts";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/appointments/my"
          : `/api/appointments/my?status=${statusFilter}`;
      const res = await API.get(url);
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      showErrorAlert("Error", "Failed to load appointments from server.");
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

  const handleCancel = async (id, doctorName) => {
    const confirmed = await showConfirmDialog({
      title: "Cancel Appointment?",
      text: `Are you sure you want to cancel your pending appointment with ${doctorName || "the Doctor"}?`,
      confirmButtonText: "Yes, Cancel Appointment",
      confirmButtonColor: "#E07A5F",
      icon: "warning",
    });

    if (!confirmed) return;

    setCancellingId(id);

    try {
      await API.patch(`/api/appointments/${id}/cancel`);
      showSuccessToast("Appointment has been cancelled successfully.");
      // Update state
      setAppointments((prev) =>
        prev.map((app) => (app._id === id ? { ...app, status: "cancelled" } : app))
      );
    } catch (err) {
      showErrorAlert(
        "Cancellation Failed",
        err.response?.data?.message || "Only pending appointments can be cancelled."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 gsap-fade">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Track your appointment status and manage scheduled consultations
          </p>
        </div>
        <Link
          to="/patient/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F5A281] to-[#E07A5F] hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-xs shadow-[#F5A281]/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Book Appointment
        </Link>
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

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white p-6 rounded-3xl border border-[#F2E5DF] animate-pulse h-28"
            ></div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#F2E5DF] p-12 text-center gsap-fade">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-700 font-bold text-base">No appointments found</p>
          <p className="text-stone-400 text-sm mt-1">
            {statusFilter === "all"
              ? "You haven't booked any appointments yet."
              : `No appointments with status '${statusFilter}'.`}
          </p>
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#FAF0EB] text-[#C45E3A] font-bold rounded-xl text-xs hover:bg-[#F5E2D9] transition-colors"
          >
            Book your first appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => {
            const isPending = app.status === "pending";
            return (
              <div
                key={app._id}
                className="bg-white rounded-3xl border border-[#F2E5DF] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 gsap-fade"
              >
                {/* Doctor & Date info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FAF0EB] to-[#FCECE5] border border-[#FAD9CB] flex items-center justify-center font-bold text-[#C45E3A] text-xl flex-shrink-0">
                    {app.doctor?.name ? app.doctor.name.charAt(0) : "D"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900">
                        {app.doctor?.name || "Doctor"}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>

                    <p className="text-xs text-[#DE7452] font-semibold">
                      {app.doctor?.specialization || "General Medicine"}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(app.appointmentDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {app.appointmentTime}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-stone-600 bg-[#FAF7F5] rounded-xl p-2.5 border border-[#F2E5DF]">
                      <span className="font-semibold text-stone-700">Reason:</span> {app.reason}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center sm:self-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F7EFEA]">
                  {isPending ? (
                    <button
                      onClick={() => handleCancel(app._id, app.doctor?.name)}
                      disabled={cancellingId === app._id}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>{cancellingId === app._id ? "Cancelling..." : "Cancel Appointment"}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-stone-400 italic">
                      {app.status === "approved"
                        ? "Confirmed visit"
                        : app.status === "cancelled"
                        ? "Cancelled"
                        : "Rejected"}
                    </span>
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
