using System.Data;
using Dapper;
using Dapper.Contrib.Extensions;
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
    public string SaltString {get;set;} = "abc"; //DON'T DO IT LIKE THIS
}

//NOTE: because "sudoku" is a converted app and is essentially self-contained within
//this controller, I believe the CONTROLLER should control how it accesses the database,
//and thus the connection is NOT injected into the controller.
[ApiController]
[Route("sudoku")]
public class SudokuController : BaseController
{
    protected SudokuControllerConfig config;
    protected HashService hashService;

    public SudokuController(ILogger<SudokuController> logger, SudokuControllerConfig config, IPageRenderer pageRenderer) 
        : base(logger, pageRenderer)
    {
        this.config = config;
        hashService = new HashService(new HashServiceConfig()); //Not using DI, careful!
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

    private byte[] PremiumSalt => System.Text.Encoding.UTF8.GetBytes(config.SaltString);

    private string GetPasswordHash(string password) =>
        Convert.ToBase64String(hashService.GetHash(password, PremiumSalt));

    private bool VerifyPassword(string password, string hash) =>
        hashService.VerifyText(password, Convert.FromBase64String(hash), PremiumSalt);

    private async Task<ContentResult> SimpleRender(string subtemplate)
    {
        var userId = CurrentUser();

        var data = GetDefaultData();
        data["root"] = "/sudoku/";
        data[$"template_{subtemplate}"] = true;
        data["debug"] = Request.Query.ContainsKey("debug");

        data["puzzleSets"] = JsonConvert.SerializeObject(await GetPuzzleSets(userId ?? 0));

        //Set user data if they're logged in
        if(userId.HasValue)
            data["user"] = await GetFullUser(userId.Value);

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

    private Task<SudokuUser> GetUserByName(string username) => SimpleDbTask(con =>
        con.QuerySingleOrDefaultAsync<SudokuUser>("select * from users where username = @username", new { username = username })
    );

    private Task<SudokuUser> GetUserById(int uid) => SimpleDbTask(con =>
        con.QuerySingleOrDefaultAsync<SudokuUser>("select * from users where uid = @uid", new { uid = uid })
    );

    private Task<Dictionary<string, object?>> GetRawSettingsForUser(int uid) => SimpleDbTask(async con =>
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

    private Task<IEnumerable<PuzzleSetAggregate>> GetPuzzleSets(int uid) => SimpleDbTask(con =>
        con.QueryAsync<PuzzleSetAggregate>(
            "select puzzleset, uid, public, count(*) as count from puzzles where uid = @uid or public=1 group by puzzleset",
            new {uid = uid})
    );

    private QueryObject FromResult(object result) => new QueryObject() { queryok = true, result = result };
    private QueryObject FromErrors(IEnumerable<string> errors) => new QueryObject() { queryok = false, errors = errors.ToList() };
    private QueryObject FromError(string error) => FromErrors(new[] { error });

    private async Task<QueryObject> SafetyRun(Func<Task<QueryObject>> action)
    {
        try
        {
            return await action();
        }
        catch(Exception ex)
        {
            return FromError(ex.ToString());
        }
    }

    [HttpPost("login")]
    public Task<QueryObject> LoginAsync([FromForm]string? username, [FromForm]string? password,
        [FromForm]string? password2, [FromForm]bool? logout)
    {
        return SafetyRun(async () =>
        {
            if (logout == true)
            {
                LogoutUser();
                return FromResult(true);
            }
            else if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                if (!string.IsNullOrWhiteSpace(password2)) //This is registration
                {
                    if (password != password2)
                        return FromError("Passwords do not match!");
                    else if (await GetUserByName(username) != null)
                        return FromError("Username already exists!");
                    else if (username.Length > config.MaxUsernameLength)
                        return FromError($"Username too long! Max: {config.MaxUsernameLength} chars");
                    else if (username.Length < config.MinUsernameLength)
                        return FromError($"Username too short! Min: {config.MinUsernameLength} chars");

                    //Guess it's fine, go register them? AND log them in?
                    var id = await SimpleDbTask(con => con.InsertAsync(new SDBUser()
                    {
                        username = username,
                        password = GetPasswordHash(password),
                        admin = false
                    }));

                    if (id <= 0)
                        return FromError("Couldn't register new user: no ID returned from database!");
                    
                    LoginUser(id);
                    return FromResult(true); //The original just returned true
                }
                else //This is login
                {
                    var user = await SimpleDbTask(con => con.QuerySingleOrDefaultAsync<SDBUser>("select * from users where username = @username", new { username = username}));

                    if(user == null)
                        return FromError("No user found with that username!");
                    
                    if(!VerifyPassword(password, user.password))
                        return FromError("Password incorrect!");
                    
                    LoginUser(user.uid);
                    return FromResult(true); //The original just returned true
                }
            }
            else
            {
                return FromError("Must provide username and password, at least! Or logout!");
            }
        });
    }

    [HttpPost("settingsave")]
    public Task<QueryObject> SettingSaveAsync()
    {
        return SafetyRun(async () =>
        {
            var uid = CurrentUser();

            if(uid == null)
                return FromError("Must be logged in to set settings!");

            var result = new QueryObject();

            //Only accept keys from the default settings set
            await SimpleDbTask<Task>(async con =>
            {
                con.Open();

                using(var tsx = con.BeginTransaction())
                {
                    foreach (var key in Request.Form.Keys)
                    {
                        if (DefaultOptions.ContainsKey(key))
                        {
                            await con.ExecuteAsync("delete from settings where uid = @uid and name = @name",
                                new { uid = uid, name = key }, tsx);
                            var sid = await con.InsertAsync(new SDBSetting() {
                                uid = uid.Value,
                                name = key,
                                value = Request.Form[key]
                            }, tsx);

                            if(sid <= 0)
                                throw new InvalidOperationException($"Couldn't insert new setting '{key}'");
                        }
                        else
                        {
                            result.warnings.Add($"Setting '{key}' not found! Skipping!");
                        }
                    }

                    tsx.Commit();
                }
            });

            result.result = true;

            return result;
        });
    }

    [HttpPost("sudokuquery")]
    public Task<QueryObject> SudokuQueryAsync([FromForm]int? pid, [FromForm]string? puzzleset)
    {
        return SafetyRun(async () =>
        {
            var uid = CurrentUser();

            if(!string.IsNullOrWhiteSpace(puzzleset))
            {
                var result = (await SimpleDbTask(con => con.QueryAsync<QueryByPuzzleset>(
                    "SELECT p.pid, (c.cid IS NOT NULL) as completed, (i.ipid IS NOT NULL) as paused, c.completed as completedOn, i.paused as pausedOn " +
                    "FROM puzzles p LEFT JOIN " +
                    "completions c ON c.pid=p.pid LEFT JOIN " + 
                    "inprogress i ON i.pid=p.pid " +
                    "WHERE puzzleset=@puzzleset AND (c.uid=@uid OR c.uid IS NULL) AND " +
                    "(i.uid=@uid OR i.uid IS NULL) " +
                    "GROUP BY p.pid ORDER BY p.pid ", 
                    new { puzzleset = puzzleset, uid = uid }
                ))).ToList();

                for(int i = 0; i < result.Count; i++)
                    result[i].number = i + 1;

                return FromResult(JsonConvert.SerializeObject(result));
            }
            else if(pid != null)
            {
                return FromResult(JsonConvert.SerializeObject(await SimpleDbTask(con => con.QuerySingleOrDefaultAsync<QueryByPid>(
                    "SELECT p.*, i.puzzle as playersolution, i.seconds FROM puzzles p LEFT JOIN " +
                    "inprogress i ON p.pid=i.pid WHERE p.pid=@pid AND " +
                    "(i.uid=@uid OR i.uid IS NULL)", 
                    new { pid = pid, uid = uid }
                ))));
            }
            else
            {
                return FromError("You must provide EITHER pid OR puzzleset!");
            }
            //if(uid == null)
            //    return FromError("Must be logged in to set settings!");
        });
    }

    [HttpPost("puzzlesave")]
    public Task<QueryObject> PuzzleSaveAsync([FromForm]int pid, [FromForm]string? data, [FromForm]bool? delete, [FromForm]int? seconds)
    {
        return SafetyRun(async () =>
        {
            var uid = CurrentUser();

            if(uid == null)
                return FromError("Must be logged in to save puzzles!");
            
            //Go look up the raw puzzle data by pid. If this fails, we must also fail
            var rawPuzzle = await SimpleDbTask(con => con.QuerySingleOrDefaultAsync<SDBPuzzle>("select * from puzzles where pid = @pid", new {pid = pid}));

            if(rawPuzzle == null)
                return FromError($"No puzzle with pid {pid}!");
            
            //Now apparently, in the old one, we always delete progress. That's a bit scary, but ok. It should almost certainly
            //be done in a transaction IMO
            return await SimpleDbTask(async con => 
            {
                var result = new QueryObject();

                con.Open();

                using(var tsx = con.BeginTransaction())
                {
                    //GOSH, in the original php, this would delete EVERYONE'S progress, because there was no uid check!! This was awful!!
                    await con.ExecuteAsync("delete from inprogress where pid = @pid and uid = @uid", new {pid = pid, uid = uid}, tsx);

                    //This SHOULD be a submission
                    if(data != null)
                    {
                        if(seconds == null)
                            return FromError("Must report seconds taken on puzzle so far!");

                        dynamic dataObj = JsonConvert.DeserializeObject(data) ?? throw new InvalidOperationException("Data in bad format, must be valid json!");
                        var userSolution = (string)dataObj.puzzle;

                        //One marks completed, the other just in-progress
                        if(userSolution == rawPuzzle.solution)
                        {
                            var id = await con.InsertAsync(new SDBCompletions()
                            {
                                pid = pid,
                                seconds = seconds.Value,
                                uid = uid.Value
                            }, tsx);

                            if(id <= 0)
                                return FromError("Couldn't save completion!");

                            result.result = "completed";
                        }
                        else
                        {
                            var id = await con.InsertAsync(new SDBInProgress()
                            {
                                pid = pid,
                                seconds = seconds.Value,
                                uid = uid.Value,
                                puzzle = data
                            }, tsx);

                            if(id <= 0)
                                return FromError("Couldn't save puzzle!");

                            result.result = "saved";
                        }
                    }
                    else if(delete != null && delete.Value)
                    {
                        //It's fine, we already deleted it
                        result.result = true;
                    }
                    else
                    {
                        return FromError("Invalid parameters! Must provide either data or set delete!");
                    }

                    tsx.Commit();
                    return result;
                }
            });
        });
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