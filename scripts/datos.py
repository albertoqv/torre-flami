"""Descarga las estadísticas públicas que escribe el PC en Google Drive y genera data/app.json para la app."""
import json
import re
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# Para añadir otro proyecto: una línea más con su nombre y el id de su estadisticas.json de Drive (compartido por enlace).
PROYECTOS = json.loads(Path("canales.json").read_text(encoding="utf-8"))


def bajar(id_drive):
    url = f"https://drive.usercontent.google.com/download?id={id_drive}&export=download&confirm=t"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "torre-flami"}), timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def web(url, extra=None):
    cab = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", "Cookie": "SOCS=CAI; CONSENT=YES+cb"}
    cab.update(extra or {})
    with urllib.request.urlopen(urllib.request.Request(url, headers=cab), timeout=30) as r:
        return r.read().decode("utf-8", "ignore")


def numero(t):
    t = t.strip().replace(",", "")
    m = re.match(r"([\d.]+)\s*([KkMm])?", t)
    if not m:
        return None
    n = float(m.group(1))
    return int(n * (1000 if (m.group(2) or "").lower() == "k" else 1_000_000 if (m.group(2) or "").lower() == "m" else 1))


def youtube(canal):
    h = web(f"https://www.youtube.com/channel/{canal}?hl=en&gl=US")
    for pat in (r'"subscriberCountText":\{[^}]*?"(?:simpleText|content)":"([\d.,]+[KM]?) subscribers?"',
                r'"content":"([\d.,]+[KM]?) subscribers?"', r'([\d.,]+[KM]?) subscribers?'):
        m = re.search(pat, h)
        if m:
            return numero(m.group(1))
    if "No subscribers" in h or '"0 subscribers"' in h:
        return 0
    print("   youtube sin cifra:", len(h), "bytes", "consent" in h[:3000].lower())
    return None


def tiktok(usuario):
    h = web(f"https://www.tiktok.com/@{usuario}")
    num = lambda k: (lambda m: int(m.group(1)) if m else None)(re.search(rf'"{k}":(\d+)', h))
    r = {"seguidores": num("followerCount"), "likes": num("heartCount") or num("heart"), "videos": num("videoCount")}
    return r if r["seguidores"] is not None else None


def instagram(usuario):
    try:
        j = json.loads(web(f"https://www.instagram.com/api/v1/users/web_profile_info/?username={usuario}", {"x-ig-app-id": "936619743392459"}))
        u = j["data"]["user"]
        return {"seguidores": u["edge_followed_by"]["count"], "publicaciones": u["edge_owner_to_timeline_media"]["count"]}
    except Exception:
        pass
    for ua in ("facebookexternalhit/1.1", "Googlebot/2.1 (+http://www.google.com/bot.html)", UA):
        try:
            h = web(f"https://www.instagram.com/{usuario}/", {"User-Agent": ua})
            m = re.search(r'content="([\d.,KkMm]+)\s*Followers?[^"]*?([\d.,KkMm]+)\s*Posts?', h)
            if m:
                return {"seguidores": numero(m.group(1)), "publicaciones": numero(m.group(2))}
        except Exception:
            continue
    return None


def completar_redes(redes, p):
    """Lo que el PC no haya conseguido leer lo intenta también GitHub desde sus servidores."""
    redes = dict(redes)
    for clave, fn in (("youtube", lambda: youtube(p["youtube"])), ("youtube_pt", lambda: youtube(p["youtube_pt"])),
                      ("tiktok", lambda: tiktok(p["tiktok"])), ("instagram", lambda: instagram(p["instagram"]))):
        if not p.get(clave):
            continue
        try:
            v = fn()
            print(" ", clave, v)
            if v not in (None, {}):
                redes[clave] = v
        except Exception as e:
            print(" ", clave, "error", str(e)[:120])
    for k, v in p.get("manual", {}).items():  # cifras escritas a mano en canales.json si una red no deja leerlas
        if redes.get(k) in (None, {}):
            redes[k] = v
    return redes


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
        try:  # lo último conocido, por si esta vez alguna red falla
            previas = json.loads(Path(f"data/{p['slug']}.json").read_text(encoding="utf-8")).get("redes", {})
        except Exception:
            previas = {}
        salida["redes"] = completar_redes({**previas, **salida["redes"]}, p)
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
