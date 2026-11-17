import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API from "../utils/api";
import gsap from "gsap";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Award,
  Stethoscope,
} from "lucide-react";
import { showSuccessAlert, showErrorAlert } from "../utils/alerts";

export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get("doctorId");

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId || "");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00 AM");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Today in YYYY-MM-DD for min date
  const today = new Date().toISOString().split("T")[0];

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/api/doctors");
      setDoctors(res.data?.doctors || []);
      if (preselectedDoctorId) {
        setSelectedDoctorId(preselectedDoctorId);
      } else if (res.data?.doctors?.length > 0) {
        setSelectedDoctorId(res.data.doctors[0]._id);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".gsap-fade"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, []);

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!selectedDoctorId) {
      showErrorAlert("Validation Error", "Please select a doctor for your appointment.");
      return;
    }
    if (!appointmentDate) {
      showErrorAlert("Validation Error", "Please select an appointment date.");
      return;
    }
    if (appointmentDate < today) {
      showErrorAlert("Invalid Date", "Cannot book an appointment for a past date.");
      return;
    }
    if (!reason.trim()) {
      showErrorAlert("Validation Error", "Please describe the reason for your visit.");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/api/appointments", {
        doctorId: selectedDoctorId,
        appointmentDate,
        appointmentTime,
        reason: reason.trim(),
      });

      const bookedDoctorName = res.data?.appointment?.doctor?.name || selectedDoctor?.name || "the Doctor";

      await showSuccessAlert(
        "Appointment Requested! 🎉",
        `Your visit with ${bookedDoctorName} on ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime} has been submitted! It is now pending review.`
      );

      setSuccess({
        message: "Appointment successfully requested!",
        appointment: res.data.appointment,
      });

      setReason("");
      navigate("/patient/appointments");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to book appointment. Please verify the time slot and try again.";
      setError(msg);
      showErrorAlert("Booking Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="gsap-fade">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Book an Appointment
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Select a doctor, choose your preferred slot, and submit your appointment request
        </p>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-6 bg-[#FAF0EB] border border-[#FAD9CB] rounded-3xl text-[#9E4522] gsap-fade shadow-sm">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-[#E07A5F] flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-stone-900">{success.message}</h3>
              <p className="text-sm text-stone-700">
                Your request with{" "}
                <span className="font-semibold">{success.appointment?.doctor?.name}</span> for{" "}
                <span className="font-semibold">
                  {new Date(success.appointment?.appointmentDate).toLocaleDateString()} at{" "}
                  {success.appointment?.appointmentTime}
                </span>{" "}
                is currently <span className="font-semibold uppercase text-[#DE7452]">Pending</span> doctor review.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link
                  to="/patient/appointments"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#F5A281] to-[#E07A5F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  View My Appointments
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="px-4 py-2 bg-white text-stone-700 border border-[#F2E5DF] hover:bg-stone-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Book Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-sm gsap-fade">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Booking Form */}
      <div className="bg-white border border-[#F0E4DE] rounded-3xl p-6 sm:p-8 shadow-xs gsap-fade">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-2">
              Select Doctor <span className="text-[#DE7452]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoctorId(doc._id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? "border-[#F5A281] bg-[#FAF0EB]/60 shadow-xs ring-2 ring-[#F5A281]/20"
                        : "border-[#F2E5DF] hover:border-[#E8D6CE] bg-white"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#FAF0EB] text-[#C45E3A] border border-[#FAD9CB] flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {doc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-stone-900 text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-[#DE7452] font-semibold truncate">
                        {doc.specialization || "General Medicine"}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {doc.experience || 1}+ yrs exp
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-2">
                Appointment Date <span className="text-[#DE7452]">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  min={today}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] transition-all text-sm cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Past dates are automatically disabled</p>
            </div>

            {/* Time Slot Picker */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-2">
                Appointment Time <span className="text-[#DE7452]">*</span>
              </label>
              <div className="relative">
                <Clock className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] transition-all text-sm cursor-pointer"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Standard clinic slots (30 min)</p>
            </div>
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-2">
              Reason for Visit <span className="text-[#DE7452]">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or visit reason (e.g. routine checkup, persistent cough, chest pain, follow-up)..."
                className="w-full p-4 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] transition-all text-sm"
              ></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-[#F5A281] to-[#E07A5F] hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-[#F5A281]/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <span>Confirm & Request Appointment</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
