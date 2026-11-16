using System.Diagnostics;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;

namespace HilosLauncher;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        try
        {
            Log("Inicio del launcher");
            ApplicationConfiguration.Initialize();
            Log("Windows Forms inicializado");

            using var choice = new LaunchChoiceForm();
            Log("Diálogo de permiso creado");
            if (choice.ShowDialog() != DialogResult.OK)
            {
                Log("Inicio cancelado por el usuario");
                return;
            }
            Log($"Modo elegido: {choice.Mode}");

            var siteRoot = SiteExtractor.Extract();
            Log("Contenido local extraído");
            using var server = new LocalSiteServer(siteRoot);
            var address = server.Start();
            Log($"Servidor local iniciado en el puerto {address.Port}");
            var mode = choice.Mode;

            if (mode == LaunchMode.Browser)
            {
                OpenBrowser(address);
                Log("Página abierta en el navegador predeterminado");
                server.WaitForStop();
                Log("Pestaña cerrada; servidor local detenido");
                return;
            }

            if (mode == LaunchMode.Native)
            {
                try
                {
                    _ = CoreWebView2Environment.GetAvailableBrowserVersionString();
                }
                catch (Exception error)
                {
                    var fallback = MessageBox.Show(
                        "No se encuentra Microsoft Edge WebView2 Runtime. Puedes abrir el taller en el navegador predeterminado.\n\n" + error.Message,
                        "Hilos · navegador integrado no disponible",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Information);

                    if (fallback != DialogResult.Yes)
                        return;

                    mode = LaunchMode.Browser;
                    Log("WebView2 no disponible; se eligió navegador");
                }
            }

            if (mode == LaunchMode.Browser)
            {
                OpenBrowser(address);
                Log("Página abierta en el navegador predeterminado");
                server.WaitForStop();
                Log("Pestaña cerrada; servidor local detenido");
            }
            else
            {
                Log("Abriendo ventana WebView2");
                var nativeWindow = new NativeSiteForm(address);
                Application.Run(nativeWindow);
                if (nativeWindow.SwitchToBrowser)
                {
                    OpenBrowser(address);
                    Log("WebView2 cerró; continuando en navegador");
                    server.WaitForStop();
                    Log("Pestaña cerrada; servidor local detenido");
                }
            }
        }
        catch (Exception error)
        {
            Log("ERROR: " + error);
            MessageBox.Show(
                "No se pudo iniciar el taller. No se realizaron cambios del sistema.\n\n" +
                error.Message + "\n\nRegistro: " + LogPath,
                "Hilos · error de inicio",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private static string LogPath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "Hilos",
        "launcher.log");

    internal static void Log(string message)
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(LogPath)!);
            File.AppendAllText(LogPath, $"{DateTimeOffset.Now:O} {message}{Environment.NewLine}");
        }
        catch
        {
        }
    }

    internal static void OpenBrowser(Uri address)
    {
        Process.Start(new ProcessStartInfo(address.AbsoluteUri) { UseShellExecute = true });
    }
}

internal enum LaunchMode
{
    Native,
    Browser
}

internal static class SiteExtractor
{
    internal static string Extract()
    {
        var root = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Hilos",
            "Site");
        Directory.CreateDirectory(root);

        var assembly = Assembly.GetExecutingAssembly();
        foreach (var resourceName in assembly.GetManifestResourceNames())
        {
            if (!resourceName.StartsWith("site/", StringComparison.OrdinalIgnoreCase))
                continue;

            var relativePath = resourceName["site/".Length..]
                .Replace('/', Path.DirectorySeparatorChar)
                .Replace('\\', Path.DirectorySeparatorChar);
            var destination = Path.GetFullPath(Path.Combine(root, relativePath));
            var rootPrefix = Path.GetFullPath(root) + Path.DirectorySeparatorChar;
            if (!destination.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("El paquete contiene una ruta no válida.");

            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            using var input = assembly.GetManifestResourceStream(resourceName)
                ?? throw new InvalidOperationException("No se pudo leer un archivo del paquete.");
            using var output = File.Create(destination);
            input.CopyTo(output);
        }

        if (!File.Exists(Path.Combine(root, "index.html")))
            throw new FileNotFoundException("No se encontró el sitio Angular dentro del paquete.");

        return root;
    }
}