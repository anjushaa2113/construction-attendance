public class EmployeeProfile
{
    public int EmployeeProfileId { get; set; }
    public Guid EmployeeId { get; set; }
    public string PhoneNumber { get; set; } = null!;
    public string Department { get; set; } = null!;
    public string Designation { get; set; } = null!;
    public DateTime DateOfJoining { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Address { get; set; } = null!;

    public Employee Employee { get; set; } = null!;
}
