public class CreateAttendanceCorrectionDto
{
    public Guid AttendanceId { get; set; }
    public TimeSpan? RequestedCheckIn { get; set; }
    public TimeSpan? RequestedCheckOut { get; set; }
    public string Reason { get; set; } = string.Empty;
}