using EmployeeAttendance.Application.Interfaces;
using EmployeeAttendance.Application.DTO;
using EmployeeAttendance.Domain.Entities;
using EmployeeAttendance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EmployeeAttendance.Infrastructure.Services
{
    public class LeaveService : ILeaveService   // ✅ MUST implement
    {
        private readonly AppDbContext _context;

        public LeaveService(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateLeaveAsync(Guid employeeId, CreateLeaveDto dto)
        {
            var leave = new Leave
            {
                LeaveId = Guid.NewGuid(),
                EmployeeId = employeeId,
                StartDate = dto.FromDate,
                EndDate = dto.ToDate,
                Reason = dto.Reason,
                LeaveTypeId = dto.LeaveTypeId,
                Status = "Pending",
                AppliedAt = DateTime.UtcNow
            };

            await _context.Leaves.AddAsync(leave);
            await _context.SaveChangesAsync();
        }

        public async Task<List<LeaveDto>> GetEmployeeLeavesAsync(Guid employeeId)
        {
            return await _context.Leaves
                .Where(l => l.EmployeeId == employeeId)
                .Select(l => new LeaveDto
                {
                    LeaveId = l.LeaveId,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Reason = l.Reason,
                    Status = l.Status,
                    LeaveTypeName = null
                })
                .ToListAsync();
        }

        public async Task<bool> ApproveLeaveAsync(Guid leaveId, Guid adminId)
        {
            var leave = await _context.Leaves.FindAsync(leaveId);
            if (leave == null) return false;

            leave.Status = "Approved";
            leave.ReviewedBy = adminId;
            leave.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RejectLeaveAsync(Guid leaveId, Guid adminId)
        {
            var leave = await _context.Leaves.FindAsync(leaveId);
            if (leave == null) return false;

            leave.Status = "Rejected";
            leave.ReviewedBy = adminId;
            leave.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}