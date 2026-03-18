using EmployeeAttendance.Domain.Entities;
using EmployeeAttendance.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeAttendance.Application.Interfaces
{
    public interface IAttendanceCorrectionService
    {
        // Get all corrections, optional filter by status
        Task<IEnumerable<AttendanceCorrection>> GetAllAsync(Guid? employeeId = null, CorrectionStatus? status = null);

        // Create a new correction
        Task<AttendanceCorrection> CreateAsync(AttendanceCorrection correction);

        // Approve a correction with reviewer
        Task<bool> ApproveAsync(Guid correctionId, Guid reviewerId);

        // Reject a correction with reviewer
        Task<bool> RejectAsync(Guid correctionId, Guid reviewerId);

        // Optional: get only pending corrections
        Task<IEnumerable<AttendanceCorrection>> GetPendingAsync(Guid? employeeId = null);
    }
}