import React, { useState, useEffect, useRef } from "react";
import API from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import gsap from "gsap";
import {
  Users,
  UserPlus,
  Trash2,
  Power,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Stethoscope,
  Mail,
  Award,
  Shield,
  Lock,
} from "lucide-react";
import {
  showConfirmDialog,
  showSuccessToast,
  showSuccessAlert,
  showErrorAlert,
} from "../utils/alerts";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add doctor form state
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "General Medicine",
    experience: 3,
    avatar: "",
  });

  const containerRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url =
        roleFilter === "all" ? "/api/admin/users" : `/api/admin/users?role=${roleFilter}`;
      const res = await API.get(url);
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      showErrorAlert("Error", "Failed to load users list from server.");
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

  const handleToggleStatus = async (userId, currentStatus, userName) => {
    const nextStatus = !currentStatus;
    const confirmed = await showConfirmDialog({
      title: `${nextStatus ? "Activate" : "Deactivate"} Account?`,
      text: `Are you sure you want to ${nextStatus ? "activate" : "deactivate"} account for "${userName}"? ${
        !nextStatus ? "The user will not be able to log in while deactivated." : ""
      }`,
      confirmButtonText: `Yes, ${nextStatus ? "Activate" : "Deactivate"}`,
      confirmButtonColor: nextStatus ? "#10b981" : "#E07A5F",
      icon: nextStatus ? "info" : "warning",
    });

    if (!confirmed) return;

    try {
      await API.patch(`/api/admin/users/${userId}/status`, {
        isActive: nextStatus,
      });
      showSuccessToast(
        `User "${userName}" has been ${nextStatus ? "activated" : "deactivated"}.`
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: nextStatus } : u))
      );
    } catch (err) {
      showErrorAlert(
        "Update Failed",
        err.response?.data?.message || "Failed to update user status."
      );
    }
  };

  const handleDeleteUser = async (userId, userName, userRole) => {
    const confirmed = await showConfirmDialog({
      title: `Delete ${userRole === "doctor" ? "Doctor" : "Patient"}?`,
      text: `Are you sure you want to permanently delete "${userName}"? All related appointments and records will be deleted.`,
      confirmButtonText: "Yes, Delete Permanently",
      confirmButtonColor: "#E07A5F",
      icon: "warning",
    });

    if (!confirmed) return;

    try {
      await API.delete(`/api/admin/users/${userId}`);
      showSuccessToast(`User "${userName}" was deleted successfully.`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      showErrorAlert(
        "Deletion Failed",
        err.response?.data?.message || "Failed to delete user."
      );
    }
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post("/api/admin/doctors", doctorForm);
      showSuccessAlert(
        "Doctor Added Successfully! 🎉",
        `Dr. ${res.data?.doctor?.name} (${doctorForm.specialization}) has been registered and is now available for patient appointments.`
      );
      setModalOpen(false);
      setDoctorForm({
        name: "",
        email: "",
        password: "",
        specialization: "General Medicine",
        experience: 3,
        avatar: "",
      });
      fetchUsers();
    } catch (err) {
      showErrorAlert(
        "Failed to Add Doctor",
        err.response?.data?.message || "Could not create doctor account. Please check inputs."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.specialization?.toLowerCase().includes(term)
    );
  });

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 gsap-fade">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0EB] text-[#C45E3A] border border-[#FAD9CB] text-xs font-bold uppercase tracking-wider">
              Admin Control Panel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Manage Clinic Users
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Supervise registered patients, add new medical doctors, and toggle access permissions
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F5A281] to-[#E07A5F] hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-md shadow-[#F5A281]/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Search & Role Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#F2E5DF] shadow-2xs gsap-fade">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "doctor", "patient", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                roleFilter === r
                  ? "bg-[#E07A5F] text-white shadow-2xs"
                  : "text-stone-600 hover:bg-[#FAF0EB]"
              }`}
            >
              {r === "all" ? "All Users" : `${r}s`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F] w-full sm:w-72"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-[#F2E5DF] overflow-hidden shadow-2xs gsap-fade">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-[#FAF7F5] rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-700 font-bold">No users match your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F5] border-b border-[#F2E5DF] text-xs font-bold uppercase text-stone-500">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Specialization / Experience</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7EFEA]">
                {filteredUsers.map((u) => {
                  const isAdminUser = u.role === "admin";
                  const isActive = u.isActive !== false;

                  return (
                    <tr key={u._id} className="hover:bg-[#FAF7F5] transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#FAF0EB] text-[#C45E3A] border border-[#FAD9CB] flex items-center justify-center font-bold text-sm">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{u.name}</p>
                            <p className="text-xs text-stone-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6">
                        <StatusBadge status={u.role} />
                      </td>

                      {/* Specialization / Exp */}
                      <td className="py-4 px-6 text-xs text-stone-600">
                        {u.role === "doctor" ? (
                          <div>
                            <span className="font-semibold text-stone-800">
                              {u.specialization || "General Medicine"}
                            </span>
                            <span className="text-stone-400 block">{u.experience || 0} years exp</span>
                          </div>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge status={isActive ? "active" : "inactive"} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {!isAdminUser ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Activate / Deactivate Toggle Button */}
                            <button
                              onClick={() => handleToggleStatus(u._id, isActive, u.name)}
                              title={isActive ? "Deactivate User" : "Activate User"}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                isActive
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{isActive ? "Deactivate" : "Activate"}</span>
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name, u.role)}
                              title="Delete User"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Protected (Owner)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Doctor Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F2E5DF] relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#F7EFEA]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0EB] text-[#DE7452] flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Add New Doctor Account</h3>
                  <p className="text-xs text-stone-500">Register a qualified clinic practitioner</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Doctor Full Name <span className="text-[#DE7452]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ahmed"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Email Address <span className="text-[#DE7452]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ahmed@clinic.com"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Initial Password <span className="text-[#DE7452]">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Specialization <span className="text-[#DE7452]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiologist"
                    value={doctorForm.specialization}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, specialization: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={doctorForm.experience}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, experience: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 bg-[#FAF7F5] border border-[#EFE5E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A281]/30 focus:border-[#E07A5F]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#F7EFEA]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-[#FAF0EB] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#F5A281] to-[#E07A5F] hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-md shadow-[#F5A281]/25 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Adding Doctor..." : "Create Doctor Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
