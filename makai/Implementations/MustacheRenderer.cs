using makai.Interfaces;
using Stubble.Core.Builders;

namespace makai;

/// <summary>
/// A class which renders mustache templates with given data using some default location provided in the constructor.
/// Implements "IPageRenderer" so callers just see they're rendering SOMETHING, in case we don't want to use mustache in the future
/// </summary>
public class MustacheRenderer : IPageRenderer
{
    protected RenderConfig config;
    protected ILogger logger;

    public MustacheRenderer(ILogger<MustacheRenderer> logger, RenderConfig config)
    {
        this.config = config;
        this.logger = logger;
    }

    //This MAY or may not in the future cache the partials. Who knows
    public async Task<Dictionary<string, string>> GetPartialsAsync()
    {
        var files = Directory.GetFiles(
            config.TemplateLocation ?? throw new InvalidOperationException("No template location set!"), 
            "*" + config.TemplateExtension ?? throw new InvalidOperationException("No Partials glob set!"));
        
        var result = new Dictionary<string, string>();

        foreach(var file in files)
            result.Add(Path.GetFileNameWithoutExtension(file), await File.ReadAllTextAsync(file));
        
        return result;
    }

    public async Task<string> RenderPageAsync(string page, Dictionary<string, object?> data)
    {
        var partials = await GetPartialsAsync();
        var pageRaw = await File.ReadAllTextAsync(Path.Join(config.TemplateLocation, page + config.TemplateExtension));

        var stubble = new StubbleBuilder().Configure(s => {
            s.AddToPartialTemplateLoader(new BasicFilePartialLoader(config));
        }).Build();

        return await stubble.RenderAsync(pageRaw, data);
    }
}