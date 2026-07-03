



//using Google.Cloud.Dialogflow.V2;
//using AiBotPlatform.DTOs;
//using AiBotPlatform.Interfaces;
//using AiBotPlatform.Models;

//namespace AiBotPlatform.Services;

//public class ChatService : IChatService
//{
//    private readonly IBotRepository _botRepo;
//    private readonly IChatRepository _chatRepo;
//    private readonly IEncryptionService _encryption;
//    private readonly IDialogflowClientCache _clientCache;
//    private readonly ILogger<ChatService> _logger;

//    public ChatService(
//        IBotRepository botRepo,
//        IChatRepository chatRepo,
//        IEncryptionService encryption,
//        IDialogflowClientCache clientCache,
//        ILogger<ChatService> logger)
//    {
//        _botRepo = botRepo;
//        _chatRepo = chatRepo;
//        _encryption = encryption;
//        _clientCache = clientCache;
//        _logger = logger;
//    }

//    public async Task<string> SendMessageAsync(string userId, string botId, string message)
//    {
//        var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId)
//            ?? throw new KeyNotFoundException("Bot not found.");

//        // Persist user message + query Dialogflow in parallel
//        // (no dependency between the two — saves one round-trip to MongoDB)
//        var saveUserMsgTask = _chatRepo.CreateAsync(new ChatMessage
//        {
//            UserId = userId,
//            BotId = botId,
//            Sender = "user",
//            Message = message,
//            Timestamp = DateTime.UtcNow
//        });

//        var dialogflowTask = QueryDialogflowAsync(bot, userId, message);

//        await Task.WhenAll(saveUserMsgTask, dialogflowTask);

//        var botResponse = dialogflowTask.Result;

//        // Fire-and-forget bot message save — don't make the user wait for it
//        _ = _chatRepo.CreateAsync(new ChatMessage
//        {
//            UserId = userId,
//            BotId = botId,
//            Sender = "bot",
//            Message = botResponse,
//            Timestamp = DateTime.UtcNow
//        }).ContinueWith(t =>
//        {
//            if (t.IsFaulted)
//                _logger.LogError(t.Exception, "Failed to save bot message for bot {BotId}", botId);
//        });

//        return botResponse;
//    }

//    public async Task<List<ChatMessageDto>> GetHistoryAsync(string userId, string botId, int limit = 50)
//    {
//        var messages = await _chatRepo.GetHistoryAsync(userId, botId, limit);
//        return messages.Select(m => new ChatMessageDto
//        {
//            Id = m.Id!,
//            BotId = m.BotId,
//            Sender = m.Sender,
//            Message = m.Message,
//            Timestamp = m.Timestamp
//        }).ToList();
//    }

//    private async Task<string> QueryDialogflowAsync(Bot bot, string sessionId, string message)
//    {
//        try
//        {
//            var sw = System.Diagnostics.Stopwatch.StartNew();

//            // Decrypt once and get/create a cached gRPC client — O(1) on warm path
//            var credentialJson = _encryption.Decrypt(bot.CredentialFileEncrypted);
//            var sessionsClient = await _clientCache.GetOrCreateClientAsync(bot.Id!, credentialJson);

//            var session = SessionName.FromProjectSession(bot.ProjectId, sessionId);
//            var queryInput = new QueryInput
//            {
//                Text = new TextInput
//                {
//                    Text = message,
//                    LanguageCode = bot.LanguageCode
//                }
//            };

//            var response = await sessionsClient.DetectIntentAsync(session, queryInput);
//            sw.Stop();

//            _logger.LogInformation(
//                "Dialogflow responded in {Elapsed}ms for bot {BotId}",
//                sw.ElapsedMilliseconds, bot.Id);

//            var fulfillmentText = response.QueryResult.FulfillmentText;
//            return string.IsNullOrEmpty(fulfillmentText)
//                ? "I didn't understand that. Could you please rephrase?"
//                : fulfillmentText;
//        }
//        catch (Exception ex)
//        {
//            // Invalidate cached client in case credentials rotated or channel went bad
//            _clientCache.Invalidate(bot.Id!);
//            _logger.LogError(ex, "Dialogflow query failed for bot {BotId}", bot.Id);
//            throw new InvalidOperationException(
//                "Failed to get a response from Dialogflow. Please check your bot configuration.");
//        }
//    }
//}




using Google.Cloud.Dialogflow.V2;
using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;

namespace AiBotPlatform.Services;

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepo;
    private readonly IEncryptionService _encryption;
    private readonly IDialogflowClientCache _clientCache;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        IChatRepository chatRepo,
        IEncryptionService encryption,
        IDialogflowClientCache clientCache,
        ILogger<ChatService> logger)
    {
        _chatRepo = chatRepo;
        _encryption = encryption;
        _clientCache = clientCache;
        _logger = logger;
    }

    public async Task<List<string>> SendMessageAsync(string userId, Bot bot, string message)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        // Save user message and call Dialogflow in parallel
        var saveUserMsgTask = _chatRepo.CreateAsync(new ChatMessage
        {
            UserId = userId,
            BotId = bot.Id!,
            Sender = "user",
            Message = message,
            Timestamp = DateTime.UtcNow
        });

        var dialogflowTask = QueryDialogflowAsync(bot, userId, message);

        await Task.WhenAll(saveUserMsgTask, dialogflowTask);

        var botResponses = dialogflowTask.Result;
        sw.Stop();
        _logger.LogInformation(
            "SendMessageAsync total: {Elapsed}ms, {Count} response(s) for bot {BotId}",
            sw.ElapsedMilliseconds, botResponses.Count, bot.Id);

        // Save each bot response message — fire-and-forget
        var now = DateTime.UtcNow;
        foreach (var resp in botResponses)
        {
            var captured = resp;
            _ = _chatRepo.CreateAsync(new ChatMessage
            {
                UserId = userId,
                BotId = bot.Id!,
                Sender = "bot",
                Message = captured,
                Timestamp = now
            }).ContinueWith(t =>
            {
                if (t.IsFaulted)
                    _logger.LogError(t.Exception, "Failed to save bot message for bot {BotId}", bot.Id);
            });
        }

        return botResponses;
    }

    public async Task WarmUpAsync(Bot bot)
    {
        try
        {
            var credentialJson = _encryption.Decrypt(bot.CredentialFileEncrypted);
            await _clientCache.GetOrCreateClientAsync(bot.Id!, credentialJson);
            _logger.LogInformation("Dialogflow client warmed up for bot {BotId}", bot.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Dialogflow warmup failed for bot {BotId} (non-fatal)", bot.Id);
        }
    }

    public async Task<List<ChatMessageDto>> GetHistoryAsync(string userId, string botId, int limit = 50)
    {
        var messages = await _chatRepo.GetHistoryAsync(userId, botId, limit);
        return messages.Select(m => new ChatMessageDto
        {
            Id = m.Id!,
            BotId = m.BotId,
            Sender = m.Sender,
            Message = m.Message,
            Timestamp = m.Timestamp
        }).ToList();
    }

    private async Task<List<string>> QueryDialogflowAsync(Bot bot, string sessionId, string message)
    {
        try
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();

            var credentialJson = _encryption.Decrypt(bot.CredentialFileEncrypted);
            var sessionsClient = await _clientCache.GetOrCreateClientAsync(bot.Id!, credentialJson);

            var session = SessionName.FromProjectSession(bot.ProjectId, sessionId);
            var queryInput = new QueryInput
            {
                Text = new TextInput { Text = message, LanguageCode = bot.LanguageCode }
            };

            var response = await sessionsClient.DetectIntentAsync(session, queryInput);
            sw.Stop();
            _logger.LogInformation(
                "Dialogflow DetectIntent: {Elapsed}ms, {Count} fulfillment message(s) for bot {BotId}",
                sw.ElapsedMilliseconds, response.QueryResult.FulfillmentMessages.Count, bot.Id);

            // Extract all text messages from FulfillmentMessages in order
            // Dialogflow returns each response bubble as a separate Message entry
            var texts = response.QueryResult.FulfillmentMessages
                .Where(m => m.Text != null && m.Text.Text_.Any())
                .SelectMany(m => m.Text.Text_)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToList();

            if (texts.Count == 0)
            {
                // Fallback to FulfillmentText if messages list is unexpectedly empty
                var fallback = response.QueryResult.FulfillmentText;
                texts = string.IsNullOrWhiteSpace(fallback)
                    ? new List<string> { "I didn't understand that. Could you please rephrase?" }
                    : new List<string> { fallback };
            }

            _logger.LogInformation(
                "Extracted {Count} text response(s) from Dialogflow for bot {BotId}: [{Messages}]",
                texts.Count, bot.Id, string.Join(" | ", texts));

            return texts;
        }
        catch (Exception ex)
        {
            _clientCache.Invalidate(bot.Id!);
            _logger.LogError(ex, "Dialogflow query failed for bot {BotId}", bot.Id);
            throw new InvalidOperationException(
                "Failed to get a response from Dialogflow. Please check your bot configuration.");
        }
    }
}
