namespace EmployeeAttendance.API.Models
{
    public class EmployeeDashboardDto
    {
        public string EmployeeName { get; set; } = null!;
        public string EmployeeEmail { get; set; } = null!;

        public int TotalAttendance { get; set; }
        public AttendanceChartDto AttendanceChart { get; set; } = null!;
        public int PendingCorrections { get; set; }

        public List<LeaveDto> UpcomingLeaves { get; set; } = new();
        public List<ProjectDto> Projects { get; set; } = new();
    }

    public class AttendanceChartDto
    {
        public int Present { get; set; }
        public int Absent { get; set; }
        public int Leave { get; set; }
    }

    // ✅ FIX: Status property added
    public class LeaveDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = null!;
        public string Status { get; set; } = null!;
    }

    public class ProjectDto
    {
        public string ProjectName { get; set; } = null!;
        public string Status { get; set; } = null!;
    }
}
