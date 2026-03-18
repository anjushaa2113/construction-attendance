using EmployeeAttendance.Application.Interfaces;
using EmployeeAttendance.Domain.Entities;
using EmployeeAttendance.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace EmployeeAttendance.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceCorrectionsController : ControllerBase
    {
        private readonly IAttendanceCorrectionService _service;

        public AttendanceCorrectionsController(IAttendanceCorrectionService service)
        {
            _service = service;
        }

        /// <summary>
        /// Get attendance corrections
        /// Employees -> only their own
        /// Admin/HR -> can filter by employeeId
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Guid? employeeId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token");

            var userId = Guid.Parse(userIdClaim);

            // Employee → only their own corrections
            if (User.IsInRole("Employee"))
            {
                var result = await _service.GetAllAsync(userId, null);
                return Ok(result);
            }

            // Admin / HR → filter by employeeId if provided
            var all = await _service.GetAllAsync(employeeId, null);
            return Ok(all);
        }

        /// <summary>
        /// Create a new attendance correction
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Employee")]
        public async Task<IActionResult> Create([FromBody] AttendanceCorrection correction)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token");

            correction.EmployeeId = Guid.Parse(userIdClaim);
            correction.Status = CorrectionStatus.Pending;

            var created = await _service.CreateAsync(correction);
            return Ok(created);
        }

        /// <summary>
        /// Approve correction (Admin/HR only)
        /// </summary>
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(Guid id)
        {
            var reviewerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(reviewerIdClaim))
                return Unauthorized("Invalid token");

            var reviewerId = Guid.Parse(reviewerIdClaim);

            var result = await _service.ApproveAsync(id, reviewerId);

            if (!result)
                return NotFound("Correction not found or already processed");

            return Ok("Correction approved successfully");
        }

        /// <summary>
        /// Reject correction (Admin/HR only)
        /// </summary>
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> Reject(Guid id)
        {
            var reviewerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(reviewerIdClaim))
                return Unauthorized("Invalid token");

            var reviewerId = Guid.Parse(reviewerIdClaim);

            var result = await _service.RejectAsync(id, reviewerId);

            if (!result)
                return NotFound("Correction not found or already processed");

            return Ok("Correction rejected successfully");
        }
    }
}