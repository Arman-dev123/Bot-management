using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;

namespace AiBotPlatform.Services;

public class DashboardService : IDashboardService
{
    private readonly IBotRepository _botRepo;
    private readonly IChatRepository _chatRepo;

    public DashboardService(IBotRepository botRepo, IChatRepository chatRepo)
    {
        _botRepo = botRepo;
        _chatRepo = chatRepo;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(string userId)
    {
        var botsTask = _botRepo.GetByUserIdAsync(userId);
        var messageCountTask = _chatRepo.CountByUserIdAsync(userId);

        await Task.WhenAll(botsTask, messageCountTask);

        var bots = await botsTask;
        var messageCount = await messageCountTask;

        var recentBots = bots.Take(5).Select(b => new BotResponseDto
        {
            Id = b.Id!,
            BotName = b.BotName,
            ProjectId = b.ProjectId,
            LanguageCode = b.LanguageCode,
            CreatedDate = b.CreatedDate,
            UpdatedDate = b.UpdatedDate
        }).ToList();

        return new DashboardStatsDto
        {
            TotalBots = bots.Count,
            TotalMessages = messageCount,
            RecentBots = recentBots
        };
    }
}
