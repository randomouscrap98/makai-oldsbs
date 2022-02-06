using System.Data;
using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;

namespace makai.Controllers;


public class SudokuControllerConfig 
{
    public string ConnectionString {get;set;} = "Data Source=:memory:;"; //This of course won't work
}

//NOTE: because "sudoku" is a converted app and is essentially self-contained within
//this controller, I believe the CONTROLLER should control how it accesses the database,
//and thus the connection is NOT injected into the controller.
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

    //NOTE: this is what we're doing INSTEAD of dependency injection. Be careful!!

    /// <summary>
    /// Generate a new connection and perform the given task with it. Disposes of the connection afterwards.
    /// Consider doing as much work as possible within the call if you're worried about performance.
    /// </summary>
    /// <param name="task"></param>
    /// <typeparam name="T"></typeparam>
    /// <returns></returns>
    private T SimpleDbTask<T>(Func<IDbConnection, T> task)
    {
        using(var dbcon = new SqliteConnection(config.ConnectionString))
        {
            return task(dbcon);
        }
    }


    private async Task<ContentResult> SimpleRender(string subtemplate)
    {
        var data = GetDefaultData();
        data["root"] = "/sudoku/";
        data[$"template_{subtemplate}"] = true;
        data["debug"] = Request.Query.ContainsKey("debug");

        //JUST A TEST
        var userId = HttpContext.Session.GetInt32("userId");
        data["user"] = new { id = userId }; 

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