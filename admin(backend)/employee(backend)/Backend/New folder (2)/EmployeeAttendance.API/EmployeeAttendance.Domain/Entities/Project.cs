public class Project
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }

    public ICollection<EmployeeProject>? EmployeeProjects { get; set; }
}
