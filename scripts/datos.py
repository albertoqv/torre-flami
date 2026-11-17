"""Descarga las estadísticas públicas que escribe el PC en Google Drive y genera data/app.json para la app."""
import json
import urllib.request
from pathlib import Path

ESTADISTICAS = "12jezuRPUOrS0_uxiwCCBHxopWnsPvthp"  # CanalGTA/estadisticas.json (compartido por enlace, solo lectura)
url = f"https://drive.usercontent.google.com/download?id={ESTADISTICAS}&export=download&confirm=t"
with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "torre-flami"}), timeout=60) as r:
    d = json.loads(r.read().decode("utf-8"))

cola = d.get("cola", {})
videos = [{k: v.get(k) for k in ("id", "titulo", "publicado", "vistas", "likes", "short", "canal")} for v in d.get("videos", [])]
salida = {
    "actualizado": d.get("actualizado"),
    "cola": {k: cola.get(k) for k in ("guiones_pendientes", "proximos", "listos_para_subir", "publicados",
                                       "ultima_guion", "ultima_publicacion", "ultima_estrategia", "pc_ultima", "pc_version")},
    "videos": videos[:60],
    "historico": d.get("historico", [])[-24 * 7:],
    "redes": {k: v for k, v in d.get("redes", {}).items() if not k.startswith("_")},
}
destino = Path("data/app.json")
nuevo = json.dumps(salida, ensure_ascii=False, indent=1)
if not destino.exists() or destino.read_text(encoding="utf-8") != nuevo:
    destino.write_text(nuevo, encoding="utf-8")
print("ok", salida["actualizado"])
