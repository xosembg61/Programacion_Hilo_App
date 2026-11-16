using System.Reflection;

if (args.Length != 1)
    throw new ArgumentException("Pass the published Hilos.dll path.");

var assembly = Assembly.LoadFrom(Path.GetFullPath(args[0]));
var extractorType = assembly.GetType("HilosLauncher.SiteExtractor", throwOnError: true)!;
var extract = extractorType.GetMethod("Extract", BindingFlags.Static | BindingFlags.NonPublic)!;
var siteRoot = (string)extract.Invoke(null, null)!;
var serverType = assembly.GetType("HilosLauncher.LocalSiteServer", throwOnError: true)!;
var constructor = serverType.GetConstructor(
    BindingFlags.Instance | BindingFlags.NonPublic,
    binder: null,
    types: [typeof(string)],
    modifiers: null)!;
var server = constructor.Invoke([siteRoot]);

try
{
    var address = (Uri)serverType.GetMethod("Start", BindingFlags.Instance | BindingFlags.NonPublic)!
        .Invoke(server, null)!;
    Console.WriteLine(address);
    Console.Out.Flush();
    serverType.GetMethod("WaitForStop", BindingFlags.Instance | BindingFlags.NonPublic)!
        .Invoke(server, null);
    Console.WriteLine("server-stopped");
}
finally
{
    ((IDisposable)server).Dispose();
}
