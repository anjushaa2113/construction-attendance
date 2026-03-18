import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";

// Admin Pages
import AdminDashboard from "../pages/admin/DashboardPage";
import StaffDirectory from "../pages/admin/StaffDirectoryPage";
import AddStaff from "../pages/admin/AddStaffPage";
import AttendanceApproval from "../pages/admin/AttendanceApprovalPage";
import LeaveApproval from "../pages/admin/LeaveApprovalPage";
import AdminReports from "../pages/admin/ReportsPage";
import AdminSettings from "../pages/admin/SettingsPage";
import AuditLogs from "../pages/admin/AuditLogsPage"; // ← added

// Employee Pages
import EmployeeDashboard from "../pages/employee/DashboardPage";
import AttendanceCorrection from "../pages/employee/AttendanceCorrectionPage";
import LeaveRequest from "../pages/employee/LeaveRequestPage";
import EmployeeReports from "../pages/employee/ReportsPage";
import EmployeeSettings from "../pages/employee/SettingsPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/login" replace />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/admin",
        element: (
            <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace /> },
            { path: "dashboard",   element: <AdminDashboard /> },
            { path: "staff",       element: <StaffDirectory /> },
            { path: "staff/add",   element: <AddStaff /> },
            { path: "attendance",  element: <AttendanceApproval /> },
            { path: "leaves",      element: <LeaveApproval /> },
            { path: "reports",     element: <AdminReports /> },
            { path: "settings",    element: <AdminSettings /> },
            { path: "audit-logs",  element: <AuditLogs /> }, // ← added
        ],
    },
    {
        path: "/employee",
        element: (
            <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/employee/dashboard" replace /> },
            { path: "dashboard",             element: <EmployeeDashboard /> },
            { path: "attendance-correction", element: <AttendanceCorrection /> },
            { path: "leave-request",         element: <LeaveRequest /> },
            { path: "reports",               element: <EmployeeReports /> },
            { path: "settings",              element: <EmployeeSettings /> },
        ],
    },
    {
        path: "*",
        element: <div>404 Not Found</div>,
    },
]);

export default router;