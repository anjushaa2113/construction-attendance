using EmployeeAttendance.Admin.Application.Interfaces;
using EmployeeAttendance.Admin.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EmployeeAttendance.Admin.API.Controllers
{
    [Route("api/admin/attendance-corrections")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AttendanceCorrectionController : ControllerBase
    {
        private readonly IAttendanceApprovalService _service;

        public AttendanceCorrectionController(IAttendanceApprovalService service)
        {
            _service = service;
        }

        // =========================================
        // GET: Filter by Status
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetCorrections([FromQuery] CorrectionStatus? status)
        {
            var corrections = status.HasValue
                ? await _service.GetCorrectionsAsync(status)
                : await _service.GetPendingCorrectionsAsync();

            return Ok(corrections);
        }

        // =========================================
        // GET: By Id
        // =========================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var correction = await _service.GetByIdAsync(id);

            if (correction == null)
                return NotFound("Correction not found.");

            return Ok(correction);
        }

        // =========================================
        // APPROVE
        // =========================================
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(Guid id)
        {
            try
            {
                var adminId = GetAdminIdFromToken();

                var result = await _service.ApproveAsync(id, adminId.ToString());

                if (!result)
                    return BadRequest("Only pending corrections can be approved.");

                return Ok(new { message = "Correction approved successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Correction not found.");
            }
        }

        // =========================================
        // REJECT
        // =========================================
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> Reject(Guid id)
        {
            try
            {
                var adminId = GetAdminIdFromToken();

                var result = await _service.RejectAsync(id, adminId.ToString());

                if (!result)
                    return BadRequest("Only pending corrections can be rejected.");

                return Ok(new { message = "Correction rejected successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Correction not found.");
            }
        }
        // =========================================
        // Extract Admin Id from JWT
        // =========================================
        private Guid GetAdminIdFromToken()
        {
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(adminIdClaim))
                throw new UnauthorizedAccessException("Invalid token.");

            return Guid.Parse(adminIdClaim);
        }
    }
}
