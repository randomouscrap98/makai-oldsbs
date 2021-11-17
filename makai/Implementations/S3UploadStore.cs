using Amazon.S3;
using Amazon.S3.Model;
using makai.Interfaces;

namespace makai;

public class S3UploadStoreConfig
{
    public string? Bucket {get;set;}
    public int MaxHashRetries {get;set;}
    public TimeSpan MaxHashWait {get;set;}
}

public class S3UploadStore : IUploadStore
{
    protected IAmazonS3 client;
    protected S3UploadStoreConfig config;
    protected ILogger logger;
    
    //You MUST be careful! If you generate multiple upload stores that point to the same bucket,
    //this hash locking mechanism will NOT work!
    protected SemaphoreSlim hashLock = new SemaphoreSlim(1);

    public S3UploadStore(ILogger<S3UploadStore> logger, S3UploadStoreConfig config, IAmazonS3 client)
    {
        this.config = config;
        this.logger = logger;
        this.client = client;

        //Just don't even bother if the config has no bucket. We want to immediately know when this is broken,
        //so it's ok to break the entire kland for this!
        if(string.IsNullOrWhiteSpace(config.Bucket))
            throw new InvalidOperationException("No bucket set for S3 upload store!");
    }

    public async Task<byte[]> GetDataAsync(string id)
    {
        var obj = await client.GetObjectAsync(config.Bucket, id);
        using(var stream = new MemoryStream())
        {
            await obj.ResponseStream.CopyToAsync(stream);
            return stream.ToArray();
        }
    }

    public async Task<string> PutDataAsync(byte[] data, Func<string> nameGenerator, string mimeType)
    {
        if(await hashLock.WaitAsync(config.MaxHashWait))
        {
            try
            {
                string name = "";

                for (int i = 0; i < config.MaxHashRetries; i++)
                {
                    name = nameGenerator(); //$"{GetRandomAlphaString(hashLength)}.{extension}";

                    try
                    {
                        var obj = await client.GetObjectMetadataAsync(config.Bucket, name);

                        //Getting here, it's a collision
                        logger.LogInformation($"Tried to generate existing S3 file name {config.Bucket}/{name}");

                        if (i >= config.MaxHashRetries - 1)
                            throw new InvalidOperationException($"Ran out of retries to generate hash! ({config.MaxHashRetries})");
                    }
                    catch (Amazon.S3.AmazonS3Exception)
                    {
                        break;
                    }
                }

                using(var stream = new MemoryStream(data))
                {
                    //Oh, everything was ok! Now let's upload while we still have the lock
                    var putRequest = new PutObjectRequest
                    {
                        Key = name,
                        BucketName = config.Bucket,
                        InputStream = stream,
                        AutoCloseStream = true,
                        ContentType = mimeType
                    };

                    await client.PutObjectAsync(putRequest);
                }

                return name;
            }
            finally
            {
                hashLock.Release();
            }
        }
        else
        {
            throw new InvalidOperationException($"Couldn't acquire S3 name hash lock! Max wait: {config.MaxHashWait}");
        }
    }
}