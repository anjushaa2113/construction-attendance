using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net;
using System.Net.Mail;
using EmployeeAttendance.Infrastructure.Data;
using EmployeeAttendance.API.Models;

namespace EmployeeAttendance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        // ── In-memory OTP store: email → (otp, expiry) ────────────
        private static readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // TEMPORARY - remove after fixing login
        [HttpGet("generate-hash")]
        public IActionResult GenerateHash([FromQuery] string password)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(password);
            return Ok(new { hash, length = hash.Length });
        }

        // ── LOGIN ──────────────────────────────────────────────────
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            Console.WriteLine($"Login attempt - Email: '{request.Email}'");

            var employee = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Email == request.Email && e.IsActive);

            if (employee == null)
            {
                Console.WriteLine("Employee not found");
                return Unauthorized(new { message = "Employee not found" });
            }

            Console.WriteLine($"Hash from DB: '{employee.PasswordHash}'");
            Console.WriteLine($"Hash length: {employee.PasswordHash?.Length}");

            var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash);
            Console.WriteLine($"Password valid: {passwordValid}");

            if (!passwordValid)
                return Unauthorized(new { message = $"Password mismatch - hash length: {employee.PasswordHash?.Length}" });

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, employee.EmployeeId.ToString()),
                new Claim(ClaimTypes.Email, employee.Email),
                new Claim(ClaimTypes.Role, employee.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSecret"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(30),
                signingCredentials: creds
            );

            return Ok(new
            {
                message = "Login successful",
                employeeId = employee.EmployeeId,
                name = employee.Name,
                role = employee.Role,
                token = new JwtSecurityTokenHandler().WriteToken(token)
            });
        }

        // ── CHANGE PASSWORD (logged-in user) ───────────────────────
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var employeeIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(employeeIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var employeeId = Guid.Parse(employeeIdClaim);
            var employee = await _context.Employees.FindAsync(employeeId);

            if (employee == null)
                return NotFound(new { message = "Employee not found" });

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, employee.PasswordHash))
                return BadRequest(new { message = "Current password is incorrect" });

            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }

        // ── STEP 1: FORGOT PASSWORD — Send OTP ────────────────────
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            var employee = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Email == request.Email && e.IsActive);

            // Always return OK to avoid email enumeration attacks
            if (employee == null)
                return Ok(new { message = "If that email is registered, an OTP has been sent." });

            var otp = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(10);

            _otpStore[request.Email.ToLower()] = (otp, expiry);

            Console.WriteLine("========================================");
            Console.WriteLine($"  OTP for {request.Email}: {otp}");
            Console.WriteLine($"  Expires at: {expiry:HH:mm:ss} UTC");
            Console.WriteLine("========================================");

            // TODO: Uncomment when email is configured
            // var emailSent = await SendOtpEmailAsync(request.Email, employee.Name, otp);
            // if (!emailSent)
            //     return StatusCode(500, new { message = "Failed to send OTP email. Please try again." });

            // ⚠️ DEV ONLY — remove devOtp before going to production!
            return Ok(new
            {
                message = "OTP sent successfully.",
                devOtp = otp
            });
        }

        // ── STEP 2: VERIFY OTP ────────────────────────────────────
        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Otp))
                return BadRequest(new { message = "Email and OTP are required." });

            var key = request.Email.ToLower();

            if (!_otpStore.TryGetValue(key, out var stored))
                return BadRequest(new { message = "No OTP found for this email. Please request a new one." });

            if (DateTime.UtcNow > stored.Expiry)
            {
                _otpStore.Remove(key);
                return BadRequest(new { message = "OTP has expired. Please request a new one." });
            }

            if (stored.Otp != request.Otp.Trim())
                return BadRequest(new { message = "Invalid OTP. Please check and try again." });

            return Ok(new { message = "OTP verified successfully." });
        }

        // ── STEP 3: RESET PASSWORD ────────────────────────────────
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Otp) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest(new { message = "Email, OTP, and new password are required." });

            var key = request.Email.ToLower();

            // Re-verify OTP before resetting (prevents skipping step 2)
            if (!_otpStore.TryGetValue(key, out var stored))
                return BadRequest(new { message = "OTP not found or already used. Please start again." });

            if (DateTime.UtcNow > stored.Expiry)
            {
                _otpStore.Remove(key);
                return BadRequest(new { message = "OTP has expired. Please request a new one." });
            }

            if (stored.Otp != request.Otp.Trim())
                return BadRequest(new { message = "Invalid OTP." });

            if (request.NewPassword.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters." });

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Email == request.Email && e.IsActive);

            if (employee == null)
                return NotFound(new { message = "Employee not found." });

            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            // Invalidate OTP after successful reset
            _otpStore.Remove(key);

            Console.WriteLine($"[Auth] Password reset successful for {request.Email}");

            return Ok(new { message = "Password reset successfully." });
        }

        // ── Email Helper (ready for when SMTP is configured) ──────
        private async Task<bool> SendOtpEmailAsync(string toEmail, string name, string otp)
        {
            try
            {
                var smtpHost = _configuration["Email:SmtpHost"];
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpUser = _configuration["Email:Username"];
                var smtpPass = _configuration["Email:Password"];
                var fromEmail = _configuration["Email:From"] ?? smtpUser;
                var fromName = _configuration["Email:FromName"] ?? "Enterprise Attendance";

                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    Credentials = new NetworkCredential(smtpUser, smtpPass),
                    EnableSsl = true,
                };

                var mail = new MailMessage
                {
                    From = new MailAddress(fromEmail!, fromName),
                    Subject = "Your Password Reset OTP",
                    IsBodyHtml = true,
                    Body = $@"
                        <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;'>
                            <h2 style='color:#1d4ed8;margin-bottom:8px;'>Password Reset OTP</h2>
                            <p style='color:#374151;'>Hi <strong>{name}</strong>,</p>
                            <p style='color:#374151;'>Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
                            <div style='text-align:center;margin:32px 0;'>
                                <span style='font-size:36px;font-weight:bold;letter-spacing:12px;color:#1d4ed8;background:#eff6ff;padding:16px 24px;border-radius:8px;display:inline-block;'>
                                    {otp}
                                </span>
                            </div>
                            <p style='color:#6b7280;font-size:13px;'>If you didn't request this, please ignore this email. Your password will not change.</p>
                            <hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'/>
                            <p style='color:#9ca3af;font-size:12px;text-align:center;'>Enterprise Attendance System</p>
                        </div>",
                };
                mail.To.Add(toEmail);

                await client.SendMailAsync(mail);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email] Send failed: {ex.Message}");
                return false;
            }
        }
    }
}