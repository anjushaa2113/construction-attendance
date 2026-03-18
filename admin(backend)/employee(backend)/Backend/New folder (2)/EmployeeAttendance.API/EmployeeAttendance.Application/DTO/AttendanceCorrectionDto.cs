// EmployeeAttendance.Application.DTOs/AttendanceCorrectionDto.cs
using System;
using EmployeeAttendance.Domain.Entities;  // Optional if mapping entities to DTOs


namespace EmployeeAttendance.Application.DTOs
{
    public class AttendanceCorrectionDto
    {
        public Guid CorrectionId { get; set; }
        public Guid AttendanceId { get; set; }
        public Guid EmployeeId { get; set; }
        public TimeSpan? RequestedCheckIn { get; set; }
        public TimeSpan? RequestedCheckOut { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    public class AttendanceCorrectionRequestDto
    {
        public Guid AttendanceId { get; set; }
        public Guid EmployeeId { get; set; }
        public TimeSpan? RequestedCheckIn { get; set; }
        public TimeSpan? RequestedCheckOut { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
