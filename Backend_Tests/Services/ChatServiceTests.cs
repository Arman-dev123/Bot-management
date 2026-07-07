using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;
using AiBotPlatform.Services;
using AiBotPlatform.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace AiBotPlatform.Tests.Services;

public class ChatServiceTests
{
    private readonly Mock<IChatRepository> _chatRepo = new();
    private readonly Mock<IEncryptionService> _encryption = new();
    private readonly Mock<IDialogflowClientCache> _cache = new();
    private readonly ChatService _sut;

    public ChatServiceTests()
    {
        _sut = new ChatService(
            _chatRepo.Object,
            _encryption.Object,
            _cache.Object,
            NullLogger<ChatService>.Instance);
    }

    // ── GetHistory ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetHistory_ReturnsMappedDtos()
    {
        // Arrange
        var messages = new List<ChatMessage>
        {
            TestFixtures.MakeChatMessage(sender: "user", message: "Hello"),
            TestFixtures.MakeChatMessage(sender: "bot",  message: "Hi there!")
        };
        _chatRepo.Setup(r => r.GetHistoryAsync("user123", "bot123", 50))
            .ReturnsAsync(messages);

        // Act
        var result = await _sut.GetHistoryAsync("user123", "bot123");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("user", result[0].Sender);
        Assert.Equal("Hello", result[0].Message);
        Assert.Equal("bot", result[1].Sender);
    }

    [Fact]
    public async Task GetHistory_Empty_ReturnsEmptyList()
    {
        // Arrange
        _chatRepo.Setup(r => r.GetHistoryAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>()))
            .ReturnsAsync(new List<ChatMessage>());

        // Act
        var result = await _sut.GetHistoryAsync("user1", "bot1");

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetHistory_PassesLimitToRepository()
    {
        // Arrange
        _chatRepo.Setup(r => r.GetHistoryAsync("u", "b", 25)).ReturnsAsync(new List<ChatMessage>());

        // Act
        await _sut.GetHistoryAsync("u", "b", 25);

        // Assert
        _chatRepo.Verify(r => r.GetHistoryAsync("u", "b", 25), Times.Once);
    }

    // ── WarmUp ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task WarmUp_Success_CallsCacheGetOrCreate()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _encryption.Setup(e => e.Decrypt("encrypted-data")).Returns("cred-json");
        _cache.Setup(c => c.GetOrCreateClientAsync("bot123", "cred-json"))
            .ReturnsAsync((Google.Cloud.Dialogflow.V2.SessionsClient)null!);

        // Act — should not throw
        await _sut.WarmUpAsync(bot);

        // Assert
        _cache.Verify(c => c.GetOrCreateClientAsync("bot123", "cred-json"), Times.Once);
    }

    [Fact]
    public async Task WarmUp_CacheThrows_DoesNotPropagate()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _encryption.Setup(e => e.Decrypt(It.IsAny<string>())).Throws(new Exception("decrypt failed"));

        // Act & Assert — warmup failure is non-fatal, must not throw
        await _sut.WarmUpAsync(bot);
    }

    // ── SendMessage (via mocked cache returning null client — tests the path up to Dialogflow call) ──

    [Fact]
    public async Task SendMessage_CacheThrows_ThrowsInvalidOperation()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _encryption.Setup(e => e.Decrypt(It.IsAny<string>())).Returns("cred-json");
        _cache.Setup(c => c.GetOrCreateClientAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("gRPC failure"));

        _chatRepo.Setup(r => r.CreateAsync(It.IsAny<ChatMessage>()))
            .ReturnsAsync(TestFixtures.MakeChatMessage());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.SendMessageAsync("user123", bot, "Hello"));
        Assert.Contains("Failed to get a response from Dialogflow", ex.Message);
    }

    [Fact]
    public async Task SendMessage_CacheThrows_InvalidatesCacheForBot()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _encryption.Setup(e => e.Decrypt(It.IsAny<string>())).Returns("cred-json");
        _cache.Setup(c => c.GetOrCreateClientAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("gRPC failure"));
        _chatRepo.Setup(r => r.CreateAsync(It.IsAny<ChatMessage>()))
            .ReturnsAsync(TestFixtures.MakeChatMessage());

        // Act
        try { await _sut.SendMessageAsync("user123", bot, "Hello"); } catch { }

        // Assert — bad client is evicted from cache
        _cache.Verify(c => c.Invalidate("bot123"), Times.Once);
    }

    [Fact]
    public async Task SendMessage_SavesUserMessageToRepository()
    {
        // Arrange
        var bot = TestFixtures.MakeBot();
        _encryption.Setup(e => e.Decrypt(It.IsAny<string>())).Returns("cred-json");
        _cache.Setup(c => c.GetOrCreateClientAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("force path"));
        _chatRepo.Setup(r => r.CreateAsync(It.IsAny<ChatMessage>()))
            .ReturnsAsync(TestFixtures.MakeChatMessage());

        // Act
        try { await _sut.SendMessageAsync("user123", bot, "Hello there"); } catch { }

        // Assert — user message was persisted before Dialogflow was even called
        _chatRepo.Verify(r => r.CreateAsync(It.Is<ChatMessage>(m =>
            m.Sender == "user" &&
            m.Message == "Hello there" &&
            m.UserId == "user123")), Times.Once);
    }
}
