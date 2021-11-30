using Amazon.S3;
using makai;
using makai.Controllers;
using makai.Interfaces;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var services = builder.Services;
var configuration = builder.Configuration;

void AddConfigBinding<T>(IServiceCollection services, IConfiguration config) where T : class
{
    var name = typeof(T).Name;
    services.Configure<T>(config.GetSection(name));
    services.AddTransient<T>(p => (p.GetService<IOptionsMonitor<T>>() ?? throw new InvalidOperationException($"Mega config failure on {name}!")).CurrentValue);
}

services.AddCors();
services.AddDefaultAWSOptions(configuration.GetAWSOptions());
services.AddAWSService<IAmazonS3>();

//Why are these singletons? They store no state, so why not!
services.AddSingleton<IPageRenderer, MustacheRenderer>();

AddConfigBinding<RenderConfig>(services, configuration);
AddConfigBinding<DrawControllerConfig>(services, configuration);
AddConfigBinding<TinyComputerControllerConfig>(services, configuration);
AddConfigBinding<OfflineAnimatorControllerConfig>(services, configuration);
AddConfigBinding<ChatlogControllerConfig>(services, configuration);

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(builder =>
{
    builder
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader();
});

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
