import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import gsap from "gsap";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  User,
  Award,
  ChevronRight,
  PlusCircle,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [specialization]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, appRes] = await Promise.all([
        API.get(`/api/doctors?specialization=${specialization}`),
        API.get("/api/appointments/my"),
      ]);
      setDoctors(docRes.data?.doctors || []);
      setMyAppointments(appRes.data?.appointments || []);
    } catch (err) {
      console.error("Error fetching patient dashboard data:", err);
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

  const filteredDoctors = doctors.filter((doc) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(term))
    );
  });

  const specializationsList = [
    "all",
    "Cardiologist",
    "Dermatologist",
    "Neurologist",
    "Pediatrician",
    "General Medicine",
    "Dentist",
    "Orthopedic",
  ];

  const pendingCount = myAppointments.filter((a) => a.status === "pending").length;
  const approvedCount = myAppointments.filter((a) => a.status === "approved").length;
  const totalCount = myAppointments.length;

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner - Soft gradient #F5A281 to contrast #E07A5F and subtle sage */}
      <div className="bg-gradient-to-r from-[#F5A281] via-[#E68A6E] to-[#73938C] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#F5A281]/15 gsap-card relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <Activity className="w-3.5 h-3.5" />
            Patient Health Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-white/90 text-sm sm:text-base leading-relaxed font-medium">
            Welcome to AuraMed Health Clinic. Find your preferred specialist, book an appointment, and
            track your consultation schedule with ease.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/patient/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#C45E3A] font-bold rounded-xl shadow-md hover:bg-[#FFF7F4] transition-all text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#E07A5F]" />
              Book New Appointment
            </Link>
            <Link
              to="/patient/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 backdrop-blur-xs transition-all text-sm cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              View My Appointments ({totalCount})
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#F2E5DF] shadow-2xs flex items-center justify-between gsap-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Appointments
            </p>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FDF1EB] text-[#DE7452] flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F2E5DF] shadow-2xs flex items-center justify-between gsap-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Approved
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{approvedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F2E5DF] shadow-2xs flex items-center justify-between gsap-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Pending Approval
            </p>
            <p className="text-2xl font-extrabold text-[#D97757] mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#D97757] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Available Doctors Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Available Doctors</h2>
            <p className="text-sm text-stone-500">
              Explore qualified medical practitioners and book a visit
            </p>
          </div>

          {/* Search & Specialization Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-[#EFE5E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] w-full sm:w-64"
              />
            </div>

            <div className="relative">
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#EFE5E0] rounded-xl text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] cursor-pointer"
              >
                <option value="all">All Specializations</option>
                {specializationsList
                  .filter((s) => s !== "all")
                  .map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white p-6 rounded-3xl border border-[#F2E5DF] animate-pulse h-48"
              ></div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#F2E5DF] p-12 text-center">
            <User className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-700 font-semibold text-base">No doctors found</p>
            <p className="text-stone-400 text-sm mt-1">
              Try adjusting your search terms or specialization filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-3xl border border-[#F2E5DF] p-6 shadow-2xs hover:shadow-md transition-all hover:border-[#FAD8C9] flex flex-col justify-between gsap-card group"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FDF1EB] to-[#FAF2EE] border border-[#FAD9CB] flex items-center justify-center font-extrabold text-[#C45E3A] text-xl flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                      {doc.avatar ? (
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{doc.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg group-hover:text-[#DE7452] transition-colors">
                        {doc.name}
                      </h3>
                      <p className="text-[#DE7452] text-sm font-semibold">
                        {doc.specialization || "General Medicine"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-500 font-medium">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{doc.experience || 1}+ Years Experience</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#F7EFEA] flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-medium">Mon - Fri (09:00 - 17:00)</span>
                  <Link
                    to={`/patient/book?doctorId=${doc._id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#FAF0EB] hover:bg-gradient-to-r hover:from-[#F5A281] hover:to-[#E07A5F] text-[#C45E3A] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Book Visit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Appointments Preview */}
      {myAppointments.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#F2E5DF] p-6 shadow-2xs space-y-4 gsap-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Recent Appointments</h2>
            <Link
              to="/patient/appointments"
              className="text-xs font-bold text-[#E07A5F] hover:text-[#C45E3A] flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#F7EFEA]">
            {myAppointments.slice(0, 3).map((app) => (
              <div key={app._id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF0EB] text-[#C45E3A] flex items-center justify-center font-bold text-sm">
                    {app.doctor?.name ? app.doctor.name.charAt(0) : "D"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{app.doctor?.name}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(app.appointmentDate).toLocaleDateString()} at {app.appointmentTime}
                    </p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
