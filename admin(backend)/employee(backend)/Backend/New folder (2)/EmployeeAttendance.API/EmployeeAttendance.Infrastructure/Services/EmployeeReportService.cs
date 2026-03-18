using EmployeeAttendance.Infrastructure.Data;
using EmployeeAttendance.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using EmployeeAttendance.Application.Interfaces;

namespace EmployeeAttendance.Application.Services
{
    public class EmployeeReportService : IEmployeeReportService
    {
        private readonly AppDbContext _context;

        public EmployeeReportService(AppDbContext context)
        {
            _context = context;
        }

        // ✅ Helper to fix DateTime Kind=Unspecified error with PostgreSQL
        private static DateTime ToUtc(DateTime dt)
        {
            return dt.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
                : dt.ToUniversalTime();
        }

        public async Task<AttendanceSummaryDto> GetAttendanceSummaryAsync(
            Guid employeeId, DateTime from, DateTime to)
        {
            var fromUtc = ToUtc(from);
            var toUtc = ToUtc(to);

            var totalDays = (toUtc.Date - fromUtc.Date).Days + 1;

            var attendance = await _context.Attendances
                .Where(a => a.EmployeeId == employeeId &&
                            a.AttendanceDate.Date >= fromUtc.Date &&
                            a.AttendanceDate.Date <= toUtc.Date)
                .ToListAsync();

            var presentDays = attendance.Count(a => a.CheckIn != null);
            var leaveDays = attendance.Count(a => a.Status == "Leave");
            var absentDays = totalDays - presentDays - leaveDays;

            double workingHours = attendance
                .Where(a => a.CheckIn != null && a.CheckOut != null)
                .Sum(a => (a.CheckOut!.Value - a.CheckIn!.Value).TotalHours);

            return new AttendanceSummaryDto
            {
                From = fromUtc,
                To = toUtc,
                TotalDays = totalDays,
                PresentDays = presentDays,
                AbsentDays = absentDays,
                LeaveDays = leaveDays,
                WorkingHours = Math.Round(workingHours, 2)
            };
        }

        public async Task<List<AttendanceDetailedDto>> GetAttendanceDetailedAsync(
            Guid employeeId, DateTime from, DateTime to)
        {
            var fromUtc = ToUtc(from);
            var toUtc = ToUtc(to);

            return await _context.Attendances
                .Include(a => a.Employee)
                .Where(a => a.EmployeeId == employeeId &&
                            a.AttendanceDate.Date >= fromUtc.Date &&
                            a.AttendanceDate.Date <= toUtc.Date)
                .OrderBy(a => a.AttendanceDate)
                .Select(a => new AttendanceDetailedDto
                {
                    EmployeeName = a.Employee.Name,
                    EmployeeId = a.EmployeeId,
                    AttendanceDate = a.AttendanceDate,
                    CheckIn = a.CheckIn,
                    CheckOut = a.CheckOut,
                    HoursWorked = a.CheckIn != null && a.CheckOut != null
                        ? Math.Round((a.CheckOut!.Value - a.CheckIn!.Value).TotalHours, 2)
                        : 0,
                    Status = a.CheckIn != null ? "Present" :
                             a.Status == "Leave" ? "Leave" : "Absent"
                })
                .ToListAsync();
        }

        public async Task<List<MyLeaveDto>> GetMyLeavesAsync(Guid employeeId)
        {
            return await _context.Leaves
                .Include(l => l.LeaveType)
                .Where(l => l.EmployeeId == employeeId)
                .OrderByDescending(l => l.AppliedAt)
                .Select(l => new MyLeaveDto
                {
                    LeaveId = l.LeaveId,
                    From = l.StartDate,
                    To = l.EndDate,
                    Type = l.LeaveType.Type,
                    Reason = l.Reason,
                    Status = l.Status,
                    AppliedAt = l.AppliedAt
                })
                .ToListAsync();
        }
    }
}