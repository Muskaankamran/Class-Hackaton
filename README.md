# 🏥 AuraMed Clinic Appointment Management System (MERN Stack)

A role-based Clinic Appointment Management System built for the Hackathon with **Admin**, **Doctor**, and **Patient** roles.

---

## 🌟 Quick Demo Credentials (1-Click Fill on Login Page)

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@clinic.com` | `admin123` | Stats cards, Manage Users, Add Doctors, Deactivate/Delete, All Appointments |
| **Doctor** | `ahmed@clinic.com` | `doctor123` | View Profile, Assigned Requests, Patient Details, Approve / Reject |
| **Patient** | `patient@clinic.com` | `patient123` | Search Doctors, Book Appointment, Status Badges, Cancel Pending |

---

## 🚀 How to Run the Application

### 1. Backend (`/backend`)
```bash
cd backend
npm install
npm run dev # or npm start
```
*Backend runs on `http://localhost:3000` with MongoDB Atlas connection.*

### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with Vite and Tailwind CSS.*

---

## 🏗️ Architecture & Technologies

- **MongoDB / Mongoose**:
  - `User`: Roles (`admin`, `doctor`, `patient`), `name`, `email`, `password`, `specialization`, `experience`, `isActive`, `avatar`.
  - `Appointment`: `patient` (ref User), `doctor` (ref User), `appointmentDate`, `appointmentTime`, `reason`, `status` (`pending`, `approved`, `rejected`, `cancelled`).
  - `DoctorAvailability` *(Bonus)*: `doctor` (ref User), `availableDays`, `startTime`, `endTime`.
- **Express.js & Node.js**: REST API with JWT authentication and role-based middleware (`requireAdmin`, `requireDoctor`, `requirePatient`).
- **React 19 & Vite**: Modern responsive UI with React Router v7.
- **Tailwind CSS & Lucide Icons**: Clean medical UI.
- **GSAP**: Staggered animations across all cards, headers, and form transitions.

---

## 📋 Required Pages & Routes

| Page | Access | Route |
| :--- | :--- | :--- |
| Login | Public | `/login` |
| Register | Public | `/register` |
| Patient Dashboard | Patient | `/patient/dashboard` |
| Book Appointment | Patient | `/patient/book` |
| My Appointments | Patient | `/patient/appointments` |
| Doctor Dashboard | Doctor | `/doctor/dashboard` |
| Appointment Requests | Doctor | `/doctor/requests` |
| Admin Dashboard | Admin | `/admin/dashboard` |
| Manage Users | Admin | `/admin/users` |
| All Appointments | Admin | `/admin/appointments` |

---

## 🔒 Business Rules & Features Implemented

1. **Authentication & JWT**: Passwords hashed with `bcryptjs`. Protected endpoints guarded by JWT bearer tokens and cookies.
2. **Strict Authorization**:
   - Only patients can book appointments.
   - Only assigned doctors can approve or reject their own appointments.
   - A doctor cannot approve/reject another doctor's appointments.
   - Patients can view only their own appointments.
   - Patients can cancel only appointments that are still "pending".
   - Admins can view all users, manage accounts (activate/deactivate/delete), and inspect all appointments.
3. **Double Booking Prevention**:
   - A patient cannot book two appointments with the same doctor at the same date and time.
   - Approved appointments block duplicate bookings for that time slot.
4. **Past Date Prevention**: Patients cannot book appointments in the past.

---

## 🏆 Bonus Challenges Completed

- [x] **Doctor profile pictures & avatars**
- [x] **Filter doctors by specialization** (Cardiologist, Neurologist, Dermatologist, etc.)
- [x] **Search appointments by patient name** on admin and patient views
- [x] **Dashboard stats cards** with counts for each role
- [x] **Prevent booking in the past** (frontend date picker + backend validation)
- [x] **Prevent double booking** of an approved appointment
- [x] **Appointment confirmation notifications & alerts**
- [x] **GSAP animations** on page load, cards, and transitions
