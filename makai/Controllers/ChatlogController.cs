
using System.Diagnostics;
using System.Text.RegularExpressions;
using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

public class ChatlogControllerConfig
{
    public string ShellProgram {get;set;} = "";
    public string ChatlogLocation {get;set;} = "";
    public string IncludeRegex {get;set;} = "";
    public TimeSpan MaxWait {get;set;}
}

[ApiController]
[Route("chatlog")]
public class ChatlogController : BaseController
{
    protected ChatlogControllerConfig config;

    public ChatlogController(ILogger<ChatlogController> logger, ChatlogControllerConfig config, IPageRenderer pageRenderer) 
        : base(logger, pageRenderer)
    {
        this.config = config;
    }

    public class ChatlogSearch
    {
        public string search {get;set;} = "";
        public string filefilter {get;set;} = "";
        public int before {get;set;}
        public int after {get;set;}
    }

    protected string EscapeShellArg(string arg)
    {
        return "'" + arg.Replace(@"\", @"\\").Replace("'", @"'\''") + "'";
    }

    protected string EscapeBashArg(string command)
    {
        return "\"" + command.Replace("\"", "\\\"") + "\"";
    }

    [HttpGet()]
    public async Task<IActionResult> GetIndexAsync([FromQuery]string? search, [FromQuery]string? filefilter,
        [FromQuery]int before, [FromQuery]int after)
    {
        //Need to look up threads? AND posts?? wow 
        var data = GetDefaultData();

        data["get"] = new
        {
            search = search,
            filefilter = filefilter,
            before = before,
            after = after
        };

        data["searchfolder"] = config.ChatlogLocation;

        if (!string.IsNullOrEmpty(search))
        {
            var timer = new Stopwatch();
            timer.Start();

            var incl = "";

            if(!string.IsNullOrEmpty(filefilter))
            {
                if(!Regex.IsMatch(filefilter, config.IncludeRegex))
                    return BadRequest($"Bad characters in include, must be: {config.IncludeRegex}");
                incl = $"--include={filefilter}";
            }

            var command = $"ls *.txt | xargs grep -InE {EscapeShellArg(search)} {incl}";

            if (after > 0)
                command += $" -A {after}";
            if (before > 0)
                command += $" -B {before}";

            var proc = new Process {
                StartInfo = new ProcessStartInfo {
                    FileName = config.ShellProgram,
                    Arguments = $"-c {EscapeBashArg(command)}",
                    WorkingDirectory = config.ChatlogLocation,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            proc.Start();

            var procTask = Task.Run(() =>
            {
                data["result"] = proc.StandardOutput.ReadToEnd();
                data["error"] = proc.StandardError.ReadToEnd();
                proc.WaitForExit();
            });

            //Wait some amount of time for the task to exit
            try
            {
                await procTask.WaitAsync(config.MaxWait);
            }
            catch(Exception ex)
            {
                logger.LogError($"Exception during chatlog search: {ex}");
                return BadRequest($"The system seems to have timed out! Max wait: {config.MaxWait}");
            }

            timer.Stop();
            data["command"] = command;
            data["time"] = timer.Elapsed.TotalSeconds;
        }

        return new ContentResult
        {
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("chatlog.index", data)
        };
    }
}