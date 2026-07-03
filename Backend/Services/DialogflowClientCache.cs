using System.Collections.Concurrent;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Dialogflow.V2;
using Grpc.Auth;
using AiBotPlatform.Interfaces;

namespace AiBotPlatform.Services;

/// <summary>
/// Singleton cache that builds one Dialogflow SessionsClient per bot and reuses it.
/// This eliminates the ~3-10 second gRPC channel setup cost on every message.
/// Thread-safe via ConcurrentDictionary + SemaphoreSlim per bot.
/// </summary>
public class DialogflowClientCache : IDialogflowClientCache, IDisposable
{
    private readonly ConcurrentDictionary<string, SessionsClient> _clients = new();
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly ILogger<DialogflowClientCache> _logger;

    public DialogflowClientCache(ILogger<DialogflowClientCache> logger)
    {
        _logger = logger;
    }

    public async Task<SessionsClient> GetOrCreateClientAsync(string botId, string credentialJson)
    {
        // Fast path: client already cached
        if (_clients.TryGetValue(botId, out var existing))
            return existing;

        // Slow path: create client with per-bot lock to prevent duplicate creation
        var semaphore = _locks.GetOrAdd(botId, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();
        try
        {
            // Double-check after acquiring lock
            if (_clients.TryGetValue(botId, out existing))
                return existing;

            _logger.LogInformation("Building new Dialogflow SessionsClient for bot {BotId}", botId);
            var sw = System.Diagnostics.Stopwatch.StartNew();

            var credential = GoogleCredential
                .FromJson(credentialJson)
                .CreateScoped("https://www.googleapis.com/auth/cloud-platform");

            var client = await new SessionsClientBuilder
            {
                ChannelCredentials = credential.ToChannelCredentials()
            }.BuildAsync();

            _clients[botId] = client;
            sw.Stop();

            _logger.LogInformation(
                "Dialogflow client ready for bot {BotId} in {Elapsed}ms (cached for reuse)",
                botId, sw.ElapsedMilliseconds);

            return client;
        }
        finally
        {
            semaphore.Release();
        }
    }

    /// <summary>
    /// Call this when a bot's credentials are updated or the bot is deleted.
    /// Forces the next message to rebuild the client with fresh credentials.
    /// </summary>
    public void Invalidate(string botId)
    {
        _clients.TryRemove(botId, out _);
        _logger.LogInformation("Dialogflow client cache invalidated for bot {BotId}", botId);
    }

    public void Dispose()
    {
        // SemaphoreSlim instances need explicit disposal; the gRPC channel
        // inside SessionsClient is managed by the Google client library itself.
        foreach (var sem in _locks.Values)
            sem.Dispose();
    }
}