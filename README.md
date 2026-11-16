# Hilos · Taller de Java

Aplicación de estudio con teoría, progreso de lectura y 20 retos prácticos de programación multihilo.

## Desarrollo web

Requisitos: Node.js 22.12 o posterior y npm.

```powershell
npm.cmd install
npm.cmd start
```

Angular sirve la aplicación en `http://localhost:4200/`.

## Crear el ejecutable Windows

Requisitos para empaquetar: Windows x64 y .NET 9 SDK.

```powershell
npm.cmd run package:windows
```

El ejecutable autocontenido se genera en `launcher/bin/Release/net9.0-windows/win-x64/publish/Hilos.exe`. No necesita Node.js ni .NET instalado en el equipo donde se ejecute.

Al abrirlo, un diálogo pide autorización y permite elegir **Ventana nativa**, **Navegador** o cancelar. La aplicación no solicita permisos de administrador. Extrae el sitio bajo `%LOCALAPPDATA%\Hilos`, lo sirve solo desde `127.0.0.1` y conserva un puerto local para que el progreso del navegador no cambie de origen entre ejecuciones. La ventana nativa utiliza Microsoft Edge WebView2; si el runtime no está disponible, ofrece abrir el navegador predeterminado. En modo navegador no queda ninguna ventana auxiliar abierta: al cerrar la pestaña, el navegador avisa al launcher y el servidor local se detiene. Una recarga cancela esa señal.

El ejecutable se publica sin firma digital. Windows SmartScreen puede mostrar un aviso de editor desconocido; quitar ese aviso requiere firmar la aplicación con un certificado de firma de código válido.

## Comprobaciones

```powershell
npm.cmd run build
npm.cmd test -- --watch=false
```
