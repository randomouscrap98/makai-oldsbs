namespace makai.Interfaces;

public interface IUploadStore
{
    Task<byte[]> GetDataAsync(string id);
    Task<string> PutDataAsync(byte[] data, Func<string> nameGenerator, string mimeType);
}