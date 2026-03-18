public class AttendanceDetailedDto
{
    public string EmployeeName { get; set; } = default!;
    public Guid EmployeeId { get; set; }
    public DateTime AttendanceDate { get; set; }  // renamed from Date
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }
    public double HoursWorked { get; set; }
    public string Status { get; set; } = default!;
}