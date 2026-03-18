public class Attendance
{
    public Guid AttendanceId { get; set; }
    public Guid EmployeeId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }
    public string Status { get; set; } = "Present";
    public DateTime CreatedAt { get; set; }

    public Employee Employee { get; set; } = null!;
}
