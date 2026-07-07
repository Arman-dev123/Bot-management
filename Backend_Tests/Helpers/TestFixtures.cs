using System.Security.Claims;
using System.Text;
using AiBotPlatform.Configuration;
using AiBotPlatform.DTOs;
using AiBotPlatform.Helpers;
using AiBotPlatform.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;

namespace AiBotPlatform.Tests.Helpers;

/// <summary>Shared object builders used across all test classes.</summary>
public static class TestFixtures
{
    // ── Settings ────────────────────────────────────────────────────────────

    public static IOptions<JwtSettings> JwtOptions() => Options.Create(new JwtSettings
    {
        SecretKey = "SuperSecretTestKey_MustBe32Chars!",
        Issuer = "AiBotPlatform",
        Audience = "AiBotPlatformUsers",
        ExpirationHours = 1
    });

    public static IOptions<EncryptionSettings> EncryptionOptions() => Options.Create(new EncryptionSettings
    {
        Key = "TestEncryptionKey32CharactersLong",
        IV = "TestIV16Chars!!!"
    });

    // ── Models ──────────────────────────────────────────────────────────────

    public static User MakeUser(string id = "user123") => new()
    {
        Id = id,
        Name = "Test User",
        Email = "test@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
        CreatedDate = DateTime.UtcNow
    };

    public static Bot MakeBot(string botId = "bot123", string userId = "user123") => new()
    {
        Id = botId,
        UserId = userId,
        BotName = "TestBot",
        ProjectId = "test-project",
        LanguageCode = "en",
        CredentialFileEncrypted = "encrypted-data",
        CreatedDate = DateTime.UtcNow,
        UpdatedDate = DateTime.UtcNow
    };

    public static ChatMessage MakeChatMessage(string userId = "user123", string botId = "bot123",
        string sender = "user", string message = "Hello") => new()
    {
        Id = "msg123",
        UserId = userId,
        BotId = botId,
        Sender = sender,
        Message = message,
        Timestamp = DateTime.UtcNow
    };

    // ── DTOs ────────────────────────────────────────────────────────────────

    public static RegisterDto ValidRegisterDto() => new()
    {
        Name = "Test User",
        Email = "test@example.com",
        Password = "Password1!",
        ConfirmPassword = "Password1!"
    };

    public static LoginDto ValidLoginDto() => new()
    {
        Email = "test@example.com",
        Password = "Password1!"
    };

    public static CreateBotDto ValidCreateBotDto() => new()
    {
        BotName = "My Bot",
        ProjectId = "my-project-123",
        LanguageCode = "en"
    };

    public static string ValidDialogflowJson() => """
        {
          "type": "service_account",
          "project_id": "my-project",
          "private_key_id": "key123",
          "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA\n-----END RSA PRIVATE KEY-----\n",
          "client_email": "bot@my-project.iam.gserviceaccount.com"
        }
        """;

    // ── IFormFile mock ──────────────────────────────────────────────────────

    public static IFormFile MakeFormFile(string content, string fileName = "creds.json",
        string contentType = "application/json")
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        var mock = new Mock<IFormFile>();
        mock.Setup(f => f.FileName).Returns(fileName);
        mock.Setup(f => f.Length).Returns(bytes.Length);
        mock.Setup(f => f.ContentType).Returns(contentType);
        mock.Setup(f => f.OpenReadStream()).Returns(stream);
        return mock.Object;
    }

    // ── Controller user identity helper ────────────────────────────────────

    public static void SetUser(ControllerBase controller, string userId = "user123")
    {
        var claims = new[] { new Claim("userId", userId) };
        var identity = new ClaimsIdentity(claims, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };
    }

    // ── JwtHelper (real, not mocked — it has no external deps) ─────────────

    public static JwtHelper MakeJwtHelper() => new(JwtOptions());
}
