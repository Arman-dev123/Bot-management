using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;

namespace AiBotPlatform.Controllers;


[ApiController]
[Route("api/chat/dfo")]
public class DfoController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IBotRepository _botRepo;
    private readonly ILogger<DfoController> _logger;

    public DfoController(IChatService chatService, IBotRepository botRepo, ILogger<DfoController> logger)
    {
        _chatService = chatService;
        _botRepo = botRepo;
        _logger = logger;
    }


    [HttpPost]
    [AllowAnonymous] // Called by NICE Studio
    public async Task<ActionResult<DfoResponseDto>> HandleDfoMessage([FromBody] DfoMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { message = "Message cannot be empty." });

        if (string.IsNullOrWhiteSpace(dto.BotId) && string.IsNullOrWhiteSpace(dto.SessionId))
            return BadRequest(new { message = "BotId or SessionId is required." });

        try
        {
            _logger.LogInformation(
                "DFO message received — SessionId: {SessionId}, BotId: {BotId}, Message: {Message}",
                dto.SessionId, dto.BotId, dto.Message);

            string botId = dto.BotId ?? string.Empty;

            if (string.IsNullOrEmpty(botId))
            {
                _logger.LogWarning("DFO request missing BotId — returning default response.");
                return Ok(new DfoResponseDto
                {
                    Message = "No bot configured for this channel.",
                    SessionId = dto.SessionId ?? "unknown"
                });
            }

            // Load the bot and send to Dialogflow
            var bot = await _botRepo.GetByIdAsync(botId);
            if (bot is null)
                return NotFound(new { message = $"Bot '{botId}' not found." });

            // Use session ID from NICE CXone contact as the Dialogflow session
            var sessionId = dto.SessionId ?? Guid.NewGuid().ToString();
            var responses = await _chatService.SendMessageAsync(sessionId, bot, dto.Message);

            // Combine all Dialogflow responses into one reply for the DFO channel
            var reply = string.Join(" ", responses);

            _logger.LogInformation("DFO response sent — SessionId: {SessionId}, Reply: {Reply}", sessionId, reply);

            return Ok(new DfoResponseDto
            {
                Message = reply,
                SessionId = sessionId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing DFO message");
            return Ok(new DfoResponseDto
            {
                Message = "I'm having trouble responding right now. Please try again.",
                SessionId = dto.SessionId ?? "unknown"
            });
        }
    }
}
