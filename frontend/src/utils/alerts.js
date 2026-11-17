import Swal from "sweetalert2";

export const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showSuccessToast = (title) => {
  return Toast.fire({
    icon: "success",
    title,
  });
};

export const showErrorToast = (title) => {
  return Toast.fire({
    icon: "error",
    title,
  });
};

export const showSuccessAlert = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonColor: "#EF4444",
    customClass: {
      popup: "rounded-3xl border border-red-100 shadow-xl bg-white",
      confirmButton: "rounded-xl font-bold px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20",
    },
  });
};

export const showErrorAlert = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonColor: "#DC2626",
    customClass: {
      popup: "rounded-3xl border border-rose-100 shadow-xl bg-white",
      confirmButton: "rounded-xl font-bold px-5 py-2.5 bg-red-600 text-white",
    },
  });
};

export const showAccessDeniedAlert = (message = "Access Denied: Only administrators have permission to access the Admin Panel.") => {
  return Swal.fire({
    title: "🔒 Restricted Access",
    text: message,
    icon: "warning",
    confirmButtonColor: "#EF4444",
    confirmButtonText: "Return to Safe Area",
    customClass: {
      popup: "rounded-3xl border border-red-100 shadow-xl bg-white",
      confirmButton: "rounded-xl font-bold px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white",
    },
  });
};

export const showConfirmDialog = async ({
  title,
  text,
  confirmButtonText = "Yes, proceed",
  confirmButtonColor = "#EF4444",
  icon = "warning",
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: "#94A3B8",
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    customClass: {
      popup: "rounded-3xl border border-red-100 shadow-xl bg-white",
      confirmButton: "rounded-xl font-bold px-5 py-2.5",
      cancelButton: "rounded-xl font-bold px-5 py-2.5 bg-slate-100 text-slate-700",
    },
  });

  return result.isConfirmed;
};

export default Swal;
