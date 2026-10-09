namespace CareerPath.Api.Dtos;

public enum MatchReasonKind
{
    Strength,
    Gap,
}

public record MatchReasonDto(MatchReasonKind Kind, string Title, string Detail);

/// <summary>One scoring component, so the UI can show where the score came from.</summary>
public record MatchPartDto(string Name, int Score, int Max, string Detail);

public record MatchDto(int Score, string Label, List<MatchPartDto> Parts, List<MatchReasonDto> Reasons);
