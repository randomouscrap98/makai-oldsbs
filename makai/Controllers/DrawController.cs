using System.Text.RegularExpressions;
using makai.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace makai.Controllers;

public class DrawControllerConfig
{
    public string? DrawingsFolder {get;set;} //= "drawings";
    public string? ArtistData {get;set;} //= "data.json";
    public string? GeneralSafetyRegex {get;set;} //= @"^[a-zA-Z0-9_\-]+";
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
        public Dictionary<string, DrawingData> drawings {get;set;} = new Dictionary<string, DrawingData>();
        public Dictionary<string, FolderData> folders {get;set;} = new Dictionary<string, FolderData>();
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
        public string? name {get;set;} //drawingName
        public List<string> tags {get;set;} = new List<string>();
        public int writecount {get;set;}
        public int personalrating {get;set;} //Out of 10
    }

    public class FolderData
    {
        public DateTime created {get;set;}
        public string? name {get;set;} //folderName

        //These are IDS of children (which I think are drawings...)
        public List<string> children {get;set;} = new List<string>();
         //"parent" => $parent
    }

    public class ManagerResult
    {
        public List<string> errors {get;set;} = new List<string>();
        public object? result {get;set;}
        public List<string> inputhelp {get;set;} = new List<string>();
    }

    protected string GetArtistPath(string artistId) => Path.Join(config.DrawingsFolder, artistId);
    protected string GetArtistDataPath(string artistId) => Path.Join(GetArtistPath(artistId), config.ArtistData);
    protected string GetDrawingPath(string artistID, string drawingID) => Path.Join(GetArtistPath(artistID), drawingID);

    //This returns null on error! It is at least logged
    protected async Task<ArtistData?> GetArtistDataAsync(string artistId)
    {
        try
        {
            return JsonConvert.DeserializeObject<ArtistData>(await System.IO.File.ReadAllTextAsync(GetArtistDataPath(artistId)));
        }
        catch(System.IO.FileNotFoundException ex)
        {
            logger.LogError($"Error during artist retrieval: {ex}");
            return null;
        }
    }

    protected bool CreateArtistFolder(string artistId)
    {
        var path = GetArtistDataPath(artistId);
        var folder = Path.GetDirectoryName(path) ?? throw new InvalidOperationException($"Could not get path for user {artistId}");

        //Need a folder before writing artist data
        if(!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
            return true;
        }

        return false;
    }

    //Also creates any necessary directories
    protected Task SaveArtistDataAsync(string artistId, ArtistData data)
    {
        var path = GetArtistDataPath(artistId);
        CreateArtistFolder(artistId);
        return System.IO.File.WriteAllTextAsync(path, JsonConvert.SerializeObject(data));
    }

    protected FolderData GetNewFolder(string name)
    {
        return new FolderData()
        {
            created = DateTime.Now,
            name = name,
            children = new List<string>()
        };
    }

    protected DrawingData GetNewDrawing(string name)
    {
        return new DrawingData()
        {
            created = DateTime.Now,
            modified = DateTime.Now,
            size = 0,
            name = name,
            tags = new List<string>(),
            writecount = 0,
            personalrating = 0
        };
    }

    protected ArtistData GetNewArtist(string artistId)
    {
        var rootid = Guid.NewGuid().ToString();
        var newUser = new ArtistData()
        {
            artistID = artistId,
            joined = DateTime.Now,
            drawings = new Dictionary<string, DrawingData>(),
            folders = new Dictionary<string, FolderData>() {
                    { rootid, GetNewFolder(artistId) } //root folder is named after artist. I don't think I ever implemented folders
                },
            rootfolder = rootid
        };
        return newUser;
    }

    protected async Task<string?> LoadDrawingDataAsync(string artistID, string drawingID)
    {
        //This function doesn't require artist data, we can directly to the data without knowing anything
        var path = GetDrawingPath(artistID, drawingID);

        if(System.IO.File.Exists(path))
            return await System.IO.File.ReadAllTextAsync(path);
        else
            return null;
    }

    protected Task SaveDrawingDataAsync(string artistID, string drawingID, string data)
    {
        //This function doesn't require artist data, we can directly to the data without knowing anything
        var path = GetDrawingPath(artistID, drawingID);
        CreateArtistFolder(artistID);
        return System.IO.File.WriteAllTextAsync(path, data);
    }

    protected Tuple<string, DrawingData>? GetDrawingDataByName(string name, string folderId, ArtistData data)
    {
        if(!data.folders.ContainsKey(folderId))
            throw new InvalidOperationException($"No folder for artist {data.artistID} with id {folderId}!");

        foreach (var child in data.folders[folderId].children)
            if (data.drawings.ContainsKey(child))
                return Tuple.Create(child, data.drawings[child]);
        
        return null;

    }

    protected async Task<IActionResult> BaseManager(ManagerData data)
    {
        var result = new ManagerResult()
        {
            inputhelp = new List<string> { "action", "artistID", "drawing", "drawingID", "folderID", "name" }
        };

        var safetyRegex = config.GeneralSafetyRegex ?? throw new InvalidOperationException("No safety regex set! This is unsafe!");

        try
        {
            //Grab the artist id
            if(string.IsNullOrWhiteSpace(data.artistID))
            {
                result.errors.Add("No artist ID given!");
            }
            else if(!Regex.IsMatch(data.artistID, safetyRegex))
            {
                result.errors.Add($"Artist ID can only be {safetyRegex}!");
            }
            else // This isn't QUITE how the old one worked, but it's close enough and this is safer
            {
                //OK, you're accessing with a normal artist. We DON'T want to create the folder structure unnecessarily
                //for artists who just view the page (that would be far too many folders for randos) so DON'T
                //auto-create the artist folder/file on list
                if (data.action == "list")
                {
                    result.result = await GetArtistDataAsync(data.artistID);
                }
                else if (data.action == "load")
                {
                    if(string.IsNullOrWhiteSpace(data.drawingID)) 
                    {
                        result.errors.Add("No drawing ID given!");
                    }
                    else if(!Regex.IsMatch(data.drawingID, safetyRegex))
                    {
                        result.errors.Add($"Drawing ID can only be {safetyRegex}!");
                    }
                    else
                    {
                        var drawing = await LoadDrawingDataAsync(data.artistID, data.drawingID);
                        
                        if(drawing == null)
                            result.errors.Add("Could not load drawing!");
                        else
                            result.result = drawing;
                    }
                }
                else if (data.action == "save")
                {
                    //Folder is no longer important, as there's no way to create new folders anyway!
                    if(string.IsNullOrEmpty(data.drawing))
                    {
                        result.errors.Add("Did not supply drawing data!");
                    }
                    else if(string.IsNullOrWhiteSpace(data.name))
                    {
                        result.errors.Add("No name supplied for the drawing!");
                    }
                    else
                    {
                        //The GetARtistData function ONLY returns null on filenotfound, so this should be safe.
                        var artist = await GetArtistDataAsync(data.artistID) ?? GetNewArtist(data.artistID);
                        var folderId = artist.rootfolder ?? throw new InvalidOperationException("Artist folder was null!");
                        var drawingData = GetDrawingDataByName(data.name, folderId, artist);

                        if(drawingData == null)
                        {
                            logger.LogInformation($"Drawing {data.name} not found for artist {data.artistID}, creating new drawing entry");

                            drawingData = Tuple.Create(Guid.NewGuid().ToString(), GetNewDrawing(data.name));
                            artist.folders[folderId].children.Add(drawingData.Item1);
                            artist.drawings.Add(drawingData.Item1, drawingData.Item2);
                        }

                        //Now we can save the ACTUAL file data
                        await SaveDrawingDataAsync(data.artistID, drawingData.Item1, data.drawing);

                        //Modify the artist drawing data
                        drawingData.Item2.modified = DateTime.Now;
                        drawingData.Item2.writecount++;
                        drawingData.Item2.size = data.drawing.Length;

                        //And then just store the new state of the artist with the new junk
                        await SaveArtistDataAsync(data.artistID, artist);
                    }
                }
                else
                {
                    result.errors.Add("Uknown action!");
                }
            }
        }
        catch(Exception ex)
        {
            logger.LogError($"Exception during draw manager: {ex}");
            result.errors.Add(ex.Message);
        }

        //FORCE json result (because the old system did so)
        return new JsonResult(result);
    }
}