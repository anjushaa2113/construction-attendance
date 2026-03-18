public class MyLeaveDto
{
    public Guid LeaveId { get; set; }
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public string Type { get; set; } = null!;
    public string Reason { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime AppliedAt { get; set; }
}
