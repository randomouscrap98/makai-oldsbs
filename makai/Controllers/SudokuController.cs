using System.Data;
using Dapper;
using makai.Interfaces;
using makai.Sudoku;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Newtonsoft.Json;

namespace makai.Controllers;


public class SudokuControllerConfig 
{
    public string ConnectionString {get;set;} = "Data Source=:memory:;"; //This of course won't work
    public int MaxUsernameLength {get;set;}
    public int MinUsernameLength {get;set;}
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

    private Dictionary<string, MySudokuOption> DefaultOptions => new Dictionary<string, MySudokuOption>
    {
        { "lowperformance",  new MySudokuOption(false, "Low Performance Mode") },
        { "completed" , new MySudokuOption(true, "Disable buttons for completed numbers") },
        { "noteremove" , new MySudokuOption(true, "Automatic note removal") },
        { "doubleclicknotes" , new MySudokuOption(false, "Double click toggles note mode") },
        { "highlighterrors" , new MySudokuOption(true, "Highlight conflicting cells") },
        { "backgroundstyle" , new MySudokuOption("default", "Background style",
            new[] {"default", "rainbow", "flow"})
        }
    };

    private SudokuUser EmptySudokuUser => new SudokuUser()
    {
        options = new Dictionary<string, MySudokuOption>(DefaultOptions)
    };

    private Task<int?> LookupUserByName(string username) => SimpleDbTask<Task<int?>>(con =>
        con.QuerySingleAsync<int?>("select uid from users where username = @username", new { username = username })
    );

    private Task<SudokuUser?> GetUserById(int uid) => SimpleDbTask<Task<SudokuUser?>>(con =>
        con.QuerySingleAsync<SudokuUser?>("select * from users where uid = @uid", new { uid = uid })
    );

    private Task<Dictionary<string, object?>> GetRawSettingsForUser(int uid) => SimpleDbTask<Task<Dictionary<string, object?>>>(async con =>
    {
        var initialResult = await con.QueryAsync<SDBSetting>("select * from settings where uid = @uid", new { uid = uid });
        return initialResult.ToDictionary(x => x.name, y => JsonConvert.DeserializeObject(y.value));
    });

    private async Task<SudokuUser?> GetFullUser(int uid)
    {
        var result = await GetUserById(uid);

        if(result != null)
        {
            result.options = DefaultOptions;
            var options = await GetRawSettingsForUser(uid);

            foreach (var option in options)
            {
                if(result.options.ContainsKey(option.Key))
                    result.options[option.Key].value = option.Value;
            }
        }
        
        return result;
    }

    private const string UserSessionIdKey = "userId";
    private void LoginUser(int uid) { HttpContext.Session.SetInt32(UserSessionIdKey, uid); }
    private void LogoutUser() { HttpContext.Session.Clear(); }
    private int? CurrentUser() => HttpContext.Session.GetInt32(UserSessionIdKey);

    private QueryObject FromResult(object result) => new QueryObject() { queryok = true, result = result };
    private QueryObject FromErrors(IEnumerable<string> errors) => new QueryObject() { queryok = false, errors = errors.ToList() };
    private QueryObject FromError(string error) => FromErrors(new[] { error });

    [HttpPost("login")]
    public async Task<QueryObject> LoginAsync([FromForm]string? username, [FromForm]string? password,
        [FromForm]string? password2, [FromForm]bool? logout)
    {
        if(logout == true)
        {
            LogoutUser();
            return FromResult(true);
        }
        else if(!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            if(!string.IsNullOrWhiteSpace(password2)) //This is registration
            {
                if(password != password2)
                    return FromError("Passwords do not match!");
                else if(await LookupUserByName(username) != null)
                    return FromError("Username already exists!");
                else if(username.Length > config.MaxUsernameLength)
                    return FromError($"Username too long! Max: {config.MaxUsernameLength} chars");
                else if(username.Length < config.MinUsernameLength)
                    return FromError($"Username too short! Min: {config.MinUsernameLength} chars");
                
                //Guess it's fine, go register them? AND log them in?
            }
            else //This is login
            {

            }
        }
        else
        {
            return FromError("Must provide username and password, at least! Or logout!");
        }
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