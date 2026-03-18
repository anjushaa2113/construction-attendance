using EmployeeAttendance.Application.Interfaces;
using EmployeeAttendance.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeAttendance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IEmployeeReportService _reportService;

        public ReportsController(IEmployeeReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("AttendanceSummary")]
        public async Task<IActionResult> AttendanceSummary(
            Guid employeeId,
            DateTime? from,
            DateTime? to)
        {
            var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
            var toDate = to ?? DateTime.UtcNow;

            if (fromDate > toDate)
                return BadRequest("From date cannot be later than To date.");

            var summary = await _reportService.GetAttendanceSummaryAsync(employeeId, fromDate, toDate);
            return Ok(summary);
        }

        [HttpGet("AttendanceDetailed")]
        public async Task<IActionResult> AttendanceDetailed(
            Guid employeeId,
            DateTime? from,    // ← nullable, no longer required
            DateTime? to)      // ← nullable, no longer required
        {
            var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);  // default: last 30 days
            var toDate = to ?? DateTime.UtcNow;

            if (fromDate > toDate)
                return BadRequest("From date cannot be later than To date.");

            var details = await _reportService.GetAttendanceDetailedAsync(employeeId, fromDate, toDate);
            return Ok(details);
        }

        [HttpGet("MyLeaves")]
        public async Task<IActionResult> MyLeaves(Guid employeeId)
        {
            var leaves = await _reportService.GetMyLeavesAsync(employeeId);
            return Ok(leaves);
        }
    }
}