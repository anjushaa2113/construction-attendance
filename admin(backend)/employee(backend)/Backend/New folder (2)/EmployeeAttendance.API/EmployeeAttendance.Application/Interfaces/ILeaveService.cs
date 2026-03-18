using EmployeeAttendance.Application.DTO;

namespace EmployeeAttendance.Application.Interfaces
{
    public interface ILeaveService
    {
        Task CreateLeaveAsync(Guid employeeId, CreateLeaveDto dto);

        Task<List<LeaveDto>> GetEmployeeLeavesAsync(Guid employeeId);

        Task<bool> ApproveLeaveAsync(Guid leaveId, Guid adminId);

        Task<bool> RejectLeaveAsync(Guid leaveId, Guid adminId);
    }
}