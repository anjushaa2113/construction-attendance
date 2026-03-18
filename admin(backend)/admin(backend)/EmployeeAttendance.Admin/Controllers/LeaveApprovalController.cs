using EmployeeAttendance.Admin.Application.DTOs;
using EmployeeAttendance.Admin.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeAttendance.Admin.API.Controllers
{
    [ApiController]
    [Route("api/admin/leaves")]
    [Authorize(Roles = "Admin")]
    public class LeaveApprovalController : ControllerBase
    {
        private readonly ILeaveApprovalService _service;

        public LeaveApprovalController(ILeaveApprovalService service)
        {
            _service = service;
        }

        // GET: api/admin/leaves/pending
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingLeaves()
        {
            var leaves = await _service.GetPendingLeavesAsync();
            return Ok(leaves);
        }

        // PUT: api/admin/leaves/{leaveId}/approve
        [HttpPut("{leaveId}/approve")]
        public async Task<IActionResult> ApproveLeave(Guid leaveId)
        {
            await _service.ApproveLeaveAsync(leaveId);
            return NoContent();
        }

        // PUT: api/admin/leaves/{leaveId}/reject
        [HttpPut("{leaveId}/reject")]
        public async Task<IActionResult> RejectLeave(Guid leaveId)
        {
            await _service.RejectLeaveAsync(leaveId);
            return NoContent();
        }
    }
}
