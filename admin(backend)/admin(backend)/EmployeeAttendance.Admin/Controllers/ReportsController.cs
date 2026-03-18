using EmployeeAttendance.Admin.Application.DTOs;
using EmployeeAttendance.Admin.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeAttendance.Admin.API.Controllers
{
    [ApiController]
    [Route("api/admin/reports")]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _service;

        public ReportsController(IReportService service)
        {
            _service = service;
        }

        // GET: api/admin/reports/employees
        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployeesReport()
        {
            var report = await _service.GetEmployeesReportAsync(); // ✅ await here
            return Ok(report);
        }

        // GET: api/admin/reports/attendance
        [HttpGet("attendance")]
        public async Task<IActionResult> GetAttendanceReport(
            [FromQuery] DateTimeOffset? fromDate,
            [FromQuery] DateTimeOffset? toDate)
        {
            var report = await _service.GetAttendanceReportAsync(fromDate?.UtcDateTime, toDate?.UtcDateTime);
            return Ok(report);
        }

        // GET: api/admin/reports/leaves
        [HttpGet("leaves")]
        public async Task<IActionResult> GetLeaveReport(
            [FromQuery] DateTimeOffset? fromDate,
            [FromQuery] DateTimeOffset? toDate,
            [FromQuery] string? status)
        {
            var report = await _service.GetLeaveReportAsync(fromDate?.UtcDateTime, toDate?.UtcDateTime, status);
            return Ok(report);
        }
    }
}
