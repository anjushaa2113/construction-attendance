using EmployeeAttendance.Domain.Enums;

namespace EmployeeAttendance.Domain.Entities
{
    public class AttendanceCorrection
    {
        public Guid CorrectionId { get; set; }

        public Guid AttendanceId { get; set; }
        public Guid EmployeeId { get; set; }

        public Attendance? Attendance { get; set; }
        public Employee? Employee { get; set; }

        // ❌ REMOVE THIS
        // public DateTime RequestedDate { get; set; }

        public TimeSpan? OriginalCheckIn { get; set; }
        public TimeSpan? OriginalCheckOut { get; set; }

        public TimeSpan? RequestedCheckIn { get; set; }
        public TimeSpan? RequestedCheckOut { get; set; }

        public string Reason { get; set; } = string.Empty;
        public CorrectionStatus Status { get; set; }  // new
        // ✅ Matches DB column
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }
        public Guid? ReviewedBy { get; set; }
    }
}
