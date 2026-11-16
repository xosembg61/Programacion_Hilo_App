"""Exporta las fuentes, la web compilada y el ejecutable Windows en un ZIP."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
published = root / "launcher/bin/Release/net9.0-windows/win-x64/publish"
output = root / "artifacts/Programacion_Hilo_App_final.zip"
excluded = {".git", ".angular", "node_modules", "bin", "obj", "artifacts", "Windows", "__pycache__"}

if not (published / "Hilos.exe").is_file() or not (root / "dist/multihilo/browser/index.html").is_file():
    raise SystemExit("Primero ejecuta npm run package:windows para compilar la web y el EXE.")

output.parent.mkdir(exist_ok=True)
prefix = "Programacion_Hilo_App"
with ZipFile(output, "w", ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if not path.is_file() or excluded.intersection(relative.parts):
            continue
        archive.write(path, f"{prefix}/{relative.as_posix()}")
    for path in sorted(published.rglob("*")):
        if path.is_file():
            archive.write(path, f"{prefix}/Windows/{path.relative_to(published).as_posix()}")

with ZipFile(output) as archive:
    invalid = archive.testzip()
    if invalid:
        raise SystemExit(f"Error al verificar el ZIP: {invalid}")
    print(f"ZIP verificado: {len(archive.namelist())} archivos")
print(output)
