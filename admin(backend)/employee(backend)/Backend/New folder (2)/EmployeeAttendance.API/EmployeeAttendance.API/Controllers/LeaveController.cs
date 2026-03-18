using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using EmployeeAttendance.Application.Interfaces;
using EmployeeAttendance.Application.DTO;
using Microsoft.EntityFrameworkCore;

namespace EmployeeAttendance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveController : ControllerBase
    {
        private readonly ILeaveService _leaveService;

        public LeaveController(ILeaveService leaveService)
        {
            _leaveService = leaveService;
        }

        // ========================================
        // PRIVATE HELPER – Get EmployeeId From JWT
        // ========================================
        private bool TryGetEmployeeId(out Guid employeeId, out IActionResult? errorResult)
        {
            employeeId = Guid.Empty;
            errorResult = null;

            var employeeIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(employeeIdClaim))
            {
                errorResult = Unauthorized("EmployeeId claim missing");
                return false;
            }

            if (!Guid.TryParse(employeeIdClaim, out employeeId) || employeeId == Guid.Empty)
            {
                errorResult = Unauthorized("Invalid EmployeeId");
                return false;
            }

            return true;
        }

        // ========================================
        // EMPLOYEE - Create Leave
        // ========================================
        [Authorize(Roles = "Employee")]
        [HttpPost]
        public async Task<IActionResult> CreateLeave([FromBody] CreateLeaveDto dto)
        {
            if (!TryGetEmployeeId(out var employeeId, out var error))
                return error!;

            await _leaveService.CreateLeaveAsync(employeeId, dto);

            return Ok(new { message = "Leave request submitted successfully" });
        }

        // ========================================
        // EMPLOYEE - Get My Leaves
        // ========================================
        
        [HttpGet("my")]
        [Authorize(Roles = "Employee")]

        public async Task<IActionResult> GetMyLeaves()
        {
            if (!TryGetEmployeeId(out var employeeId, out var error))
                return error!;

            var leaves = await _leaveService.GetEmployeeLeavesAsync(employeeId);

            return Ok(leaves);
        }

        // ========================================
        // DEBUG (Remove After Testing)
        // ========================================
        
    }
}