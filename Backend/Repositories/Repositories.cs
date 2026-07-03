using MongoDB.Driver;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;
using AiBotPlatform.Mongo;

namespace AiBotPlatform.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MongoDbContext _context;

    public UserRepository(MongoDbContext context) => _context = context;

    public async Task<User?> GetByIdAsync(string id)
        => await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();

    public async Task<User?> GetByEmailAsync(string email)
        => await _context.Users.Find(u => u.Email == email.ToLower()).FirstOrDefaultAsync();

    public async Task<User> CreateAsync(User user)
    {
        user.Email = user.Email.ToLower();
        await _context.Users.InsertOneAsync(user);
        return user;
    }

    public async Task<bool> EmailExistsAsync(string email)
        => await _context.Users.Find(u => u.Email == email.ToLower()).AnyAsync();
}

public class BotRepository : IBotRepository
{
    private readonly MongoDbContext _context;

    public BotRepository(MongoDbContext context) => _context = context;

    public async Task<List<Bot>> GetByUserIdAsync(string userId)
        => await _context.Bots.Find(b => b.UserId == userId)
            .SortByDescending(b => b.CreatedDate).ToListAsync();

    public async Task<Bot?> GetByIdAsync(string id)
        => await _context.Bots.Find(b => b.Id == id).FirstOrDefaultAsync();

    public async Task<Bot?> GetByIdAndUserIdAsync(string id, string userId)
        => await _context.Bots.Find(b => b.Id == id && b.UserId == userId).FirstOrDefaultAsync();

    public async Task<Bot> CreateAsync(Bot bot)
    {
        await _context.Bots.InsertOneAsync(bot);
        return bot;
    }

    public async Task UpdateAsync(string id, Bot bot)
    {
        await _context.Bots.ReplaceOneAsync(b => b.Id == id, bot);
    }

    public async Task DeleteAsync(string id)
        => await _context.Bots.DeleteOneAsync(b => b.Id == id);

    public async Task<int> CountByUserIdAsync(string userId)
        => (int)await _context.Bots.CountDocumentsAsync(b => b.UserId == userId);
}

public class ChatRepository : IChatRepository
{
    private readonly MongoDbContext _context;

    public ChatRepository(MongoDbContext context) => _context = context;

    public async Task<List<ChatMessage>> GetHistoryAsync(string userId, string botId, int limit = 50)
        => await _context.ChatMessages
            .Find(c => c.UserId == userId && c.BotId == botId)
            .SortByDescending(c => c.Timestamp)
            .Limit(limit)
            .ToListAsync()
            .ContinueWith(t => { t.Result.Reverse(); return t.Result; });

    public async Task<ChatMessage> CreateAsync(ChatMessage message)
    {
        await _context.ChatMessages.InsertOneAsync(message);
        return message;
    }

    public async Task<int> CountByUserIdAsync(string userId)
        => (int)await _context.ChatMessages.CountDocumentsAsync(c => c.UserId == userId);
}
