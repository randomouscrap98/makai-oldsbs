
using System.Diagnostics;
using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

public class ChatlogControllerConfig
{
    public string ShellProgram {get;set;} = "";
    public string ChatlogLocation {get;set;} = "";
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
        return "'" + arg.Replace(@"\", @"\\").Replace("'", @"\'") + "'";
    }

    protected string EscapeBashArg(string command)
    {
        return "\"" + command.Replace("\"", "\\\"") + "\"";
    }

    [HttpGet()]
    public async Task<ContentResult> GetIndexAsync([FromQuery]string? search, [FromQuery]string? filefilter,
        [FromQuery]int before, [FromQuery]int after)
    {
        //Need to look up threads? AND posts?? wow 
        var data = GetDefaultData();

        if (!string.IsNullOrEmpty(search))
        {
            var timer = new Stopwatch();
            timer.Start();

            var incl = string.IsNullOrEmpty(filefilter) ? "" : $"--include={EscapeShellArg(filefilter)}";
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
                }, 
                EnableRaisingEvents = true
            };

            var trigger = new SemaphoreSlim(0,1);

            proc.Exited += (sender, args) =>
            {
                trigger.Release();
            };

            proc.Start();
            await trigger.WaitAsync();

            data["command"] = command;
            data["result"] = await proc.StandardOutput.ReadToEndAsync();
            data["error"] = await proc.StandardError.ReadToEndAsync();

            timer.Stop();
            data["time"] = timer.Elapsed.TotalSeconds;
        }

        data["get"] = new
        {
            search = search,
            filefilter = filefilter,
            before = before,
            after = after
        };

        return new ContentResult
        {
            ContentType = "text/html",
            Content = await pageRenderer.RenderPageAsync("chatlog.index", data)
        };
    }
}