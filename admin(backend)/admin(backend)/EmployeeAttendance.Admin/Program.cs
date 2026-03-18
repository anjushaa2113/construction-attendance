using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using EmployeeAttendance.Admin.Application.Interfaces;
using EmployeeAttendance.Admin.Application.Services;
using EmployeeAttendance.Admin.Infrastructure.Data;
using EmployeeAttendance.Admin.Infrastructure.Repositories;
using EmployeeAttendance.Admin.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ✅ FIX for PostgreSQL timestamp with timezone error
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// ------------------- DbContext -------------------
builder.Services.AddDbContext<AdminDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ------------------- CORS -------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ------------------- JWT Authentication -------------------
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["Jwt:Key"];

        if (string.IsNullOrEmpty(key))
            throw new Exception("JWT Key is missing in configuration");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key)
            )
        };
    });

// ------------------- Swagger + JWT support -------------------
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EmployeeAttendance.Admin API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token like: Bearer {your_token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ------------------- Dependency Injection -------------------
builder.Services.AddHttpContextAccessor();

// Admin Dashboard
builder.Services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();

// Employees
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// Leave Approval
builder.Services.AddScoped<ILeaveRequestRepository, LeaveRequestRepository>();
builder.Services.AddScoped<ILeaveApprovalService, LeaveApprovalService>();

// Attendance Corrections
builder.Services.AddScoped<IAttendanceCorrectionRepository, AttendanceCorrectionRepository>();
builder.Services.AddScoped<IAttendanceApprovalService, AttendanceApprovalService>();

// Reports
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IReportService, ReportService>();


// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ------------------- Build App -------------------
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");    // ✅ MUST be before UseAuthentication
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AdminDbContext>();

    var connection = db.Database.GetDbConnection();
    Console.WriteLine("====== DATABASE CHECK ======");
    Console.WriteLine("Database: " + connection.Database);
    Console.WriteLine("DataSource: " + connection.DataSource);
    Console.WriteLine("============================");

    var corrections = db.AttendanceCorrections.ToList();
    Console.WriteLine("====== CORRECTIONS FOUND BY ADMIN API ======");
    foreach (var c in corrections)
    {
        Console.WriteLine($"{c.CorrectionId}  -  Status: {c.Status}");
    }
    Console.WriteLine("============================================");
}

app.Run();