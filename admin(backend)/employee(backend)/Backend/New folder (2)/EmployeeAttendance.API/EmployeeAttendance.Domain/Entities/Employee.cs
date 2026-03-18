using EmployeeAttendance.Domain.Entities;

public class Employee
{
    public Guid EmployeeId { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;   // ✅ FIXED
    public bool IsActive { get; set; }                 // ✅ ADD THIS

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<AttendanceCorrection> AttendanceCorrections { get; set; } = new List<AttendanceCorrection>();
    public ICollection<Leave> Leaves { get; set; } = new List<Leave>();
    public ICollection<EmployeeProject> EmployeeProjects { get; set; } = new List<EmployeeProject>();

    public EmployeeProfile Profile { get; set; } = null!;
}