using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

[ApiController]
[Route("")]
public class RootController : BaseController
{
    public RootController(ILogger<DrawController> logger, IPageRenderer pageRenderer)  : base(logger, pageRenderer)
    {
        this.pageRenderer = pageRenderer;
    }

    [HttpGet()]
    public async Task<ContentResult> GetIndexAsync()
    {
        var data = GetDefaultData();

        return new ContentResult{
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("index", data)
        };
    }

}