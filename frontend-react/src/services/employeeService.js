import apiClient from "./apiClient";

export const getEmployeeDashboard = () => {
  return apiClient.get("/Employee/dashboard");
};

// Fetch monthly attendance summary + per-day breakdown
// month: 1-12, year: e.g. 2026
export const getMonthlyAttendance = (month, year) => {
  return apiClient.get("/Employee/attendance/monthly", {
    params: { month, year },
  });
};