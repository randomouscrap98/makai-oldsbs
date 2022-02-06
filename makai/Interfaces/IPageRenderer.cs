namespace makai.Interfaces;

public interface IPageRenderer
{
    Task<string> RenderPageAsync(string page, Dictionary<string, object?> data);
}