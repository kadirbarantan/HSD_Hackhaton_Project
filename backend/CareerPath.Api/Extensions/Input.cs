namespace CareerPath.Api.Extensions;

/// <summary>Trims and bounds the free-text that users type, so the database stays tidy.</summary>
public static class Input
{
    public static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static string Text(string? value) => value?.Trim() ?? "";

    public static List<string> Tags(IEnumerable<string>? values, int max, int maxLength = 40) => (values ?? [])
        .Select(value => value.Trim())
        .Where(value => value.Length > 0 && value.Length <= maxLength)
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .Take(max)
        .ToList();

    public static string? Url(string? value)
    {
        var url = Optional(value);
        if (url is null)
        {
            return null;
        }

        var hasScheme = url.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
        return hasScheme ? url : $"https://{url}";
    }

    /// <summary>Accepts a bare username or a full github.com URL and returns the username.</summary>
    public static string? GitHubUsername(string? value)
    {
        var raw = Optional(value);
        if (raw is null)
        {
            return null;
        }

        var username = raw
            .Replace("https://", "", StringComparison.OrdinalIgnoreCase)
            .Replace("http://", "", StringComparison.OrdinalIgnoreCase)
            .Replace("www.", "", StringComparison.OrdinalIgnoreCase)
            .Replace("github.com/", "", StringComparison.OrdinalIgnoreCase)
            .Trim('/', '@', ' ');

        return username.Length == 0 ? null : username;
    }
}
