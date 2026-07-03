using AiBotPlatform.Models;

namespace AiBotPlatform.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByEmailAsync(string email);
    Task<User> CreateAsync(User user);
    Task<bool> EmailExistsAsync(string email);
}

public interface IBotRepository
{
    Task<List<Bot>> GetByUserIdAsync(string userId);
    Task<Bot?> GetByIdAsync(string id);
    Task<Bot?> GetByIdAndUserIdAsync(string id, string userId);
    Task<Bot> CreateAsync(Bot bot);
    Task UpdateAsync(string id, Bot bot);
    Task DeleteAsync(string id);
    Task<int> CountByUserIdAsync(string userId);
}

public interface IChatRepository
{
    Task<List<ChatMessage>> GetHistoryAsync(string userId, string botId, int limit = 50);
    Task<ChatMessage> CreateAsync(ChatMessage message);
    Task<int> CountByUserIdAsync(string userId);
}
