using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AiBotPlatform.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("createdDate")]
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}

public class Bot
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("botName")]
    public string BotName { get; set; } = string.Empty;

    [BsonElement("projectId")]
    public string ProjectId { get; set; } = string.Empty;

    [BsonElement("credentialFileEncrypted")]
    public string CredentialFileEncrypted { get; set; } = string.Empty;

    [BsonElement("languageCode")]
    public string LanguageCode { get; set; } = "en";

    [BsonElement("createdDate")]
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedDate")]
    public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
}

public class ChatMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("botId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BotId { get; set; } = string.Empty;

    [BsonElement("sender")]
    public string Sender { get; set; } = string.Empty; // "user" | "bot"

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
