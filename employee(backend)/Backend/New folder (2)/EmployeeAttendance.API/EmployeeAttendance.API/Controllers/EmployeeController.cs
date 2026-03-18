using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeAttendance.Infrastructure.Data;
using EmployeeAttendance.API.Models;
using System.Security.Claims;
using EmployeeAttendance.Domain.Enums;

namespace EmployeeAttendance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeeController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET /api/Employee/dashboard ───────────────────────────────────────
        [Authorize]
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetEmployeeDashboard()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Invalid token" });

            var employee = await _context.Employees
                .Include(e => e.Attendances)
                .Include(e => e.Leaves)
                .Include(e => e.AttendanceCorrections)
                .Include(e => e.EmployeeProjects)
                    .ThenInclude(ep => ep.Project)
                .FirstOrDefaultAsync(e => e.Email == email);

            if (employee == null)
                return NotFound(new { message = "Employee not found" });

            var dashboard = new EmployeeDashboardDto
            {
                EmployeeName = employee.Name,
                EmployeeEmail = employee.Email,
                TotalAttendance = employee.Attendances.Count,
                AttendanceChart = new AttendanceChartDto
                {
                    Present = employee.Attendances.Count(a => a.Status == "Present"),
                    Absent = employee.Attendances.Count(a => a.Status == "Absent"),
                    Leave = employee.Leaves.Count(l => l.Status == "Approved"),
                },
                PendingCorrections = employee.AttendanceCorrections
                    .Count(ac => ac.Status == CorrectionStatus.Pending),
                UpcomingLeaves = employee.Leaves
                    .Where(l => l.StartDate >= DateTime.Today)
                    .Select(l => new LeaveDto
                    {
                        StartDate = l.StartDate,
                        EndDate = l.EndDate,
                        Reason = l.Reason,
                    })
                    .ToList(),
                Projects = employee.EmployeeProjects
                    .Select(ep => new ProjectDto
                    {
                        ProjectName = ep.Project.ProjectName,
                        Status = ep.Project.Status,
                    })
                    .ToList(),
            };

            return Ok(dashboard);
        }

        // ── GET /api/Employee/attendance/monthly?month=3&year=2026 ────────────
        /// <summary>
        /// Returns attendance summary + per-day breakdown for a given month/year.
        /// Used by the dashboard chart to support month navigation.
        /// </summary>
        [Authorize]
        [HttpGet("attendance/monthly")]
        public async Task<IActionResult> GetMonthlyAttendance(
            [FromQuery] int month,
            [FromQuery] int year)
        {
            // Validate inputs
            if (month < 1 || month > 12)
                return BadRequest(new { message = "month must be between 1 and 12" });
            if (year < 2000 || year > DateTime.Today.Year)
                return BadRequest(new { message = "Invalid year" });

            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Invalid token" });

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Email == email);

            if (employee == null)
                return NotFound(new { message = "Employee not found" });

            // Date range for the requested month
            var from = new DateTime(year, month, 1);
            var to = new DateTime(year, month, DateTime.DaysInMonth(year, month));

            // Fetch attendance records for this employee in the month
            var attendances = await _context.Attendances
                .Where(a =>
                    a.EmployeeId == employee.EmployeeId &&
                    a.AttendanceDate >= from &&
                    a.AttendanceDate <= to)
                .OrderBy(a => a.AttendanceDate)
                .ToListAsync();

            // Fetch approved leaves that overlap this month
            var leaves = await _context.Leaves
                .Where(l =>
                    l.EmployeeId == employee.EmployeeId &&
                    l.Status == "Approved" &&
                    l.StartDate <= to &&
                    l.EndDate >= from)
                .ToListAsync();

            // Build a set of leave days for easy lookup
            var leaveDays = new HashSet<DateTime>();
            foreach (var lv in leaves)
            {
                for (var d = lv.StartDate.Date; d <= lv.EndDate.Date; d = d.AddDays(1))
                {
                    if (d >= from && d <= to)
                        leaveDays.Add(d.Date);
                }
            }

            // Per-day breakdown — ✅ attendanceId added so frontend can submit corrections
            var days = attendances.Select(a => new
            {
                day = a.AttendanceDate.Day,
                date = a.AttendanceDate.ToString("yyyy-MM-dd"),
                attendanceId = a.AttendanceId,          // ✅ ADDED
                status = a.Status.ToLower(),
                checkIn = a.CheckIn.HasValue
                                ? a.CheckIn.Value.ToString(@"hh\:mm")
                                : null,
                checkOut = a.CheckOut.HasValue
                                ? a.CheckOut.Value.ToString(@"hh\:mm")
                                : null,
                hoursWorked = (a.CheckIn.HasValue && a.CheckOut.HasValue)
                                ? (a.CheckOut.Value - a.CheckIn.Value).TotalHours
                                : 0.0,
            }).ToList();

            // Summary counts
            int presentDays = attendances.Count(a => a.Status == "Present");
            int absentDays = attendances.Count(a => a.Status == "Absent");
            int leaveDayCount = leaveDays.Count;

            double workingHours = attendances
                .Where(a => a.CheckIn.HasValue && a.CheckOut.HasValue)
                .Sum(a => (a.CheckOut!.Value - a.CheckIn!.Value).TotalHours);

            return Ok(new
            {
                month = month,
                year = year,
                present = presentDays,
                absent = absentDays,
                leave = leaveDayCount,
                totalDays = attendances.Count,
                workingHours = Math.Round(workingHours, 1),
                days = days,
            });
        }
    }
}