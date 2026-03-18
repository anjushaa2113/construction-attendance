public class LeaveType
{
    public Guid LeaveTypeId { get; set; }
    public string LeaveName { get; set; } = null!;
    public int MaxDaysPerYear { get; set; }

    public ICollection<Leave>? Leaves { get; set; }

    // Optional alias for backwards compatibility
    public string Type => LeaveName;
}
