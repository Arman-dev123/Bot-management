using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AiBotPlatform.DTOs;
using AiBotPlatform.Interfaces;

namespace AiBotPlatform.Controllers;

[ApiController]
[Route("api/bots")]
[Authorize]
public class BotsController : ControllerBase
{
    private readonly IBotService _botService;

    public BotsController(IBotService botService) => _botService = botService;

    [HttpPost("create")]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2MB limit
    public async Task<ActionResult<BotResponseDto>> CreateBot(
        [FromForm] CreateBotDto dto,
        IFormFile credentialFile)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (credentialFile == null)
            return BadRequest(new { message = "Credential file is required." });

        var userId = GetUserId();
        var result = await _botService.CreateBotAsync(userId, dto, credentialFile);
        return CreatedAtAction(nameof(GetBot), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<BotResponseDto>>> GetBots()
    {
        var userId = GetUserId();
        var bots = await _botService.GetBotsAsync(userId);
        return Ok(bots);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BotResponseDto>> GetBot(string id)
    {
        var userId = GetUserId();
        var bot = await _botService.GetBotAsync(userId, id);
        if (bot is null) return NotFound();
        return Ok(bot);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BotResponseDto>> UpdateBot(string id, [FromBody] UpdateBotDto dto)
    {
        var userId = GetUserId();
        var updated = await _botService.UpdateBotAsync(userId, id, dto);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBot(string id)
    {
        var userId = GetUserId();
        await _botService.DeleteBotAsync(userId, id);
        return NoContent();
    }

    private string GetUserId()
        => User.FindFirst("userId")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();
}
