using EmployeeAttendance.Application.Interfaces;
using EmployeeAttendance.Domain.Entities;
using EmployeeAttendance.Domain.Enums;
using EmployeeAttendance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmployeeAttendance.Infrastructure.Services
{
    public class AttendanceCorrectionService : IAttendanceCorrectionService
    {
        private readonly AppDbContext _context;

        public AttendanceCorrectionService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all attendance corrections for an employee.
        /// Optional status filter using enum.
        /// </summary>
        public async Task<IEnumerable<AttendanceCorrection>> GetAllAsync(
            Guid? employeeId = null,
            CorrectionStatus? status = null)
        {
            var query = _context.AttendanceCorrections
                                .Include(ac => ac.Employee)
                                .Include(ac => ac.Attendance)
                                .AsQueryable();

            if (employeeId.HasValue)
                query = query.Where(ac => ac.EmployeeId == employeeId.Value);

            if (status.HasValue)
                query = query.Where(ac => ac.Status == status.Value);

            return await query.ToListAsync();
        }

        /// <summary>
        /// Create a new attendance correction
        /// </summary>
        public async Task<AttendanceCorrection> CreateAsync(AttendanceCorrection correction)
        {
            // Default status = Pending if not set
            if (correction.Status == 0)
                correction.Status = CorrectionStatus.Pending;

            _context.AttendanceCorrections.Add(correction);
            await _context.SaveChangesAsync();
            return correction;
        }

        /// <summary>
        /// Approve a correction
        /// </summary>
        public async Task<bool> ApproveAsync(Guid correctionId, Guid reviewerId)
        {
            var correction = await _context.AttendanceCorrections.FindAsync(correctionId);
            if (correction == null) return false;

            correction.Status = CorrectionStatus.Approved;
            correction.ReviewedAt = DateTime.UtcNow;
            correction.ReviewedBy = reviewerId;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Reject a correction
        /// </summary>
        public async Task<bool> RejectAsync(Guid correctionId, Guid reviewerId)
        {
            var correction = await _context.AttendanceCorrections.FindAsync(correctionId);
            if (correction == null) return false;

            correction.Status = CorrectionStatus.Rejected;
            correction.ReviewedAt = DateTime.UtcNow;
            correction.ReviewedBy = reviewerId;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<AttendanceCorrection>> GetPendingAsync(Guid? employeeId = null)
        {
            var query = _context.AttendanceCorrections
                                .Include(ac => ac.Employee)
                                .Include(ac => ac.Attendance)
                                .Where(ac => ac.Status == CorrectionStatus.Pending)
                                .AsQueryable();

            if (employeeId.HasValue)
                query = query.Where(ac => ac.EmployeeId == employeeId.Value);

            return await query.ToListAsync();
        }

        /// <summary>
        /// Optional: Get only Pending corrections for an employee
        /// </summary>

    }
}