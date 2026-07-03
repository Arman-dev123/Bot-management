using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;

namespace AiBotPlatform.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService) => _chatService = chatService;

    [HttpGet("{botId}/history")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetHistory(string botId, [FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var history = await _chatService.GetHistoryAsync(userId, botId, Math.Min(limit, 200));
        return Ok(history);
    }

    private string GetUserId()
        => User.FindFirst("userId")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();
}
