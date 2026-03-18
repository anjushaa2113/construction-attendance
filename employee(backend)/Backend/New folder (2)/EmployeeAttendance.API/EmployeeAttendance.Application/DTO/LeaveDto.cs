namespace EmployeeAttendance.Application.DTO
{
    public class LeaveDto
    {
        public Guid LeaveId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string LeaveTypeName { get; set; } = null!;
    }
}