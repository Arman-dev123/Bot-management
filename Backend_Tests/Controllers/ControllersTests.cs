using AiBotPlatform.Controllers;
using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiBotPlatform.Tests.Controllers;

// ── AuthController ──────────────────────────────────────────────────────────

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly AuthController _sut;

    public AuthControllerTests()
    {
        _sut = new AuthController(_authService.Object);
    }

    [Fact]
    public async Task Register_ValidDto_Returns200WithToken()
    {
        // Arrange
        var dto = TestFixtures.ValidRegisterDto();
        var response = new AuthResponseDto { Token = "tok", UserId = "u1", Name = "Test", Email = "t@t.com" };
        _authService.Setup(s => s.RegisterAsync(dto)).ReturnsAsync(response);

        // Act
        var result = await _sut.Register(dto);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.Equal("tok", body.Token);
    }

    [Fact]
    public async Task Register_InvalidModelState_Returns400()
    {
        // Arrange
        _sut.ModelState.AddModelError("Email", "Required");

        // Act
        var result = await _sut.Register(new RegisterDto());

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200()
    {
        // Arrange
        var dto = TestFixtures.ValidLoginDto();
        _authService.Setup(s => s.LoginAsync(dto))
            .ReturnsAsync(new AuthResponseDto { Token = "jwt", UserId = "u1" });

        // Act
        var result = await _sut.Login(dto);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Login_InvalidModelState_Returns400()
    {
        // Arrange
        _sut.ModelState.AddModelError("Password", "Required");

        // Act
        var result = await _sut.Login(new LoginDto());

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}

// ── BotsController ──────────────────────────────────────────────────────────

public class BotsControllerTests
{
    private readonly Mock<IBotService> _botService = new();
    private readonly BotsController _sut;

    public BotsControllerTests()
    {
        _sut = new BotsController(_botService.Object);
        TestFixtures.SetUser(_sut);
    }

    [Fact]
    public async Task GetBots_Returns200WithList()
    {
        // Arrange
        var bots = new List<BotResponseDto>
        {
            new() { Id = "b1", BotName = "Bot1" },
            new() { Id = "b2", BotName = "Bot2" }
        };
        _botService.Setup(s => s.GetBotsAsync("user123")).ReturnsAsync(bots);

        // Act
        var result = await _sut.GetBots();

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<List<BotResponseDto>>(ok.Value);
        Assert.Equal(2, body.Count);
    }

    [Fact]
    public async Task GetBot_ExistingBot_Returns200()
    {
        // Arrange
        var bot = new BotResponseDto { Id = "bot123", BotName = "TestBot" };
        _botService.Setup(s => s.GetBotAsync("user123", "bot123")).ReturnsAsync(bot);

        // Act
        var result = await _sut.GetBot("bot123");

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(bot, ok.Value);
    }

    [Fact]
    public async Task GetBot_NotFound_Returns404()
    {
        // Arrange
        _botService.Setup(s => s.GetBotAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((BotResponseDto?)null);

        // Act
        var result = await _sut.GetBot("missing");

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateBot_NullFile_Returns400()
    {
        // Act
        var result = await _sut.CreateBot(TestFixtures.ValidCreateBotDto(), null!);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateBot_ValidRequest_Returns201()
    {
        // Arrange
        var dto = TestFixtures.ValidCreateBotDto();
        var file = TestFixtures.MakeFormFile(TestFixtures.ValidDialogflowJson());
        var created = new BotResponseDto { Id = "newBot", BotName = dto.BotName };
        _botService.Setup(s => s.CreateBotAsync("user123", dto, file)).ReturnsAsync(created);

        // Act
        var result = await _sut.CreateBot(dto, file);

        // Assert
        var created201 = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal("newBot", ((BotResponseDto)created201.Value!).Id);
    }

    [Fact]
    public async Task UpdateBot_ValidRequest_Returns200()
    {
        // Arrange
        var dto = new UpdateBotDto { BotName = "Updated" };
        var updated = new BotResponseDto { Id = "bot123", BotName = "Updated" };
        _botService.Setup(s => s.UpdateBotAsync("user123", "bot123", dto)).ReturnsAsync(updated);

        // Act
        var result = await _sut.UpdateBot("bot123", dto);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal("Updated", ((BotResponseDto)ok.Value!).BotName);
    }

    [Fact]
    public async Task DeleteBot_ExistingBot_Returns204()
    {
        // Arrange
        _botService.Setup(s => s.DeleteBotAsync("user123", "bot123")).Returns(Task.CompletedTask);

        // Act
        var result = await _sut.DeleteBot("bot123");

        // Assert
        Assert.IsType<NoContentResult>(result);
    }
}

// ── DashboardController ─────────────────────────────────────────────────────

public class DashboardControllerTests
{
    private readonly Mock<IDashboardService> _dashboardService = new();
    private readonly DashboardController _sut;

    public DashboardControllerTests()
    {
        _sut = new DashboardController(_dashboardService.Object);
        TestFixtures.SetUser(_sut);
    }

    [Fact]
    public async Task GetStats_Returns200WithStats()
    {
        // Arrange
        var stats = new DashboardStatsDto { TotalBots = 3, TotalMessages = 20 };
        _dashboardService.Setup(s => s.GetStatsAsync("user123")).ReturnsAsync(stats);

        // Act
        var result = await _sut.GetStats();

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<DashboardStatsDto>(ok.Value);
        Assert.Equal(3, body.TotalBots);
        Assert.Equal(20, body.TotalMessages);
    }
}
