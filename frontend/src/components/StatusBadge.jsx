import React from "react";

export default function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();

  const styles = {
    pending: "bg-amber-50/80 text-amber-800 border-amber-200/80 ring-amber-500/20",
    approved: "bg-emerald-50/80 text-emerald-800 border-emerald-200/80 ring-emerald-500/20",
    rejected: "bg-rose-50/80 text-rose-800 border-rose-200/80 ring-rose-500/20",
    cancelled: "bg-stone-100 text-stone-700 border-stone-200 ring-stone-400/20",
    active: "bg-emerald-50/80 text-emerald-800 border-emerald-200/80 ring-emerald-500/20",
    inactive: "bg-stone-100 text-stone-600 border-stone-300 ring-stone-400/20",
    admin: "bg-[#FDF1EB] text-[#C45E3A] border-[#FAD9CB]",
    doctor: "bg-[#EEF5F3] text-[#557D74] border-[#D4E5E1]",
    patient: "bg-[#F7EFE9] text-[#9A604A] border-[#EAD8CC]",
  };

  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
    active: "Active",
    inactive: "Deactivated",
    admin: "Admin",
    doctor: "Doctor",
    patient: "Patient",
  };

  const badgeClass =
    styles[normalized] || "bg-stone-50 text-stone-700 border-stone-200 ring-stone-500/20";
  const label = labels[normalized] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass} shadow-2xs capitalize`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {label}
    </span>
  );
}
