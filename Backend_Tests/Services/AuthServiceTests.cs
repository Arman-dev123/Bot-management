using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;
using AiBotPlatform.Services;
using AiBotPlatform.Tests.Helpers;
using Moq;

namespace AiBotPlatform.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(_userRepo.Object, TestFixtures.MakeJwtHelper());
    }

    // ── Register ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ValidDto_ReturnsTokenAndUser()
    {
        // Arrange
        var dto = TestFixtures.ValidRegisterDto();
        _userRepo.Setup(r => r.EmailExistsAsync(dto.Email)).ReturnsAsync(false);
        _userRepo.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => { u.Id = "newId"; return u; });

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        Assert.NotEmpty(result.Token);
        Assert.Equal("newId", result.UserId);
        Assert.Equal("Test User", result.Name);
        Assert.Equal("test@example.com", result.Email);
        Assert.True(result.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task Register_EmailAlreadyExists_ThrowsInvalidOperation()
    {
        // Arrange
        var dto = TestFixtures.ValidRegisterDto();
        _userRepo.Setup(r => r.EmailExistsAsync(dto.Email)).ReturnsAsync(true);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.RegisterAsync(dto));
        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task Register_EmailStoredAsLowercase()
    {
        // Arrange
        var dto = TestFixtures.ValidRegisterDto();
        dto.Email = "UPPER@EXAMPLE.COM";
        _userRepo.Setup(r => r.EmailExistsAsync(dto.Email)).ReturnsAsync(false);

        User? savedUser = null;
        _userRepo.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .Callback<User>(u => savedUser = u)
            .ReturnsAsync((User u) => { u.Id = "id1"; return u; });

        // Act
        await _sut.RegisterAsync(dto);

        // Assert
        Assert.Equal("upper@example.com", savedUser!.Email);
    }

    [Fact]
    public async Task Register_PasswordIsHashed_NotStoredPlaintext()
    {
        // Arrange
        var dto = TestFixtures.ValidRegisterDto();
        _userRepo.Setup(r => r.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);

        User? savedUser = null;
        _userRepo.Setup(r => r.CreateAsync(It.IsAny<User>()))
            .Callback<User>(u => savedUser = u)
            .ReturnsAsync((User u) => { u.Id = "id1"; return u; });

        // Act
        await _sut.RegisterAsync(dto);

        // Assert — hash must not equal the plain password
        Assert.NotEqual(dto.Password, savedUser!.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify(dto.Password, savedUser.PasswordHash));
    }

    // ── Login ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        // Arrange
        var dto = TestFixtures.ValidLoginDto();
        var user = TestFixtures.MakeUser();
        _userRepo.Setup(r => r.GetByEmailAsync(dto.Email)).ReturnsAsync(user);

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        Assert.NotEmpty(result.Token);
        Assert.Equal(user.Id, result.UserId);
    }

    [Fact]
    public async Task Login_UserNotFound_ThrowsUnauthorized()
    {
        // Arrange
        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(TestFixtures.ValidLoginDto()));
        Assert.Contains("Invalid email or password", ex.Message);
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorized()
    {
        // Arrange
        var user = TestFixtures.MakeUser(); // hashed "Password1!"
        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        var dto = new LoginDto { Email = "test@example.com", Password = "WrongPassword!" };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.LoginAsync(dto));
    }

    [Fact]
    public async Task Login_EmailLookupIsCaseInsensitive()
    {
        // Arrange
        var dto = new LoginDto { Email = "TEST@EXAMPLE.COM", Password = "Password1!" };
        _userRepo.Setup(r => r.GetByEmailAsync("test@example.com"))
            .ReturnsAsync(TestFixtures.MakeUser());

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        _userRepo.Verify(r => r.GetByEmailAsync("test@example.com"), Times.Once);
        Assert.NotNull(result);
    }
}
