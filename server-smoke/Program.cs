using System.Net;
using HilosLauncher;

if (args.Length == 2 && args[0] == "--serve")
{
    using var server = new LocalSiteServer(args[1]);
    Console.WriteLine(server.Start());
    Console.Out.Flush();
    server.WaitForStop();
    return;
}

var testRoot = Path.Combine(Path.GetTempPath(), "hilos-server-smoke-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(testRoot);
var originalDataHome = Environment.GetEnvironmentVariable("XDG_DATA_HOME");
if (!OperatingSystem.IsWindows())
{
    var dataHome = Path.Combine(testRoot, "data");
    Directory.CreateDirectory(dataHome);
    Environment.SetEnvironmentVariable("XDG_DATA_HOME", dataHome);
}

try
{
    var site = Path.Combine(testRoot, "site");
    Directory.CreateDirectory(site);
    Directory.CreateDirectory(Path.Combine(site, "assets"));
    await File.WriteAllTextAsync(Path.Combine(site, "index.html"), "<h1>Hilos</h1>");
    await File.WriteAllTextAsync(Path.Combine(site, "assets", "app.css"), "body { color: navy; }");
    using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };

    using (var server = new LocalSiteServer(site))
    {
        var address = server.Start();
        Check(await http.GetStringAsync(address) == "<h1>Hilos</h1>", "Root serves the site");
        using var css = await http.GetAsync(new Uri(address, "/assets/app.css"));
        Check(css.StatusCode == HttpStatusCode.OK && css.Content.Headers.ContentType?.MediaType == "text/css", "Nested static assets have the right content type");
        await Status(http.GetAsync(new Uri(address, "/missing.js")), HttpStatusCode.NotFound);
        await Status(http.PostAsync(address, null), HttpStatusCode.MethodNotAllowed);
        await Status(http.GetAsync(Endpoint(address, "__close")), HttpStatusCode.MethodNotAllowed);
        await Status(http.GetAsync(Endpoint(address, "__stop")), HttpStatusCode.MethodNotAllowed);
        await Status(http.PostAsync(new Uri(address, "/__close?token=invalid"), null), HttpStatusCode.Forbidden);
        await Status(http.PostAsync(new Uri(address, "/__stop?token=invalid"), null), HttpStatusCode.Forbidden);
        await Status(http.PostAsync(new Uri(address, "/__stop"), null), HttpStatusCode.Forbidden);
        await Task.Delay(2200);
        await Status(http.GetAsync(address), HttpStatusCode.OK);
        Console.WriteLine("PASS static files, methods and invalid tokens");
    }

    using (var server = new LocalSiteServer(site))
    {
        var address = server.Start();
        var stopped = Task.Run(server.WaitForStop);
        await Status(http.PostAsync(Endpoint(address, "__close"), null), HttpStatusCode.NoContent);
        await stopped.WaitAsync(TimeSpan.FromSeconds(4));
        await PortClosed(http, address);
        Console.WriteLine("PASS closing a browser page stops the server");
    }

    using (var server = new LocalSiteServer(site))
    {
        var address = server.Start();
        var stopped = Task.Run(server.WaitForStop);
        await Status(http.PostAsync(Endpoint(address, "__close"), null), HttpStatusCode.NoContent);
        await Status(http.GetAsync(address), HttpStatusCode.OK);
        await Task.Delay(2400);
        Check(!stopped.IsCompleted, "Reload cancels pending closure");
        await Status(http.GetAsync(address), HttpStatusCode.OK);

        await Status(http.PostAsync(Endpoint(address, "__close"), null), HttpStatusCode.NoContent);
        await Status(http.GetAsync(new Uri(address, "/?session=invalid")), HttpStatusCode.OK);
        await stopped.WaitAsync(TimeSpan.FromSeconds(4));
        Console.WriteLine("PASS reload cancellation requires the current session");
    }

    using (var server = new LocalSiteServer(site))
    {
        var address = server.Start();
        var stopped = Task.Run(server.WaitForStop);
        await Status(http.PostAsync(Endpoint(address, "__stop"), null), HttpStatusCode.NoContent);
        await stopped.WaitAsync(TimeSpan.FromSeconds(1));
        await PortClosed(http, address);
        Console.WriteLine("PASS explicit close responds and stops immediately");
    }

    var disposing = new LocalSiteServer(site);
    var disposingAddress = disposing.Start();
    await Status(http.PostAsync(Endpoint(disposingAddress, "__close"), null), HttpStatusCode.NoContent);
    disposing.Dispose();
    disposing.Dispose();
    await Task.Delay(2200);
    await PortClosed(http, disposingAddress);
    Console.WriteLine("PASS dispose safely cancels pending closure");
}
finally
{
    Environment.SetEnvironmentVariable("XDG_DATA_HOME", originalDataHome);
    Directory.Delete(testRoot, recursive: true);
}

static Uri Endpoint(Uri address, string endpoint) =>
    new(address, "/" + endpoint + "?token=" + address.Query["?session=".Length..]);

static async Task Status(Task<HttpResponseMessage> request, HttpStatusCode expected)
{
    using var response = await request;
    Check(response.StatusCode == expected, $"Expected {(int)expected}, received {(int)response.StatusCode}");
}

static async Task PortClosed(HttpClient http, Uri address)
{
    try
    {
        using var response = await http.GetAsync(address);
        throw new InvalidOperationException("The server still accepts connections after closing");
    }
    catch (HttpRequestException)
    {
    }
}

static void Check(bool condition, string message)
{
    if (!condition)
        throw new InvalidOperationException(message);
}
