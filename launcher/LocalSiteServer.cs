using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;

namespace HilosLauncher;

internal sealed class LocalSiteServer : IDisposable
{
    private readonly string _siteRoot;
    private readonly string _portFile;
    private readonly CancellationTokenSource _shutdown = new();
    private readonly ManualResetEventSlim _stopped = new(false);
    private readonly object _closeGate = new();
    private TcpListener? _listener;
    private Task? _acceptLoop;
    private CancellationTokenSource? _pendingClose;
    private string _sessionToken = string.Empty;

    internal LocalSiteServer(string siteRoot)
    {
        _siteRoot = Path.GetFullPath(siteRoot);
        var appData = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Hilos");
        Directory.CreateDirectory(appData);
        _portFile = Path.Combine(appData, "web-port.txt");
    }

    internal Uri Start()
    {
        _sessionToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
        if (File.Exists(_portFile) &&
            int.TryParse(File.ReadAllText(_portFile), out var savedPort) &&
            savedPort is >= 1024 and <= 65535)
        {
            try
            {
                _listener = new TcpListener(IPAddress.Loopback, savedPort);
                _listener.Start();
            }
            catch (SocketException)
            {
                _listener = null;
            }
        }

        if (_listener is null)
        {
            _listener = new TcpListener(IPAddress.Loopback, 0);
            _listener.Start();
            File.WriteAllText(_portFile, ((IPEndPoint)_listener.LocalEndpoint).Port.ToString());
        }

        var port = ((IPEndPoint)_listener.LocalEndpoint).Port;
        _acceptLoop = AcceptLoopAsync(_shutdown.Token);
        return new UriBuilder("http", "127.0.0.1", port, "/")
        {
            Query = "session=" + _sessionToken
        }.Uri;
    }

    internal void WaitForStop() => _stopped.Wait();

    private async Task AcceptLoopAsync(CancellationToken cancellationToken)
    {
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                var client = await _listener!.AcceptTcpClientAsync(cancellationToken);
                _ = HandleClientAsync(client, cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
        }
        catch (ObjectDisposedException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (SocketException) when (cancellationToken.IsCancellationRequested)
        {
        }
    }

    private async Task HandleClientAsync(TcpClient client, CancellationToken cancellationToken)
    {
        using (client)
        {
            try
            {
                await using var stream = client.GetStream();
                using var reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true);
                var requestLine = await reader.ReadLineAsync(cancellationToken);
                if (string.IsNullOrWhiteSpace(requestLine))
                    return;

                var request = requestLine.Split(' ', 3, StringSplitOptions.RemoveEmptyEntries);
                string? header;
                while (!string.IsNullOrEmpty(header = await reader.ReadLineAsync(cancellationToken)))
                {
                }

                if (request.Length < 2 || request[0] != "GET")
                {
                    await WriteResponseAsync(stream, 405, "Method Not Allowed", "text/plain; charset=utf-8", [], cancellationToken);
                    return;
                }

                var target = request[1];
                if (!target.StartsWith('/') || target.StartsWith("//", StringComparison.Ordinal))
                {
                    await WriteResponseAsync(stream, 400, "Bad Request", "text/plain; charset=utf-8", [], cancellationToken);
                    return;
                }

                var requestUri = new Uri("http://127.0.0.1" + target);
                var requestPath = requestUri.AbsolutePath;
                var suppliedToken = QueryValue(requestUri.Query, "token");
                if (request[0] == "POST" && requestPath == "/__close")
                {
                    if (CryptographicOperations.FixedTimeEquals(
                        Encoding.ASCII.GetBytes(suppliedToken ?? string.Empty),
                        Encoding.ASCII.GetBytes(_sessionToken)))
                    {
                        ScheduleStop();
                    }
                    await WriteResponseAsync(stream, 204, "No Content", "text/plain; charset=utf-8", [], cancellationToken);
                    return;
                }

                if (request[0] != "GET")
                {
                    await WriteResponseAsync(stream, 405, "Method Not Allowed", "text/plain; charset=utf-8", [], cancellationToken);
                    return;
                }

                var session = QueryValue(requestUri.Query, "session");
                if (string.Equals(session, _sessionToken, StringComparison.Ordinal))
                {
                    CancelPendingStop();
                }

                var relativePath = Uri.UnescapeDataString(requestPath).TrimStart('/');
                if (relativePath.Length == 0)
                    relativePath = "index.html";
                if (relativePath.Split('/', '\\').Any(segment => segment is "." or ".."))
                {
                    await WriteResponseAsync(stream, 400, "Bad Request", "text/plain; charset=utf-8", [], cancellationToken);
                    return;
                }

                var filePath = Path.GetFullPath(Path.Combine(
                    _siteRoot,
                    relativePath.Replace('/', Path.DirectorySeparatorChar)));
                var sitePrefix = _siteRoot + Path.DirectorySeparatorChar;
                if (!filePath.StartsWith(sitePrefix, StringComparison.OrdinalIgnoreCase) || !File.Exists(filePath))
                {
                    await WriteResponseAsync(stream, 404, "Not Found", "text/plain; charset=utf-8", [], cancellationToken);
                    return;
                }

                var contentType = ContentTypeFor(Path.GetExtension(filePath));
                var content = await File.ReadAllBytesAsync(filePath, cancellationToken);
                await WriteResponseAsync(stream, 200, "OK", contentType, content, cancellationToken);
            }
            catch (OperationCanceledException)
            {
            }
            catch (IOException)
            {
            }
            catch (SocketException)
            {
            }
            catch (UriFormatException)
            {
            }
        }
    }

    private static async Task WriteResponseAsync(
        NetworkStream stream,
        int status,
        string reason,
        string contentType,
        byte[] content,
        CancellationToken cancellationToken)
    {
        var headers = Encoding.ASCII.GetBytes(
            $"HTTP/1.1 {status} {reason}\r\n" +
            $"Content-Type: {contentType}\r\n" +
            $"Content-Length: {content.Length}\r\n" +
            "Cache-Control: no-store\r\n" +
            "X-Content-Type-Options: nosniff\r\n" +
            "Connection: close\r\n\r\n");
        await stream.WriteAsync(headers, cancellationToken);
        if (content.Length > 0)
            await stream.WriteAsync(content, cancellationToken);
    }

    private static string ContentTypeFor(string extension) => extension.ToLowerInvariant() switch
    {
        ".html" => "text/html; charset=utf-8",
        ".js" => "text/javascript; charset=utf-8",
        ".css" => "text/css; charset=utf-8",
        ".svg" => "image/svg+xml",
        ".json" => "application/json; charset=utf-8",
        ".ico" => "image/x-icon",
        ".png" => "image/png",
        ".woff" => "font/woff",
        ".woff2" => "font/woff2",
        ".txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream"
    };

    private static string? QueryValue(string query, string name)
    {
        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            if (Uri.UnescapeDataString(parts[0]) == name)
                return parts.Length == 2 ? Uri.UnescapeDataString(parts[1]) : string.Empty;
        }
        return null;
    }

    private void ScheduleStop()
    {
        lock (_closeGate)
        {
            _pendingClose?.Cancel();
            _pendingClose?.Dispose();
            _pendingClose = new CancellationTokenSource();
            _ = StopAfterDelayAsync(_pendingClose.Token);
        }
    }

    private async Task StopAfterDelayAsync(CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
            StopServer();
        }
        catch (OperationCanceledException)
        {
        }
    }

    private void CancelPendingStop()
    {
        lock (_closeGate)
        {
            _pendingClose?.Cancel();
            _pendingClose?.Dispose();
            _pendingClose = null;
        }
    }

    private void StopServer()
    {
        if (_stopped.IsSet)
            return;
        _stopped.Set();
        _shutdown.Cancel();
        _listener?.Stop();
    }

    public void Dispose()
    {
        CancelPendingStop();
        StopServer();
        try
        {
            _acceptLoop?.Wait(TimeSpan.FromSeconds(1));
        }
        catch (AggregateException)
        {
        }
        _shutdown.Dispose();
        _stopped.Dispose();
    }
}