using EmployeeAttendance.Admin.Application.DTOs;
using EmployeeAttendance.Admin.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeAttendance.Admin.API.Controllers
{
    [ApiController]
    [Route("api/admin/employees")]
    [Authorize(Roles = "Admin")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _service;

        public EmployeesController(IEmployeeService service)
        {
            _service = service;
        }

        // =========================
        // GET: api/admin/employees?search=&role=&isActive=
        // =========================
        [HttpGet]
        public async Task<IActionResult> GetEmployees(
            [FromQuery] string? search,
            [FromQuery] string? role,
            [FromQuery] bool? isActive)
        {
            var employees = await _service.GetEmployeesAsync(search, role, isActive);
            return Ok(employees);
        }

        // =========================
        // GET: api/admin/employees/{employeeId}
        // =========================
        [HttpGet("{employeeId}")]
        public async Task<IActionResult> GetEmployeeById(Guid employeeId)
        {
            var employee = await _service.GetEmployeeByIdAsync(employeeId);
            if (employee == null)
                return NotFound();
            return Ok(employee);
        }

        // =========================
        // POST: api/admin/employees
        // =========================
        [HttpPost]
        public async Task<IActionResult> AddEmployee([FromBody] CreateEmployeeDto dto)
        {
            var createdEmployee = await _service.AddEmployeeAsync(dto);
            return CreatedAtAction(
                nameof(GetEmployeeById),
                new { employeeId = createdEmployee.EmployeeId },
                createdEmployee
            );
        }

        // =========================
        // POST: api/admin/employees/bulk-upload
        // =========================
        [HttpPost("bulk-upload")]
        public async Task<IActionResult> BulkUploadEmployees([FromBody] List<CreateEmployeeDto> dtos)
        {
            if (dtos == null || dtos.Count == 0)
                return BadRequest("No employee records provided.");

            int success = 0;
            int failed = 0;
            var errors = new List<BulkUploadErrorDto>();

            foreach (var dto in dtos)
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email))
                {
                    failed++;
                    errors.Add(new BulkUploadErrorDto
                    {
                        Name = dto.Name ?? "(no name)",
                        Email = dto.Email ?? "(no email)",
                        Reason = "Name and Email are required."
                    });
                    continue;
                }

                try
                {
                    await _service.AddEmployeeAsync(dto);
                    success++;
                }
                catch (Exception ex)
                {
                    failed++;
                    errors.Add(new BulkUploadErrorDto
                    {
                        Name = dto.Name,
                        Email = dto.Email,
                        Reason = ex.Message
                    });
                }
            }

            var result = new BulkUploadResultDto
            {
                Total = dtos.Count,
                Success = success,
                Failed = failed,
                Errors = errors
            };

            return Ok(result);
        }

        // =========================
        // PUT: api/admin/employees/{employeeId}
        // =========================
        [HttpPut("{employeeId}")]
        public async Task<IActionResult> UpdateEmployee(
            Guid employeeId,
            [FromBody] UpdateEmployeeDto dto)
        {
            await _service.UpdateEmployeeAsync(employeeId, dto);
            return NoContent();
        }

        // =========================
        // DELETE: api/admin/employees/{employeeId} (Soft Delete)
        // =========================
        [HttpDelete("{employeeId}")]
        public async Task<IActionResult> DeleteEmployee(Guid employeeId)
        {
            var employee = await _service.GetEmployeeByIdAsync(employeeId);
            if (employee == null)
                return NotFound();

            await _service.UpdateEmployeeAsync(employee.EmployeeId, new UpdateEmployeeDto
            {
                Name = employee.Name,
                Role = employee.Role,
                IsActive = false
            });
            return NoContent();
        }
    }
}