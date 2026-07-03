


//using AiBotPlatform.DTOs;
//using Microsoft.AspNetCore.Http;

//namespace AiBotPlatform.Interfaces;

//public interface IAuthService
//{
//    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
//    Task<AuthResponseDto> LoginAsync(LoginDto dto);
//}

//public interface IBotService
//{
//    Task<BotResponseDto> CreateBotAsync(string userId, CreateBotDto dto, IFormFile credentialFile);
//    Task<List<BotResponseDto>> GetBotsAsync(string userId);
//    Task<BotResponseDto?> GetBotAsync(string userId, string botId);
//    Task<BotResponseDto> UpdateBotAsync(string userId, string botId, UpdateBotDto dto);
//    Task DeleteBotAsync(string userId, string botId);
//}

//public interface IChatService
//{
//    Task<string> SendMessageAsync(string userId, string botId, string message);
//    Task<List<ChatMessageDto>> GetHistoryAsync(string userId, string botId, int limit = 50);
//}

//public interface IEncryptionService
//{
//    string Encrypt(string plainText);
//    string Decrypt(string cipherText);
//}

//public interface IDashboardService
//{
//    Task<DashboardStatsDto> GetStatsAsync(string userId);
//}

//public interface IDialogflowClientCache
//{
//    Task<Google.Cloud.Dialogflow.V2.SessionsClient> GetOrCreateClientAsync(string botId, string credentialJson);
//    void Invalidate(string botId);
//}



using AiBotPlatform.DTOs;
using AiBotPlatform.Models;
using Microsoft.AspNetCore.Http;

namespace AiBotPlatform.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}

public interface IBotService
{
    Task<BotResponseDto> CreateBotAsync(string userId, CreateBotDto dto, IFormFile credentialFile);
    Task<List<BotResponseDto>> GetBotsAsync(string userId);
    Task<BotResponseDto?> GetBotAsync(string userId, string botId);
    Task<BotResponseDto> UpdateBotAsync(string userId, string botId, UpdateBotDto dto);
    Task DeleteBotAsync(string userId, string botId);
}

public interface IChatService
{
    // Returns all bot response messages (Dialogflow can return multiple)
    Task<List<string>> SendMessageAsync(string userId, Bot bot, string message);
    Task<List<ChatMessageDto>> GetHistoryAsync(string userId, string botId, int limit = 50);
    Task WarmUpAsync(Bot bot);
}

public interface IEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(string userId);
}

public interface IDialogflowClientCache
{
    Task<Google.Cloud.Dialogflow.V2.SessionsClient> GetOrCreateClientAsync(string botId, string credentialJson);
    void Invalidate(string botId);
}
