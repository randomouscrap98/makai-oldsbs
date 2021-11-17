using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

public class OfflineAnimatorControllerConfig
{
}

[ApiController]
[Route("animator")]
public class OfflineAnimatorController : BaseController
{
    protected OfflineAnimatorControllerConfig config;

    public OfflineAnimatorController(ILogger<OfflineAnimatorController> logger, OfflineAnimatorControllerConfig config, IPageRenderer pageRenderer) 
        : base(logger, pageRenderer)
    {
        this.config = config;
    }

    [HttpGet()]
    public async Task<ContentResult> GetIndexAsync()
    {
        //Need to look up threads? AND posts?? wow 
        var data = GetDefaultData();
        data["root"] = "/animator/";

        return new ContentResult{
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("offlineanimator.index", data)
        };
    }
}