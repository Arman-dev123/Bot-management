using AiBotPlatform.DTOs;
using AiBotPlatform.Helpers;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;

namespace AiBotPlatform.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly JwtHelper _jwtHelper;

    public AuthService(IUserRepository userRepo, JwtHelper jwtHelper)
    {
        _userRepo = userRepo;
        _jwtHelper = jwtHelper;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await _userRepo.EmailExistsAsync(dto.Email))
            throw new InvalidOperationException("An account with this email already exists.");

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedDate = DateTime.UtcNow
        };

        var created = await _userRepo.CreateAsync(user);
        var (token, expiresAt) = _jwtHelper.GenerateToken(created);

        return new AuthResponseDto
        {
            Token = token,
            UserId = created.Id!,
            Name = created.Name,
            Email = created.Email,
            ExpiresAt = expiresAt
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email.Trim().ToLower())
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var (token, expiresAt) = _jwtHelper.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id!,
            Name = user.Name,
            Email = user.Email,
            ExpiresAt = expiresAt
        };
    }
}
