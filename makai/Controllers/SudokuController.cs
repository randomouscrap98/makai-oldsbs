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

    [HttpGet()]
    public async Task<ContentResult> GetIndexAsync()
    {
        var data = GetDefaultData();
        data["root"] = "/sudoku/";

        return new ContentResult{
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("sudoku.index", data)
        };
    }
}