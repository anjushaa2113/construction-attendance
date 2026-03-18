public class EmployeeProject
{
    public Guid EmployeeProjectId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ProjectId { get; set; }
    public DateTime AssignedAt { get; set; }

    public Employee Employee { get; set; } = null!;
    public Project Project { get; set; } = null!;
}
