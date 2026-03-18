using Microsoft.EntityFrameworkCore;
using EmployeeAttendance.Domain.Entities;

namespace EmployeeAttendance.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<EmployeeProfile> EmployeeProfiles { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<AttendanceCorrection> AttendanceCorrections { get; set; }
        public DbSet<Leave> Leaves { get; set; }
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<EmployeeProject> EmployeeProjects { get; set; }
        public DbSet<Project> Projects { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Employee>(entity =>
            {
                entity.ToTable("Employees");
                entity.HasKey(e => e.EmployeeId);
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.Email).IsRequired();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Role).IsRequired();
            });

            modelBuilder.Entity<EmployeeProfile>(entity =>
            {
                entity.ToTable("EmployeeProfiles");
                entity.HasKey(e => e.EmployeeProfileId);
                entity.HasOne(e => e.Employee)
                      .WithOne(emp => emp.Profile)
                      .HasForeignKey<EmployeeProfile>(e => e.EmployeeId);
            });

            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.ToTable("Attendance");
                entity.HasKey(a => a.AttendanceId);
                entity.HasOne(a => a.Employee)
                      .WithMany(e => e.Attendances)
                      .HasForeignKey(a => a.EmployeeId);
            });

            modelBuilder.Entity<AttendanceCorrection>(entity =>
            {
                entity.ToTable("attendancecorrections");

                entity.HasKey(ac => ac.CorrectionId);

                // 🔥 THIS IS THE ONLY IMPORTANT FIX
                entity.Property(ac => ac.EmployeeId)
                      .HasColumnName("EmployeeId");

                entity.HasOne(ac => ac.Employee)
                      .WithMany(e => e.AttendanceCorrections)
                      .HasForeignKey(ac => ac.EmployeeId);

                entity.HasOne(ac => ac.Attendance)
                      .WithMany()
                      .HasForeignKey(ac => ac.AttendanceId);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}