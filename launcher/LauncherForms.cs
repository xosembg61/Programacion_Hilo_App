using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace HilosLauncher;

internal sealed class LaunchChoiceForm : Form
{
    private readonly Button _nativeButton;
    private readonly Button _browserButton;
    internal LaunchMode Mode { get; private set; }

    internal LaunchChoiceForm()
    {
        Text = "Hilos · permiso de inicio";
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ShowInTaskbar = true;
        ClientSize = new Size(520, 350);
        BackColor = Color.FromArgb(248, 249, 251);
        Font = new Font("Segoe UI", 9F);
        Icon = LogoFactory.CreateIcon();

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(26),
            ColumnCount = 1,
            RowCount = 4,
            BackColor = BackColor
        };
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 72));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));

        var heading = new Panel { Dock = DockStyle.Fill };
        var logo = new PictureBox
        {
            Image = LogoFactory.CreateBitmap(56),
            Size = new Size(56, 56),
            Location = new Point(0, 5),
            SizeMode = PictureBoxSizeMode.StretchImage
        };
        heading.Controls.Add(logo);
        heading.Controls.Add(new Label
        {
            Text = "HILOS",
            AutoSize = true,
            Font = new Font("Segoe UI", 16F, FontStyle.Bold),
            ForeColor = Color.FromArgb(23, 44, 80),
            Location = new Point(72, 10)
        });
        heading.Controls.Add(new Label
        {
            Text = "TALLER DE JAVA",
            AutoSize = true,
            Font = new Font("Segoe UI", 8F, FontStyle.Bold),
            ForeColor = Color.FromArgb(108, 116, 130),
            Location = new Point(74, 39)
        });
        layout.Controls.Add(heading, 0, 0);

        layout.Controls.Add(new Label
        {
            Text = "¿Autorizas iniciar el taller? Elige dónde abrirlo.",
            AutoSize = true,
            Font = new Font("Segoe UI", 12F, FontStyle.Bold),
            ForeColor = Color.FromArgb(23, 27, 36),
            Margin = new Padding(0, 4, 0, 8)
        }, 0, 1);

        layout.Controls.Add(new Label
        {
            Text = "La aplicación sirve únicamente sus archivos en este equipo (127.0.0.1). No envía datos ni necesita permisos de administrador. Puedes cancelar sin iniciar nada.",
            Dock = DockStyle.Top,
            AutoSize = true,
            MaximumSize = new Size(460, 110),
            ForeColor = Color.FromArgb(86, 96, 107),
            Margin = new Padding(0, 0, 0, 12)
        }, 0, 2);

        var buttons = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false,
            Padding = new Padding(0, 7, 0, 0)
        };
        var cancelButton = CreateButton("Cancelar", false);
        cancelButton.DialogResult = DialogResult.Cancel;
        _browserButton = CreateButton("Navegador", false);
        _browserButton.Click += (_, _) => SelectMode(LaunchMode.Browser);
        _nativeButton = CreateButton("Ventana nativa", true);
        _nativeButton.Click += (_, _) => SelectMode(LaunchMode.Native);
        buttons.Controls.Add(cancelButton);
        buttons.Controls.Add(_browserButton);
        buttons.Controls.Add(_nativeButton);
        layout.Controls.Add(buttons, 0, 3);

        Controls.Add(layout);
        AcceptButton = _nativeButton;
        CancelButton = cancelButton;
    }

    private static Button CreateButton(string text, bool primary) => new()
    {
        Text = text,
        Width = 132,
        Height = 34,
        Margin = new Padding(7, 0, 0, 0),
        FlatStyle = FlatStyle.Flat,
        BackColor = primary ? Color.FromArgb(23, 44, 80) : Color.White,
        ForeColor = primary ? Color.White : Color.FromArgb(23, 44, 80),
        Font = new Font("Segoe UI", 9F, FontStyle.Bold),
        Cursor = Cursors.Hand
    };

    private void SelectMode(LaunchMode mode)
    {
        Mode = mode;
        DialogResult = DialogResult.OK;
        Close();
    }
}

internal sealed class NativeSiteForm : Form
{
    private readonly Uri _address;
    private readonly WebView2 _webView = new();
    internal bool SwitchToBrowser { get; private set; }

    internal NativeSiteForm(Uri address)
    {
        _address = address;
        Text = "Hilos · Programación multihilo en Java";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(850, 620);
        ClientSize = new Size(1380, 900);
        Icon = LogoFactory.CreateIcon();

        _webView.Dock = DockStyle.Fill;
        Controls.Add(_webView);
        Load += LoadSite;
    }

    private async void LoadSite(object? sender, EventArgs e)
    {
        try
        {
            var userData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Hilos",
                "WebView2");
            Directory.CreateDirectory(userData);
            var environment = await CoreWebView2Environment.CreateAsync(null, userData);
            await _webView.EnsureCoreWebView2Async(environment);
            _webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.NavigationCompleted += (_, args) =>
            {
                Program.Log(args.IsSuccess
                    ? "WebView2 cargó la página correctamente"
                    : "ERROR WebView2: " + args.WebErrorStatus);
                if (!args.IsSuccess)
                {
                    OfferBrowserFallback("WebView2 no pudo cargar la página (" + args.WebErrorStatus + ").");
                }
            };
            _webView.CoreWebView2.NewWindowRequested += (_, args) =>
            {
                args.Handled = true;
                OpenExternal(args.Uri);
            };
            _webView.CoreWebView2.NavigationStarting += (_, args) =>
            {
                if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var target) &&
                    (target.Host != _address.Host || target.Port != _address.Port))
                {
                    args.Cancel = true;
                    OpenExternal(args.Uri);
                }
            };
            _webView.Source = _address;
        }
        catch (Exception error)
        {
            Program.Log("ERROR inicializando WebView2: " + error);
            OfferBrowserFallback("No se pudo iniciar la ventana nativa.\n\n" + error.Message);
        }
    }

    private void OfferBrowserFallback(string reason)
    {
        var useBrowser = MessageBox.Show(
            this,
            reason + "\n\n¿Abrir el taller en el navegador predeterminado?",
            "Hilos · alternativa de apertura",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Information);
        if (useBrowser == DialogResult.Yes)
        {
            SwitchToBrowser = true;
        }
        Close();
    }

    private void OpenExternal(string address)
    {
        if (Uri.TryCreate(address, UriKind.Absolute, out var uri) &&
            uri.Scheme is "https" or "http")
        {
            try
            {
                Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
            }
            catch (Exception error)
            {
                MessageBox.Show(this, error.Message, "No se pudo abrir el enlace", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }
    }
}

internal static class LogoFactory
{
    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyIcon(IntPtr handle);

    internal static Bitmap CreateBitmap(int size)
    {
        var bitmap = new Bitmap(size, size);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.SmoothingMode = SmoothingMode.AntiAlias;
        graphics.ScaleTransform(size / 100F, size / 100F);
        using (var background = new SolidBrush(Color.FromArgb(23, 44, 80)))
        using (var shape = RoundedRectangle(0, 0, 100, 100, 24))
            graphics.FillPath(background, shape);

        using var orange = new Pen(Color.FromArgb(242, 166, 74), 8) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round };
        using var blue = new Pen(Color.FromArgb(142, 173, 217), 8) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round };
        graphics.DrawBezier(orange, new PointF(20, 31), new PointF(42, 31), new PointF(42, 69), new PointF(80, 69));
        graphics.DrawBezier(blue, new PointF(20, 69), new PointF(42, 69), new PointF(42, 31), new PointF(80, 31));

        using var white = new SolidBrush(Color.White);
        foreach (var point in new[] { new PointF(20, 31), new PointF(20, 69), new PointF(80, 31), new PointF(80, 69) })
            graphics.FillEllipse(white, point.X - 5, point.Y - 5, 10, 10);
        return bitmap;
    }

    internal static Icon CreateIcon()
    {
        using var bitmap = CreateBitmap(64);
        var handle = bitmap.GetHicon();
        try
        {
            using var icon = Icon.FromHandle(handle);
            return (Icon)icon.Clone();
        }
        finally
        {
            DestroyIcon(handle);
        }
    }

    private static GraphicsPath RoundedRectangle(float x, float y, float width, float height, float radius)
    {
        var path = new GraphicsPath();
        var diameter = radius * 2;
        path.AddArc(x, y, diameter, diameter, 180, 90);
        path.AddArc(x + width - diameter, y, diameter, diameter, 270, 90);
        path.AddArc(x + width - diameter, y + height - diameter, diameter, diameter, 0, 90);
        path.AddArc(x, y + height - diameter, diameter, diameter, 90, 90);
        path.CloseFigure();
        return path;
    }
}