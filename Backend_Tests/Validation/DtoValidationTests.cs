using System.ComponentModel.DataAnnotations;
using AiBotPlatform.DTOs;

namespace AiBotPlatform.Tests.Validation;

/// <summary>
/// Tests DataAnnotations validation on DTOs — covers the attribute-based
/// validation that runs before controller actions execute.
/// </summary>
public class DtoValidationTests
{
    private static IList<ValidationResult> Validate(object dto)
    {
        var ctx = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, ctx, results, validateAllProperties: true);
        return results;
    }

    // ── RegisterDto ─────────────────────────────────────────────────────────

    [Fact]
    public void RegisterDto_ValidData_NoErrors()
    {
        var dto = new RegisterDto
        {
            Name = "Arman",
            Email = "arman@example.com",
            Password = "StrongPass1!",
            ConfirmPassword = "StrongPass1!"
        };
        Assert.Empty(Validate(dto));
    }

    [Fact]
    public void RegisterDto_EmptyName_HasError()
    {
        var dto = new RegisterDto { Name = "", Email = "e@e.com", Password = "Pass1234!", ConfirmPassword = "Pass1234!" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("Name"));
    }

    [Fact]
    public void RegisterDto_InvalidEmail_HasError()
    {
        var dto = new RegisterDto { Name = "Test", Email = "not-an-email", Password = "Pass1234!", ConfirmPassword = "Pass1234!" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("Email"));
    }

    [Fact]
    public void RegisterDto_ShortPassword_HasError()
    {
        var dto = new RegisterDto { Name = "Test", Email = "e@e.com", Password = "short", ConfirmPassword = "short" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("Password"));
    }

    [Fact]
    public void RegisterDto_PasswordMismatch_HasError()
    {
        var dto = new RegisterDto
        {
            Name = "Test", Email = "e@e.com",
            Password = "Password1!", ConfirmPassword = "Different1!"
        };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("ConfirmPassword"));
    }

    [Fact]
    public void RegisterDto_NameTooShort_HasError()
    {
        var dto = new RegisterDto { Name = "X", Email = "e@e.com", Password = "Pass1234!", ConfirmPassword = "Pass1234!" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("Name"));
    }

    // ── LoginDto ─────────────────────────────────────────────────────────────

    [Fact]
    public void LoginDto_ValidData_NoErrors()
    {
        var dto = new LoginDto { Email = "user@example.com", Password = "anypassword" };
        Assert.Empty(Validate(dto));
    }

    [Fact]
    public void LoginDto_InvalidEmail_HasError()
    {
        var dto = new LoginDto { Email = "bad-email", Password = "pass" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("Email"));
    }

    [Fact]
    public void LoginDto_EmptyPassword_HasError()
    {
        var dto = new LoginDto { Email = "e@e.com", Password = "" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("Password"));
    }

    // ── CreateBotDto ─────────────────────────────────────────────────────────

    [Fact]
    public void CreateBotDto_ValidData_NoErrors()
    {
        var dto = new CreateBotDto { BotName = "My Bot", ProjectId = "proj-123", LanguageCode = "en" };
        Assert.Empty(Validate(dto));
    }

    [Fact]
    public void CreateBotDto_EmptyBotName_HasError()
    {
        var dto = new CreateBotDto { BotName = "", ProjectId = "proj", LanguageCode = "en" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("BotName"));
    }

    [Fact]
    public void CreateBotDto_SingleCharBotName_HasError()
    {
        var dto = new CreateBotDto { BotName = "X", ProjectId = "proj", LanguageCode = "en" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("BotName"));
    }

    [Fact]
    public void CreateBotDto_EmptyProjectId_HasError()
    {
        var dto = new CreateBotDto { BotName = "Bot", ProjectId = "", LanguageCode = "en" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("ProjectId"));
    }

    // ── UpdateBotDto ──────────────────────────────────────────────────────────

    [Fact]
    public void UpdateBotDto_AllNulls_IsValid()
    {
        // Update with nothing set is allowed (partial update)
        var dto = new UpdateBotDto { BotName = null, LanguageCode = null };
        Assert.Empty(Validate(dto));
    }

    [Fact]
    public void UpdateBotDto_SingleCharBotName_HasError()
    {
        var dto = new UpdateBotDto { BotName = "X" };
        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("BotName"));
    }
}
