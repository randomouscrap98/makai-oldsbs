using System.Runtime;
using makai.Interfaces;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

public class DrawControllerConfig
{
    //public string AdminId {get;set;} = "PLEASECHANGE";
    //public double CookieExpireHours {get;set;}
}

[ApiController]
[Route("draw")]
public class DrawController : BaseController
{
    protected DrawControllerConfig config;

    public DrawController(ILogger<DrawController> logger, DrawControllerConfig config, IPageRenderer pageRenderer) 
        : base(logger, pageRenderer)
    {
        this.config = config;
    }

    [HttpGet()]
    public async Task<ContentResult> GetIndexAsync([FromQuery]string? nogb, [FromQuery]string? kid)
    {
        //Need to look up threads? AND posts?? wow 
        var data = GetDefaultData();
        data["kid"] = kid ?? "";
        data["nobg"] = nogb ?? "";

        return new ContentResult{
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("draw.index", data)
        };
    }

}