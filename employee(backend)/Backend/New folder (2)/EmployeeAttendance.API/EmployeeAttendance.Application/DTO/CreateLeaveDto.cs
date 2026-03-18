namespace EmployeeAttendance.Application.DTO
{
    public class CreateLeaveDto
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string Reason { get; set; } = null!;
        public Guid LeaveTypeId { get; set; }   // ✅ must be Guid
    }
}