using System.Text.Json;
using AiBotPlatform.DTOs;
using AiBotPlatform.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace AiBotPlatform.Tests.Middleware;

public class GlobalExceptionMiddlewareTests
{
    private static async Task<(int statusCode, ApiErrorDto? body)> InvokeWithException(Exception ex)
    {
        var middleware = new GlobalExceptionMiddleware(
            _ => throw ex,
            NullLogger<GlobalExceptionMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var body = JsonSerializer.Deserialize<ApiErrorDto>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return (context.Response.StatusCode, body);
    }

    [Fact]
    public async Task UnauthorizedAccessException_Returns401()
    {
        var (status, body) = await InvokeWithException(new UnauthorizedAccessException("Not allowed"));
        Assert.Equal(401, status);
        Assert.Equal("Not allowed", body!.Message);
        Assert.Equal(401, body.StatusCode);
    }

    [Fact]
    public async Task KeyNotFoundException_Returns404()
    {
        var (status, body) = await InvokeWithException(new KeyNotFoundException("Not found"));
        Assert.Equal(404, status);
        Assert.Equal("Not found", body!.Message);
    }

    [Fact]
    public async Task InvalidOperationException_Returns400()
    {
        var (status, body) = await InvokeWithException(new InvalidOperationException("Bad op"));
        Assert.Equal(400, status);
        Assert.Equal("Bad op", body!.Message);
    }

    [Fact]
    public async Task ArgumentException_Returns400()
    {
        var (status, body) = await InvokeWithException(new ArgumentException("Bad arg"));
        Assert.Equal(400, status);
        Assert.Equal("Bad arg", body!.Message);
    }

    [Fact]
    public async Task UnhandledException_Returns500WithGenericMessage()
    {
        var (status, body) = await InvokeWithException(new Exception("Something crashed"));
        Assert.Equal(500, status);
        Assert.Equal("An unexpected error occurred.", body!.Message);
        // Original exception message NOT leaked to client
        Assert.DoesNotContain("Something crashed", body.Message);
    }

    [Fact]
    public async Task ResponseContentType_IsApplicationJson()
    {
        var middleware = new GlobalExceptionMiddleware(
            _ => throw new Exception("test"),
            NullLogger<GlobalExceptionMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        await middleware.InvokeAsync(context);

        Assert.Equal("application/json", context.Response.ContentType);
    }

    [Fact]
    public async Task NoException_PassesThrough_DoesNotAlterResponse()
    {
        var middleware = new GlobalExceptionMiddleware(
            ctx => { ctx.Response.StatusCode = 200; return Task.CompletedTask; },
            NullLogger<GlobalExceptionMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        await middleware.InvokeAsync(context);

        Assert.Equal(200, context.Response.StatusCode);
    }
}
