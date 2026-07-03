using System.ComponentModel.DataAnnotations;

namespace AiBotPlatform.DTOs;

// Auth DTOs
public class RegisterDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare("Password")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

// Bot DTOs
public class CreateBotDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string BotName { get; set; } = string.Empty;

    [Required]
    public string ProjectId { get; set; } = string.Empty;

    [Required]
    public string LanguageCode { get; set; } = "en";
}

public class UpdateBotDto
{
    [StringLength(100, MinimumLength = 2)]
    public string? BotName { get; set; }

    public string? LanguageCode { get; set; }
}

public class BotResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string BotName { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime UpdatedDate { get; set; }
}

// Chat DTOs
public class ChatMessageDto
{
    public string Id { get; set; } = string.Empty;
    public string BotId { get; set; } = string.Empty;
    public string Sender { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

// Dashboard DTOs
public class DashboardStatsDto
{
    public int TotalBots { get; set; }
    public int TotalMessages { get; set; }
    public List<BotResponseDto> RecentBots { get; set; } = new();
}

// Error DTO
public class ApiErrorDto
{
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public int StatusCode { get; set; }
}
