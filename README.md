# Hilos · Taller de Java

Aplicación de estudio con teoría, progreso de lectura y 20 retos prácticos de programación multihilo.

## Usar el ZIP exportado

Extrae el ZIP y abre `Windows/Hilos.exe`. Elige **Ventana nativa** o **Navegador**. El paquete incluye el ejecutable autocontenido, el sitio web compilado en `dist/multihilo/browser` y todos los archivos fuente para editar y volver a compilar el proyecto.

En modo navegador puedes pulsar **Cerrar aplicación** dentro del taller: detiene el servidor y muestra una página de cierre. También se detiene unos dos segundos después de cerrar la pestaña o la ventana del navegador. Recargar la página cancela ese cierre pendiente. No queda una ventana auxiliar abierta. El botón no aparece en el modo ventana nativa, que se cierra con la **X** habitual. El progreso se conserva entre sesiones.

## Desarrollo web

Requisitos: una versión de Node.js compatible con Angular 22 (por ejemplo, Node.js 24 LTS) y npm.

```powershell
npm.cmd ci
npm.cmd start
```

Angular sirve la aplicación en `http://localhost:4200/`.

## Crear el ejecutable Windows

Requisitos para empaquetar: Node.js, npm y .NET 9 SDK. El ejecutable generado es para Windows x64.

```powershell
npm.cmd run package:windows
```

El ejecutable autocontenido se genera en `launcher/bin/Release/net9.0-windows/win-x64/publish/Hilos.exe`. No necesita Node.js ni .NET instalado en el equipo donde se ejecute.

El logo de Hilos está incrustado como icono del EXE en siete tamaños, de 16 a 256 píxeles, para el Explorador de Windows y los accesos directos.

Al abrirlo, un diálogo pide autorización y permite elegir **Ventana nativa**, **Navegador** o cancelar. La aplicación no solicita permisos de administrador. Extrae el sitio bajo `%LOCALAPPDATA%\Hilos`, lo sirve solo desde `127.0.0.1` y conserva un puerto local para que el progreso del navegador no cambie de origen entre ejecuciones. La ventana nativa utiliza Microsoft Edge WebView2; si el runtime no está disponible, ofrece abrir el navegador predeterminado.

El ejecutable se publica sin firma digital. Windows SmartScreen puede mostrar un aviso de editor desconocido; quitar ese aviso requiere firmar la aplicación con un certificado de firma de código válido.

## Comprobaciones

```powershell
npm.cmd run build
npm.cmd test -- --watch=false
npm.cmd run test:session
npm.cmd run test:server
```

`test:session` comprueba el aviso de cierre del navegador, incluida la alternativa cuando `sendBeacon` no está disponible. `test:server` comprueba con peticiones HTTP reales el cierre, los tokens, las recargas y el botón. Para servir el sitio compilado con el mismo servidor durante una comprobación manual:

```powershell
dotnet run --project server-smoke/ServerSmoke.csproj -- --serve dist/multihilo/browser
```

Abre la dirección impresa añadiendo `&mode=browser` para comprobar el modo navegador o `&mode=native` para comprobar la interfaz sin botón de cierre.

Después de compilar, puedes generar de nuevo el ZIP con Python 3:

```powershell
python scripts/exportar-zip.py
```

El ZIP se guarda en `artifacts/Programacion_Hilo_App_final.zip`. Incluye fuentes, recursos, pruebas, web compilada y todos los archivos publicados para Windows; excluye las dependencias descargadas, las cachés y los archivos temporales de compilación.
