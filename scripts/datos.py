"""Descarga las estadísticas públicas que escribe el PC en Google Drive y genera data/app.json para la app."""
import json
import urllib.request
from pathlib import Path

# Para añadir otro proyecto: una línea más con su nombre y el id de su estadisticas.json de Drive (compartido por enlace).
PROYECTOS = json.loads(Path("canales.json").read_text(encoding="utf-8"))


def bajar(id_drive):
    url = f"https://drive.usercontent.google.com/download?id={id_drive}&export=download&confirm=t"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "torre-flami"}), timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def generar(d):

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
    return salida


def guardar(ruta, datos):
    nuevo = json.dumps(datos, ensure_ascii=False, indent=1)
    if not ruta.exists() or ruta.read_text(encoding="utf-8") != nuevo:
        ruta.write_text(nuevo, encoding="utf-8")


indice = []
for i, p in enumerate(PROYECTOS):
    try:
        salida = generar(bajar(p["drive"]))
    except Exception as e:  # un proyecto caído no tumba a los demás
        print("error", p["slug"], e)
        continue
    salida["nombre"] = p["nombre"]
    guardar(Path(f"data/{p['slug']}.json"), salida)
    if i == 0:
        guardar(Path("data/app.json"), salida)  # el principal, para versiones antiguas de la app
    indice.append({"slug": p["slug"], "nombre": p["nombre"]})
    print("ok", p["slug"], salida["actualizado"])
guardar(Path("data/canales.json"), indice)
