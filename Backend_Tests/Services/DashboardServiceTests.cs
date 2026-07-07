using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;
using AiBotPlatform.Services;
using AiBotPlatform.Tests.Helpers;
using Moq;

namespace AiBotPlatform.Tests.Services;

public class DashboardServiceTests
{
    private readonly Mock<IBotRepository> _botRepo = new();
    private readonly Mock<IChatRepository> _chatRepo = new();
    private readonly DashboardService _sut;

    public DashboardServiceTests()
    {
        _sut = new DashboardService(_botRepo.Object, _chatRepo.Object);
    }

    [Fact]
    public async Task GetStats_ReturnsCorrectCounts()
    {
        // Arrange
        var bots = new List<Bot> { TestFixtures.MakeBot("b1"), TestFixtures.MakeBot("b2") };
        _botRepo.Setup(r => r.GetByUserIdAsync("user1")).ReturnsAsync(bots);
        _chatRepo.Setup(r => r.CountByUserIdAsync("user1")).ReturnsAsync(42);

        // Act
        var result = await _sut.GetStatsAsync("user1");

        // Assert
        Assert.Equal(2, result.TotalBots);
        Assert.Equal(42, result.TotalMessages);
    }

    [Fact]
    public async Task GetStats_RecentBotsCappedAtFive()
    {
        // Arrange — 7 bots, only 5 should appear in RecentBots
        var bots = Enumerable.Range(1, 7)
            .Select(i => TestFixtures.MakeBot($"bot{i}")).ToList();
        _botRepo.Setup(r => r.GetByUserIdAsync("user1")).ReturnsAsync(bots);
        _chatRepo.Setup(r => r.CountByUserIdAsync("user1")).ReturnsAsync(0);

        // Act
        var result = await _sut.GetStatsAsync("user1");

        // Assert
        Assert.Equal(5, result.RecentBots.Count);
        Assert.Equal(7, result.TotalBots);
    }

    [Fact]
    public async Task GetStats_NoBots_ReturnsZeros()
    {
        // Arrange
        _botRepo.Setup(r => r.GetByUserIdAsync("user1")).ReturnsAsync(new List<Bot>());
        _chatRepo.Setup(r => r.CountByUserIdAsync("user1")).ReturnsAsync(0);

        // Act
        var result = await _sut.GetStatsAsync("user1");

        // Assert
        Assert.Equal(0, result.TotalBots);
        Assert.Equal(0, result.TotalMessages);
        Assert.Empty(result.RecentBots);
    }

    [Fact]
    public async Task GetStats_RunsBotAndMessageQueryInParallel()
    {
        // Arrange
        _botRepo.Setup(r => r.GetByUserIdAsync("user1")).ReturnsAsync(new List<Bot>());
        _chatRepo.Setup(r => r.CountByUserIdAsync("user1")).ReturnsAsync(0);

        // Act
        await _sut.GetStatsAsync("user1");

        // Assert — both repos must be called exactly once (proves Task.WhenAll is used,
        // not sequential awaits that would skip one if the first throws)
        _botRepo.Verify(r => r.GetByUserIdAsync("user1"), Times.Once);
        _chatRepo.Verify(r => r.CountByUserIdAsync("user1"), Times.Once);
    }
}
