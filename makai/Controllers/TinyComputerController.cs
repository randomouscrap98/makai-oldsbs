using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

public class TinyComputerControllerConfig
{
}

[ApiController]
[Route("tinycomputer")]
public class TinyComputerController : BaseController
{
    protected TinyComputerControllerConfig config;

    public TinyComputerController(ILogger<DrawController> logger, TinyComputerControllerConfig config, IPageRenderer pageRenderer) 
        : base(logger, pageRenderer)
    {
        this.config = config;
    }

    [HttpGet()]
    public async Task<ContentResult> GetIndexAsync()
    {
        //Need to look up threads? AND posts?? wow 
        var data = GetDefaultData();
        data["root"] = "/tinycomputer/";

        return new ContentResult{
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("tinycomputer.index", data)
        };
    }
}