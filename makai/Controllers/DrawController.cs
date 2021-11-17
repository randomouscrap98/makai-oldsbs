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
public class DrawController : Controller //: KlandBase
{
    protected DrawControllerConfig config;
    protected IPageRenderer pageRenderer;

    public DrawController(ILogger<DrawController> logger, //KlandDbContext dbContext,
        DrawControllerConfig config, IPageRenderer pageRenderer) //: base(logger, dbContext)
    {
        this.config = config;
        this.pageRenderer = pageRenderer;
    }

    protected Dictionary<string, object> GetDefaultData()
    {
        //var adminid = Request.Cookies[AdminIdKey] ?? "";
        return new Dictionary<string, object>()
        {
            { "appversion", GetType().Assembly.GetName().Version?.ToString() ?? "UNKNOWN" },
            //{ "isgcserver", GCSettings.IsServerGC },
            //{ "isAdmin", adminid == config.AdminId},
            //{ AdminIdKey, adminid },
            //{ PostStyleKey, Request.Cookies[PostStyleKey] ?? "" },
            { "requestUri", Request.GetDisplayUrl() }
        };
    }

}