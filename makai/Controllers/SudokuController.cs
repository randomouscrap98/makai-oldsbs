using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;


public class SudokuControllerConfig 
{
}

[ApiController]
[Route("sudoku")]
public class SudokuController : BaseController
{
    protected SudokuControllerConfig config;

    public SudokuController(ILogger<SudokuController> logger, SudokuControllerConfig config, IPageRenderer pageRenderer) 
        : base(logger, pageRenderer)
    {
        this.config = config;
    }

    private async Task<ContentResult> SimpleRender(string subtemplate)
    {
        var data = GetDefaultData();
        data["root"] = "/sudoku/";
        data[$"template_{subtemplate}"] = true;
        data["debug"] = Request.Query.ContainsKey("debug");

        return new ContentResult{
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("sudoku.index", data)
        };
    }

    [HttpGet()]
    public Task<ContentResult> GetIndexAsync()
    {
        return SimpleRender("game");
    }

    [HttpGet("bgtest")]
    public Task<ContentResult> GetBgTestAsync() { return SimpleRender("bgtest"); }

    [HttpGet("convert")]
    public Task<ContentResult> GetConvertAsync() { return SimpleRender("convert"); }
}