# Torre Flami

App de la Torre de control de **Fuera del Mapa**: la oficina de los agentes (guionista, fábrica, publicador y analista) con las cifras del canal.

- La web se publica con GitHub Pages y se instala en el móvil (también como APK con PWABuilder).
- `scripts/datos.py` y el workflow `Actualizar datos` leen cada 10 minutos las estadísticas públicas que escribe el PC en Drive y guardan `data/app.json`.
