using Microsoft.Extensions.Options;
using MongoDB.Driver;
using AiBotPlatform.Configuration;
using AiBotPlatform.Models;

namespace AiBotPlatform.Mongo;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);
        CreateIndexes();
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("Users");
    public IMongoCollection<Bot> Bots => _database.GetCollection<Bot>("Bots");
    public IMongoCollection<ChatMessage> ChatMessages => _database.GetCollection<ChatMessage>("ChatHistory");

    private void CreateIndexes()
    {
        // Unique email index
        var emailIndex = Builders<User>.IndexKeys.Ascending(u => u.Email);
        Users.Indexes.CreateOne(new CreateIndexModel<User>(emailIndex,
            new CreateIndexOptions { Unique = true }));

        // Bot userId index
        var botUserIndex = Builders<Bot>.IndexKeys.Ascending(b => b.UserId);
        Bots.Indexes.CreateOne(new CreateIndexModel<Bot>(botUserIndex));

        // Chat compound index
        var chatIndex = Builders<ChatMessage>.IndexKeys
            .Ascending(c => c.UserId)
            .Ascending(c => c.BotId)
            .Descending(c => c.Timestamp);
        ChatMessages.Indexes.CreateOne(new CreateIndexModel<ChatMessage>(chatIndex));
    }
}
