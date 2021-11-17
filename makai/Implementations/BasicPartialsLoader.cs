using Stubble.Core.Interfaces;

namespace makai;

/// <summary>
/// A partials (templates) loader for Mustache (called Stubble) which loads partials from files
/// by name. This was the default behavior in standard Mustache, Stubble decided they were too
/// good to provide the default behavior to anybody.
/// </summary>
public class BasicFilePartialLoader : IStubbleLoader
{
    /// <summary>
    /// The folder to get the partials from
    /// </summary>
    protected RenderConfig config;

    public BasicFilePartialLoader(RenderConfig config)
    {
        this.config = config;
    }

    /// <summary>
    /// An IStubbleLoader required function, clones ourselves
    /// </summary>
    /// <returns>A shallow copy of "this"</returns>
    public IStubbleLoader Clone()
    {
        return (IStubbleLoader)this.MemberwiseClone();
    }

    /// <summary>
    /// Load a partial (a template) by name; required by IStubbleLoader
    /// </summary>
    /// <param name="name">The name of the partial to load (not a full path, just a name)</param>
    /// <returns>The partial contents</returns>
    public string Load(string name)
    {
        return LoadAsync(name).Result;
    }

    /// <summary>
    /// Load a partial (a template) by name asynchronously; required by IStubbleLoader
    /// </summary>
    /// <param name="name">The name of the partial to load (not a full path, just a name)</param>
    /// <returns>The partial contents</returns>
    public async ValueTask<string> LoadAsync(string name)
    {
        var path = Path.Combine(config.TemplateLocation ?? throw new InvalidOperationException("No templates folder set!"), 
            name + config.TemplateExtension);
        if (!File.Exists(path)) throw new InvalidOperationException($"Cannot find partial {path}");
        return await File.ReadAllTextAsync(path);
    }
}