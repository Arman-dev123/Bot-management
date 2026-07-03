//using System.Security.Claims;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.SignalR;
//using AiBotPlatform.Interfaces;

//namespace AiBotPlatform.SignalR;

//[Authorize]
//public class ChatHub : Hub
//{
//    private readonly IChatService _chatService;
//    private readonly ILogger<ChatHub> _logger;

//    // In-memory session tracking: connectionId → botId
//    private static readonly Dictionary<string, string> _sessionBots = new();
//    private static readonly object _lock = new();

//    public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
//    {
//        _chatService = chatService;
//        _logger = logger;
//    }

//    public async Task ConnectBot(string botId)
//    {
//        var userId = GetUserId();
//        if (string.IsNullOrEmpty(userId))
//        {
//            await Clients.Caller.SendAsync("Error", "Unauthorized.");
//            return;
//        }

//        lock (_lock)
//        {
//            _sessionBots[Context.ConnectionId] = botId;
//        }

//        // Load history and send to client
//        try
//        {
//            var history = await _chatService.GetHistoryAsync(userId, botId, 50);
//            await Clients.Caller.SendAsync("BotConnected", botId, history);
//            _logger.LogInformation("User {UserId} connected to bot {BotId}", userId, botId);
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error connecting to bot {BotId}", botId);
//            await Clients.Caller.SendAsync("Error", "Failed to load bot history.");
//        }
//    }

//    public async Task SendMessage(string message)
//    {
//        var userId = GetUserId();
//        if (string.IsNullOrEmpty(userId))
//        {
//            await Clients.Caller.SendAsync("Error", "Unauthorized.");
//            return;
//        }

//        string? botId;
//        lock (_lock)
//        {
//            _sessionBots.TryGetValue(Context.ConnectionId, out botId);
//        }

//        if (string.IsNullOrEmpty(botId))
//        {
//            await Clients.Caller.SendAsync("Error", "No bot selected. Call ConnectBot first.");
//            return;
//        }

//        if (string.IsNullOrWhiteSpace(message) || message.Length > 1000)
//        {
//            await Clients.Caller.SendAsync("Error", "Invalid message.");
//            return;
//        }

//        try
//        {
//            // Echo user message back immediately
//            await Clients.Caller.SendAsync("MessageReceived", new
//            {
//                sender = "user",
//                message = message.Trim(),
//                timestamp = DateTime.UtcNow
//            });

//            // Signal typing
//            await Clients.Caller.SendAsync("BotTyping", true);

//            // Get Dialogflow response
//            var response = await _chatService.SendMessageAsync(userId, botId, message.Trim());

//            await Clients.Caller.SendAsync("BotTyping", false);
//            await Clients.Caller.SendAsync("MessageReceived", new
//            {
//                sender = "bot",
//                message = response,
//                timestamp = DateTime.UtcNow
//            });
//        }
//        catch (KeyNotFoundException)
//        {
//            await Clients.Caller.SendAsync("Error", "Bot not found or access denied.");
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error processing message for bot {BotId}", botId);
//            await Clients.Caller.SendAsync("BotTyping", false);
//            await Clients.Caller.SendAsync("Error", "Failed to get bot response. Please try again.");
//        }
//    }

//    public async Task DisconnectBot()
//    {
//        lock (_lock)
//        {
//            _sessionBots.Remove(Context.ConnectionId);
//        }
//        await Clients.Caller.SendAsync("BotDisconnected");
//    }

//    public override async Task OnDisconnectedAsync(Exception? exception)
//    {
//        lock (_lock)
//        {
//            _sessionBots.Remove(Context.ConnectionId);
//        }
//        await base.OnDisconnectedAsync(exception);
//    }

//    private string? GetUserId()
//        => Context.User?.FindFirst("userId")?.Value
//        ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//}



using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using AiBotPlatform.Interfaces;
using AiBotPlatform.Models;

namespace AiBotPlatform.SignalR;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly IBotRepository _botRepo;
    private readonly ILogger<ChatHub> _logger;

    // Store full Bot object per connection — eliminates DB fetch on every message
    private static readonly ConcurrentDictionary<string, (string userId, Bot bot)> _sessions = new();

    public ChatHub(IChatService chatService, IBotRepository botRepo, ILogger<ChatHub> logger)
    {
        _chatService = chatService;
        _botRepo = botRepo;
        _logger = logger;
    }

    public async Task ConnectBot(string botId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            await Clients.Caller.SendAsync("Error", "Unauthorized.");
            return;
        }

        try
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();

            // Load bot once and cache in session
            var bot = await _botRepo.GetByIdAndUserIdAsync(botId, userId);
            if (bot is null)
            {
                await Clients.Caller.SendAsync("Error", "Bot not found or access denied.");
                return;
            }

            _sessions[Context.ConnectionId] = (userId, bot);

            // Load history + warm up Dialogflow client concurrently
            var historyTask = _chatService.GetHistoryAsync(userId, botId, 50);
            var warmupTask = _chatService.WarmUpAsync(bot);

            await Task.WhenAll(historyTask, warmupTask);

            sw.Stop();
            _logger.LogInformation(
                "ConnectBot complete in {Elapsed}ms for user {UserId} bot {BotId}",
                sw.ElapsedMilliseconds, userId, botId);

            await Clients.Caller.SendAsync("BotConnected", botId, historyTask.Result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error connecting to bot {BotId}", botId);
            await Clients.Caller.SendAsync("Error", "Failed to connect to bot.");
        }
    }

    public async Task SendMessage(string message)
    {
        if (!_sessions.TryGetValue(Context.ConnectionId, out var session))
        {
            await Clients.Caller.SendAsync("Error", "No bot selected. Call ConnectBot first.");
            return;
        }

        if (string.IsNullOrWhiteSpace(message) || message.Length > 1000)
        {
            await Clients.Caller.SendAsync("Error", "Invalid message.");
            return;
        }

        var (userId, bot) = session;
        var trimmed = message.Trim();

        try
        {
            var hubSw = System.Diagnostics.Stopwatch.StartNew();

            // Echo user message immediately
            await Clients.Caller.SendAsync("MessageReceived", new
            {
                sender = "user",
                message = trimmed,
                timestamp = DateTime.UtcNow
            });

            await Clients.Caller.SendAsync("BotTyping", true);

            // Returns all response messages (1 or more)
            var responses = await _chatService.SendMessageAsync(userId, bot, trimmed);

            await Clients.Caller.SendAsync("BotTyping", false);

            // Send each response as a separate message bubble
            foreach (var resp in responses)
            {
                await Clients.Caller.SendAsync("MessageReceived", new
                {
                    sender = "bot",
                    message = resp,
                    timestamp = DateTime.UtcNow
                });
            }

            hubSw.Stop();
            _logger.LogInformation(
                "Hub SendMessage total: {Elapsed}ms, {Count} response(s) for bot {BotId}",
                hubSw.ElapsedMilliseconds, responses.Count, bot.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message for bot {BotId}", bot.Id);
            await Clients.Caller.SendAsync("BotTyping", false);
            await Clients.Caller.SendAsync("Error", "Failed to get bot response. Please try again.");
        }
    }

    public async Task DisconnectBot()
    {
        _sessions.TryRemove(Context.ConnectionId, out _);
        await Clients.Caller.SendAsync("BotDisconnected");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _sessions.TryRemove(Context.ConnectionId, out _);
        await base.OnDisconnectedAsync(exception);
    }

    private string? GetUserId()
        => Context.User?.FindFirst("userId")?.Value
        ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
