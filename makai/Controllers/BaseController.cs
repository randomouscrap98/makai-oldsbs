using System.Runtime;
using makai.Interfaces;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

[ApiController]
public class BaseController : Controller
{
    protected ILogger logger;
    protected IPageRenderer pageRenderer;

    public BaseController(ILogger logger, IPageRenderer pageRenderer) 
    {
        this.logger = logger;
        this.pageRenderer = pageRenderer;
    }

    protected Dictionary<string, object> GetDefaultData()
    {
        return new Dictionary<string, object>()
        {
            { "appversion", GetType().Assembly.GetName().Version?.ToString() ?? "UNKNOWN" },
            { "isgcserver", GCSettings.IsServerGC },
            { "requestUri", Request.GetDisplayUrl() }
        };
    }
}
