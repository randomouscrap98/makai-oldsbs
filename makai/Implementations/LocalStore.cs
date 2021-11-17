using makai.Interfaces;

namespace makai;

public class LocalStoreConfig
{
    public string? Folder {get;set;}
    public int MaxHashRetries {get;set;}
    public TimeSpan MaxHashWait {get;set;}
}

public class LocalStore : IUploadStore
{
    protected ILogger logger;
    protected LocalStoreConfig config;

    //Semaphores are a primitive locking mechanism (basically a countdown number, see the '1') that ensures
    //nobody can get past the semaphore "grab" until someone else releases it. It's the only locking 
    //primitive that works with "await"
    protected SemaphoreSlim hashLock = new SemaphoreSlim(1);

    public LocalStore(ILogger<LocalStore> logger, LocalStoreConfig config)
    {
        this.logger = logger;
        this.config = config;
    }

    public Task<byte[]> GetDataAsync(string id)
    {
        var path = Path.Join(config.Folder, id);

        if(!File.Exists(path))
            throw new InvalidOperationException("File not found");

        return File.ReadAllBytesAsync(path);
    }

    public async Task<string> PutDataAsync(byte[] data, Func<string> nameGenerator, string mimeType)
    {
        if(await hashLock.WaitAsync(config.MaxHashWait))
        {
            try
            {
                if(!Directory.Exists(config.Folder))
                    Directory.CreateDirectory(config.Folder ?? throw new InvalidOperationException("No config folder set!"));

                string name = "";
                string path = "";

                for (int i = 0; i < config.MaxHashRetries; i++)
                {
                    name = nameGenerator();
                    path = Path.Join(config.Folder, name);

                    if(File.Exists(path))
                    {
                        //Getting here, it's a collision
                        logger.LogInformation($"Tried to generate existing file name {path}");

                        if (i >= config.MaxHashRetries - 1)
                            throw new InvalidOperationException($"Ran out of retries to generate hash! ({config.MaxHashRetries})");
                    }
                    else
                    {
                        break;
                    }
                }

                await File.WriteAllBytesAsync(path, data);

                return name;
            }
            finally
            {
                hashLock.Release();
            }
        }
        else
        {
            throw new InvalidOperationException($"Couldn't acquire local name hash lock! Max wait: {config.MaxHashWait}");
        }
    }
}