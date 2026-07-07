using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;
using AiBotPlatform.Services;
using AiBotPlatform.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace AiBotPlatform.Tests.Services;

public class BotServiceTests
{
    private readonly Mock<IBotRepository> _botRepo = new();
    private readonly Mock<IEncryptionService> _encryption = new();
    private readonly Mock<IDialogflowClientCache> _cache = new();
    private readonly BotService _sut;

    public BotServiceTests()
    {
        _sut = new BotService(
            _botRepo.Object,
            _encryption.Object,
            _cache.Object,
            NullLogger<BotService>.Instance);
    }

    // ── CreateBot ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBot_ValidFile_EncryptsAndSavesBot()
    {
        // Arrange
        var dto = TestFixtures.ValidCreateBotDto();
        var file = TestFixtures.MakeFormFile(TestFixtures.ValidDialogflowJson());
        _encryption.Setup(e => e.Encrypt(It.IsAny<string>())).Returns("encrypted");
        _botRepo.Setup(r => r.CreateAsync(It.IsAny<Bot>()))
            .ReturnsAsync((Bot b) => { b.Id = "bot1"; return b; });

        // Act
        var result = await _sut.CreateBotAsync("user1", dto, file);

        // Assert
        Assert.Equal("bot1", result.Id);
        Assert.Equal("My Bot", result.BotName);
        _encryption.Verify(e => e.Encrypt(It.IsAny<string>()), Times.Once);
        _botRepo.Verify(r => r.CreateAsync(It.Is<Bot>(b =>
            b.UserId == "user1" &&
            b.CredentialFileEncrypted == "encrypted")), Times.Once);
    }

    [Fact]
    public async Task CreateBot_EmptyFile_ThrowsArgumentException()
    {
        // Arrange
        var file = TestFixtures.MakeFormFile("", "creds.json");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateBotAsync("user1", TestFixtures.ValidCreateBotDto(), file));
        Assert.Contains("empty", ex.Message);
    }

    [Fact]
    public async Task CreateBot_NonJsonExtension_ThrowsArgumentException()
    {
        // Arrange
        var file = TestFixtures.MakeFormFile("some content", "creds.txt");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateBotAsync("user1", TestFixtures.ValidCreateBotDto(), file));
        Assert.Contains("JSON", ex.Message);
    }

    [Fact]
    public async Task CreateBot_FileTooLarge_ThrowsArgumentException()
    {
        // Arrange
        var bigContent = new string('x', 1024 * 1024 + 1);
        var file = TestFixtures.MakeFormFile(bigContent);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateBotAsync("user1", TestFixtures.ValidCreateBotDto(), file));
        Assert.Contains("exceeds maximum size", ex.Message);
    }

    [Fact]
    public async Task CreateBot_InvalidJson_ThrowsArgumentException()
    {
        // Arrange
        var file = TestFixtures.MakeFormFile("not-json-at-all");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateBotAsync("user1", TestFixtures.ValidCreateBotDto(), file));
        Assert.Contains("valid JSON", ex.Message);
    }

    [Fact]
    public async Task CreateBot_MissingDialogflowField_ThrowsArgumentException()
    {
        // Arrange — missing "private_key" field
        var json = """{"type":"service_account","project_id":"p","private_key_id":"k","client_email":"e@e.com"}""";
        var file = TestFixtures.MakeFormFile(json);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateBotAsync("user1", TestFixtures.ValidCreateBotDto(), file));
        Assert.Contains("missing field", ex.Message);
    }

    [Fact]
    public async Task CreateBot_WrongAccountType_ThrowsArgumentException()
    {
        // Arrange — type is "oauth2" not "service_account"
        var json = """
            {"type":"oauth2","project_id":"p","private_key_id":"k",
             "private_key":"pk","client_email":"e@e.com"}
            """;
        var file = TestFixtures.MakeFormFile(json);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateBotAsync("user1", TestFixtures.ValidCreateBotDto(), file));
        Assert.Contains("service_account", ex.Message);
    }

    // ── GetBots ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetBots_ReturnsMappedDtos()
    {
        // Arrange
        var bots = new List<Bot> { TestFixtures.MakeBot("b1"), TestFixtures.MakeBot("b2") };
        _botRepo.Setup(r => r.GetByUserIdAsync("user1")).ReturnsAsync(bots);

        // Act
        var result = await _sut.GetBotsAsync("user1");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, b => Assert.NotEmpty(b.Id));
    }

    [Fact]
    public async Task GetBots_NoBots_ReturnsEmptyList()
    {
        // Arrange
        _botRepo.Setup(r => r.GetByUserIdAsync("user1")).ReturnsAsync(new List<Bot>());

        // Act
        var result = await _sut.GetBotsAsync("user1");

        // Assert
        Assert.Empty(result);
    }

    // ── GetBot ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetBot_ExistingBot_ReturnsMappedDto()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _botRepo.Setup(r => r.GetByIdAndUserIdAsync("bot123", "user123")).ReturnsAsync(bot);

        // Act
        var result = await _sut.GetBotAsync("user123", "bot123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("bot123", result!.Id);
        Assert.Equal("TestBot", result.BotName);
    }

    [Fact]
    public async Task GetBot_NotFound_ReturnsNull()
    {
        // Arrange
        _botRepo.Setup(r => r.GetByIdAndUserIdAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((Bot?)null);

        // Act
        var result = await _sut.GetBotAsync("user1", "missing");

        // Assert
        Assert.Null(result);
    }

    // ── UpdateBot ───────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateBot_ValidUpdate_UpdatesFieldsAndInvalidatesCache()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _botRepo.Setup(r => r.GetByIdAndUserIdAsync("bot123", "user123")).ReturnsAsync(bot);
        _botRepo.Setup(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Bot>())).Returns(Task.CompletedTask);

        var dto = new UpdateBotDto { BotName = "New Name", LanguageCode = "es" };

        // Act
        var result = await _sut.UpdateBotAsync("user123", "bot123", dto);

        // Assert
        Assert.Equal("New Name", result.BotName);
        Assert.Equal("es", result.LanguageCode);
        _cache.Verify(c => c.Invalidate("bot123"), Times.Once);
    }

    [Fact]
    public async Task UpdateBot_BotNotFound_ThrowsKeyNotFound()
    {
        // Arrange
        _botRepo.Setup(r => r.GetByIdAndUserIdAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((Bot?)null);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.UpdateBotAsync("user1", "missing", new UpdateBotDto()));
    }

    [Fact]
    public async Task UpdateBot_NullFields_DoesNotOverwriteExistingValues()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        bot.BotName = "Original";
        bot.LanguageCode = "en";
        _botRepo.Setup(r => r.GetByIdAndUserIdAsync("bot123", "user123")).ReturnsAsync(bot);
        _botRepo.Setup(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Bot>())).Returns(Task.CompletedTask);

        var dto = new UpdateBotDto { BotName = null, LanguageCode = null };

        // Act
        var result = await _sut.UpdateBotAsync("user123", "bot123", dto);

        // Assert — original values preserved
        Assert.Equal("Original", result.BotName);
        Assert.Equal("en", result.LanguageCode);
    }

    // ── DeleteBot ───────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteBot_ExistingBot_DeletesAndInvalidatesCache()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _botRepo.Setup(r => r.GetByIdAndUserIdAsync("bot123", "user123")).ReturnsAsync(bot);
        _botRepo.Setup(r => r.DeleteAsync("bot123")).Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteBotAsync("user123", "bot123");

        // Assert
        _botRepo.Verify(r => r.DeleteAsync("bot123"), Times.Once);
        _cache.Verify(c => c.Invalidate("bot123"), Times.Once);
    }

    [Fact]
    public async Task DeleteBot_BotNotFound_ThrowsKeyNotFound()
    {
        // Arrange
        _botRepo.Setup(r => r.GetByIdAndUserIdAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((Bot?)null);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.DeleteBotAsync("user1", "missing"));
    }
}
