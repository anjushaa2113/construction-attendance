public class AttendanceSummaryDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int TotalDays { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int LeaveDays { get; set; }
    public double WorkingHours { get; set; }
}
