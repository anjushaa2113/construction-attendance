using EmployeeAttendance.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeAttendance.Application.Interfaces
{
    public interface IEmployeeReportService
    {
        Task<AttendanceSummaryDto> GetAttendanceSummaryAsync(Guid employeeId, DateTime from, DateTime to);
        Task<List<AttendanceDetailedDto>> GetAttendanceDetailedAsync(Guid employeeId, DateTime from, DateTime to);
        Task<List<MyLeaveDto>> GetMyLeavesAsync(Guid employeeId);
    }
}
