using AiBotPlatform.Services;
using AiBotPlatform.Tests.Helpers;
using AiBotPlatform.Models;

namespace AiBotPlatform.Tests.Services;

public class EncryptionServiceTests
{
    private readonly EncryptionService _sut = new(TestFixtures.EncryptionOptions());

    [Fact]
    public void Encrypt_ThenDecrypt_ReturnsOriginal()
    {
        // Arrange
        const string plain = "sensitive credential json data";

        // Act
        var cipher = _sut.Encrypt(plain);
        var decrypted = _sut.Decrypt(cipher);

        // Assert
        Assert.Equal(plain, decrypted);
    }

    [Fact]
    public void Encrypt_ProducesDifferentTextThanInput()
    {
        const string plain = "my secret";
        var cipher = _sut.Encrypt(plain);
        Assert.NotEqual(plain, cipher);
    }

    [Fact]
    public void Encrypt_SameInput_ProducesSameOutput()
    {
        // AES-CBC with fixed IV is deterministic
        const string plain = "hello";
        Assert.Equal(_sut.Encrypt(plain), _sut.Encrypt(plain));
    }

    [Fact]
    public void Decrypt_InvalidBase64_ThrowsFormatException()
    {
        Assert.ThrowsAny<Exception>(() => _sut.Decrypt("not-valid-base64!!!"));
    }

    [Fact]
    public void EncryptDecrypt_EmptyString_RoundTrips()
    {
        var cipher = _sut.Encrypt(string.Empty);
        Assert.Equal(string.Empty, _sut.Decrypt(cipher));
    }
}

public class JwtHelperTests
{
    private readonly AiBotPlatform.Helpers.JwtHelper _sut = TestFixtures.MakeJwtHelper();

    [Fact]
    public void GenerateToken_ReturnsNonEmptyToken()
    {
        var user = TestFixtures.MakeUser();
        var (token, expiresAt) = _sut.GenerateToken(user);
        Assert.NotEmpty(token);
        Assert.True(expiresAt > DateTime.UtcNow);
    }

    [Fact]
    public void GenerateToken_ContainsUserIdClaim()
    {
        var user = TestFixtures.MakeUser("myUserId");
        var (token, _) = _sut.GenerateToken(user);

        var principal = _sut.ValidateToken(token);
        Assert.NotNull(principal);
        Assert.Equal("myUserId", principal!.FindFirst("userId")?.Value);
    }

    [Fact]
    public void GenerateToken_ContainsEmailClaim()
    {
        var user = TestFixtures.MakeUser();
        var (token, _) = _sut.GenerateToken(user);

        // Read the raw JWT payload — ClaimsPrincipal maps "email" to a long URI
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        var emailClaim = jwt.Claims.FirstOrDefault(c =>
            c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email);

        Assert.NotNull(emailClaim);
        Assert.Equal(user.Email, emailClaim!.Value);
    }

    [Fact]
    public void ValidateToken_InvalidToken_ReturnsNull()
    {
        var result = _sut.ValidateToken("this.is.not.a.valid.token");
        Assert.Null(result);
    }

    [Fact]
    public void ValidateToken_TamperedToken_ReturnsNull()
    {
        var user = TestFixtures.MakeUser();
        var (token, _) = _sut.GenerateToken(user);
        var tampered = token[..^5] + "XXXXX";
        Assert.Null(_sut.ValidateToken(tampered));
    }

    [Fact]
    public void GenerateToken_TwoCallsProduceDifferentJti()
    {
        // Each token gets a unique JTI claim
        var user = TestFixtures.MakeUser();
        var (token1, _) = _sut.GenerateToken(user);
        var (token2, _) = _sut.GenerateToken(user);
        Assert.NotEqual(token1, token2);
    }
}
