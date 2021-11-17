using System.Text.RegularExpressions;
using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace makai.Controllers;

public class DrawControllerConfig
{
    public string DrawingsFolder {get;set;} = "drawings";
    public string ArtistData {get;set;} = "data.json";
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

    public class ManagerData
    {
        public string? action {get;set;}
        public string? artistID {get;set;}
        public string? drawingID {get;set;}
        public string? drawing {get;set;}
        public string? folderID {get;set;}
        public string? name {get;set;}
    }

    [HttpGet("manager")]
    public Task<IActionResult> GetManager([FromQuery]ManagerData data) { return BaseManager(data); }

    [HttpPost("manager")]
    public Task<IActionResult> PostManager([FromForm]ManagerData data) { return BaseManager(data); }

    public class ArtistData
    {
        public string? artistID {get;set;}
        public DateTime joined {get;set;}
        public Dictionary<string, byte[]> drawings {get;set;} = new Dictionary<string, byte[]>();
        public List<FolderData> folders {get;set;} = new List<FolderData>();
        public string? rootfolder {get;set;}
    }

         //"drawings" => array(),        //associative array; drawingID = key
         //"folders" => array($rootID => createNewFolder($artistID)), //Associative array (all folders)
         //"rootfolder" => $rootID       //Just a shortcut for the root folder.

    public class DrawingData
    {
        public DateTime created {get;set;}
        public DateTime modified {get;set;}
        public long size {get;set;}
        public string? drawingName {get;set;}
        public List<string> tags {get;set;} = new List<string>();
        public int writecount {get;set;}
        public int personalrating {get;set;} //Out of 10
    }

    public class FolderData
    {
        public DateTime created {get;set;}
        public string? name {get;set;} //folderName
        public List<FolderData> children {get;set;} = new List<FolderData>();
         //"parent" => $parent
    }

    public class ManagerResult
    {
        public List<string> errors {get;set;} = new List<string>();
        public object? result {get;set;}
        public List<string> inputhelp {get;set;} = new List<string>();
    }

    protected async Task<IActionResult> BaseManager(ManagerData data)
    {
        var result = new ManagerResult()
        {
            inputhelp = new List<string> { "action", "artistID", "drawing", "drawingID", "folderID", "name" }
        };

        //Grab the artist id
        if(data.artistID == null)
        {
            result.errors.Add("No artist ID given!");
        }
        else if(!Regex.IsMatch(data.artistID, ""))
        {
            result.errors.Add("Artist ID can only be letters, numbers, and underscores!");
        }
        else // This isn't QUITE how the old one worked, but it's close enough and this is safer
        {
            if (data.action == "list")
            {

            }
            else if (data.action == "load")
            {

            }
            else if (data.action == "save")
            {

            }
            else
            {
                result.errors.Add("Uknown action!");
            }
        }

        //FORCE json result (because the old system did so)
        return new JsonResult(result);
    }
}