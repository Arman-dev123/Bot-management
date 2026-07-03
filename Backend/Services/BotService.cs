////using System.Text.Json;
////using AiBotPlatform.DTOs;
////using AiBotPlatform.Interfaces;
////using AiBotPlatform.Models;

////namespace AiBotPlatform.Services;

////public class BotService : IBotService
////{
////    private readonly IBotRepository _botRepo;
////    private readonly IEncryptionService _encryption;
////    private readonly ILogger<BotService> _logger;

////    private static readonly long MaxFileSizeBytes = 1 * 1024 * 1024; // 1MB

////    public BotService(IBotRepository botRepo, IEncryptionService encryption, ILogger<BotService> logger)
////    {
////        _botRepo = botRepo;
////        _encryption = encryption;
////        _logger = logger;
////    }

////    public async Task<BotResponseDto> CreateBotAsync(string userId, CreateBotDto dto, IFormFile credentialFile)
////    {
////        ValidateCredentialFile(credentialFile);

////        string credentialJson;
////        using (var reader = new StreamReader(credentialFile.OpenReadStream()))
////            credentialJson = await reader.ReadToEndAsync();

////        ValidateDialogflowJson(credentialJson);

////        var encryptedCredential = _encryption.Encrypt(credentialJson);

////        var bot = new Bot
////        {
////            UserId = userId,
////            BotName = dto.BotName.Trim(),
////            ProjectId = dto.ProjectId.Trim(),
////            LanguageCode = dto.LanguageCode,
////            CredentialFileEncrypted = encryptedCredential,
////            CreatedDate = DateTime.UtcNow,
////            UpdatedDate = DateTime.UtcNow
////        };

////        var created = await _botRepo.CreateAsync(bot);
////        return MapToDto(created);
////    }

////    public async Task<List<BotResponseDto>> GetBotsAsync(string userId)
////    {
////        var bots = await _botRepo.GetByUserIdAsync(userId);
////        return bots.Select(MapToDto).ToList();
////    }

////    public async Task<BotResponseDto?> GetBotAsync(string userId, string botId)
////    {
////        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId);
////        return bot is null ? null : MapToDto(bot);
////    }

////    public async Task<BotResponseDto> UpdateBotAsync(string userId, string botId, UpdateBotDto dto)
////    {
////        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId)
////            ?? throw new KeyNotFoundException("Bot not found.");

////        if (!string.IsNullOrWhiteSpace(dto.BotName))
////            bot.BotName = dto.BotName.Trim();

////        if (!string.IsNullOrWhiteSpace(dto.LanguageCode))
////            bot.LanguageCode = dto.LanguageCode;

////        bot.UpdatedDate = DateTime.UtcNow;
////        await _botRepo.UpdateAsync(botId, bot);
////        return MapToDto(bot);
////    }

////    public async Task DeleteBotAsync(string userId, string botId)
////    {
////        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId)
////            ?? throw new KeyNotFoundException("Bot not found.");
////        await _botRepo.DeleteAsync(bot.Id!);
////    }

////    private static void ValidateCredentialFile(IFormFile file)
////    {
////        if (file.Length == 0)
////            throw new ArgumentException("Credential file is empty.");

////        if (file.Length > MaxFileSizeBytes)
////            throw new ArgumentException("Credential file exceeds maximum size of 1MB.");

////        var extension = Path.GetExtension(file.FileName).ToLower();
////        if (extension != ".json")
////            throw new ArgumentException("Only JSON files are accepted.");

////        var contentType = file.ContentType.ToLower();
////        if (contentType != "application/json" && contentType != "text/plain" && contentType != "application/octet-stream")
////            throw new ArgumentException("Invalid file content type.");
////    }

////    private static void ValidateDialogflowJson(string json)
////    {
////        try
////        {
////            using var doc = JsonDocument.Parse(json);
////            var root = doc.RootElement;

////            var requiredFields = new[] { "type", "project_id", "private_key_id", "private_key", "client_email" };
////            foreach (var field in requiredFields)
////            {
////                if (!root.TryGetProperty(field, out _))
////                    throw new ArgumentException($"Invalid Dialogflow credential: missing field '{field}'.");
////            }

////            if (root.GetProperty("type").GetString() != "service_account")
////                throw new ArgumentException("Credential file must be a service_account type.");
////        }
////        catch (JsonException)
////        {
////            throw new ArgumentException("Credential file is not valid JSON.");
////        }
////    }

////    private static BotResponseDto MapToDto(Bot bot) => new()
////    {
////        Id = bot.Id!,
////        BotName = bot.BotName,
////        ProjectId = bot.ProjectId,
////        LanguageCode = bot.LanguageCode,
////        CreatedDate = bot.CreatedDate,
////        UpdatedDate = bot.UpdatedDate
////    };
////}




//using System.Text.Json;
//using AiBotPlatform.DTOs;
//using AiBotPlatform.Interfaces;
//using AiBotPlatform.Models;

//namespace AiBotPlatform.Services;

//public class BotService : IBotService
//{
//    private readonly IBotRepository _botRepo;
//    private readonly IEncryptionService _encryption;
//    private readonly IDialogflowClientCache _clientCache;
//    private readonly ILogger<BotService> _logger;

//    private static readonly long MaxFileSizeBytes = 1 * 1024 * 1024; // 1MB

//    public BotService(IBotRepository botRepo, IEncryptionService encryption,
//        IDialogflowClientCache clientCache, ILogger<BotService> logger)
//    {
//        _botRepo = botRepo;
//        _encryption = encryption;
//        _clientCache = clientCache;
//        _logger = logger;
//    }

//    public async Task<BotResponseDto> CreateBotAsync(string userId, CreateBotDto dto, IFormFile credentialFile)
//    {
//        ValidateCredentialFile(credentialFile);

//        string credentialJson;
//        using (var reader = new StreamReader(credentialFile.OpenReadStream()))
//            credentialJson = await reader.ReadToEndAsync();

//        ValidateDialogflowJson(credentialJson);

//        var encryptedCredential = _encryption.Encrypt(credentialJson);

//        var bot = new Bot
//        {
//            UserId = userId,
//            BotName = dto.BotName.Trim(),
//            ProjectId = dto.ProjectId.Trim(),
//            LanguageCode = dto.LanguageCode,
//            CredentialFileEncrypted = encryptedCredential,
//            CreatedDate = DateTime.UtcNow,
//            UpdatedDate = DateTime.UtcNow
//        };

//        var created = await _botRepo.CreateAsync(bot);
//        return MapToDto(created);
//    }

//    public async Task<List<BotResponseDto>> GetBotsAsync(string userId)
//    {
//        var bots = await _botRepo.GetByUserIdAsync(userId);
//        return bots.Select(MapToDto).ToList();
//    }

//    public async Task<BotResponseDto?> GetBotAsync(string userId, string botId)
//    {
//        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId);
//        return bot is null ? null : MapToDto(bot);
//    }

//    public async Task<BotResponseDto> UpdateBotAsync(string userId, string botId, UpdateBotDto dto)
//    {
//        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId)
//            ?? throw new KeyNotFoundException("Bot not found.");

//        if (!string.IsNullOrWhiteSpace(dto.BotName))
//            bot.BotName = dto.BotName.Trim();

//        if (!string.IsNullOrWhiteSpace(dto.LanguageCode))
//            bot.LanguageCode = dto.LanguageCode;

//        bot.UpdatedDate = DateTime.UtcNow;
//        await _botRepo.UpdateAsync(botId, bot);
//        _clientCache.Invalidate(botId);
//        return MapToDto(bot);
//    }

//    public async Task DeleteBotAsync(string userId, string botId)
//    {
//        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId)
//            ?? throw new KeyNotFoundException("Bot not found.");
//        await _botRepo.DeleteAsync(bot.Id!);
//        _clientCache.Invalidate(botId);
//    }

//    private static void ValidateCredentialFile(IFormFile file)
//    {
//        if (file.Length == 0)
//            throw new ArgumentException("Credential file is empty.");

//        if (file.Length > MaxFileSizeBytes)
//            throw new ArgumentException("Credential file exceeds maximum size of 1MB.");

//        var extension = Path.GetExtension(file.FileName).ToLower();
//        if (extension != ".json")
//            throw new ArgumentException("Only JSON files are accepted.");

//        var contentType = file.ContentType.ToLower();
//        if (contentType != "application/json" && contentType != "text/plain" && contentType != "application/octet-stream")
//            throw new ArgumentException("Invalid file content type.");
//    }

//    private static void ValidateDialogflowJson(string json)
//    {
//        try
//        {
//            using var doc = JsonDocument.Parse(json);
//            var root = doc.RootElement;

//            var requiredFields = new[] { "type", "project_id", "private_key_id", "private_key", "client_email" };
//            foreach (var field in requiredFields)
//            {
//                if (!root.TryGetProperty(field, out _))
//                    throw new ArgumentException($"Invalid Dialogflow credential: missing field '{field}'.");
//            }

//            if (root.GetProperty("type").GetString() != "service_account")
//                throw new ArgumentException("Credential file must be a service_account type.");
//        }
//        catch (JsonException)
//        {
//            throw new ArgumentException("Credential file is not valid JSON.");
//        }
//    }

//    private static BotResponseDto MapToDto(Bot bot) => new()
//    {
//        Id = bot.Id!,
//        BotName = bot.BotName,
//        ProjectId = bot.ProjectId,
//        LanguageCode = bot.LanguageCode,
//        CreatedDate = bot.CreatedDate,
//        UpdatedDate = bot.UpdatedDate
//    };
//}


using System.Text.Json;
using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;

namespace AiBotPlatform.Services;

public class BotService : IBotService
{
    private readonly IBotRepository _botRepo;
    private readonly IEncryptionService _encryption;
    private readonly IDialogflowClientCache _clientCache;
    private readonly ILogger<BotService> _logger;

    private static readonly long MaxFileSizeBytes = 1 * 1024 * 1024; // 1MB

    public BotService(IBotRepository botRepo, IEncryptionService encryption,
        IDialogflowClientCache clientCache, ILogger<BotService> logger)
    {
        _botRepo = botRepo;
        _encryption = encryption;
        _clientCache = clientCache;
        _logger = logger;
    }

    public async Task<BotResponseDto> CreateBotAsync(string userId, CreateBotDto dto, IFormFile credentialFile)
    {
        ValidateCredentialFile(credentialFile);

        string credentialJson;
        using (var reader = new StreamReader(credentialFile.OpenReadStream()))
            credentialJson = await reader.ReadToEndAsync();

        ValidateDialogflowJson(credentialJson);

        var encryptedCredential = _encryption.Encrypt(credentialJson);

        var bot = new Bot
        {
            UserId = userId,
            BotName = dto.BotName.Trim(),
            ProjectId = dto.ProjectId.Trim(),
            LanguageCode = dto.LanguageCode,
            CredentialFileEncrypted = encryptedCredential,
            CreatedDate = DateTime.UtcNow,
            UpdatedDate = DateTime.UtcNow
        };

        var created = await _botRepo.CreateAsync(bot);
        return MapToDto(created);
    }

    public async Task<List<BotResponseDto>> GetBotsAsync(string userId)
    {
        var bots = await _botRepo.GetByUserIdAsync(userId);
        return bots.Select(MapToDto).ToList();
    }

    public async Task<BotResponseDto?> GetBotAsync(string userId, string botId)
    {
        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId);
        return bot is null ? null : MapToDto(bot);
    }

    public async Task<BotResponseDto> UpdateBotAsync(string userId, string botId, UpdateBotDto dto)
    {
        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId)
            ?? throw new KeyNotFoundException("Bot not found.");

        if (!string.IsNullOrWhiteSpace(dto.BotName))
            bot.BotName = dto.BotName.Trim();

        if (!string.IsNullOrWhiteSpace(dto.LanguageCode))
            bot.LanguageCode = dto.LanguageCode;

        bot.UpdatedDate = DateTime.UtcNow;
        await _botRepo.UpdateAsync(botId, bot);
        _clientCache.Invalidate(botId);
        return MapToDto(bot);
    }

    public async Task DeleteBotAsync(string userId, string botId)
    {
        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId)
            ?? throw new KeyNotFoundException("Bot not found.");
        await _botRepo.DeleteAsync(bot.Id!);
        _clientCache.Invalidate(botId);
    }

    private static void ValidateCredentialFile(IFormFile file)
    {
        if (file.Length == 0)
            throw new ArgumentException("Credential file is empty.");

        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException("Credential file exceeds maximum size of 1MB.");

        var extension = Path.GetExtension(file.FileName).ToLower();
        if (extension != ".json")
            throw new ArgumentException("Only JSON files are accepted.");

        var contentType = file.ContentType.ToLower();
        if (contentType != "application/json" && contentType != "text/plain" && contentType != "application/octet-stream")
            throw new ArgumentException("Invalid file content type.");
    }

    private static void ValidateDialogflowJson(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var requiredFields = new[] { "type", "project_id", "private_key_id", "private_key", "client_email" };
            foreach (var field in requiredFields)
            {
                if (!root.TryGetProperty(field, out _))
                    throw new ArgumentException($"Invalid Dialogflow credential: missing field '{field}'.");
            }

            if (root.GetProperty("type").GetString() != "service_account")
                throw new ArgumentException("Credential file must be a service_account type.");
        }
        catch (JsonException)
        {
            throw new ArgumentException("Credential file is not valid JSON.");
        }
    }

    private static BotResponseDto MapToDto(Bot bot) => new()
    {
        Id = bot.Id!,
        BotName = bot.BotName,
        ProjectId = bot.ProjectId,
        LanguageCode = bot.LanguageCode,
        CreatedDate = bot.CreatedDate,
        UpdatedDate = bot.UpdatedDate
    };
}
