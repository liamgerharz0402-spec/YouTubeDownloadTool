# Video Multitool ⚡

Eine minimalistische, moderne Web-App für persönliche Video-Downloads und Konvertierungen, optimiert für **iPadOS Safari (Homescreen-PWA)** und **Desktop**.

Saubere Trennung von **statischem Frontend** (deploybar auf Netlify) und **Backend-API** (läuft auf deinem privaten PC, Raspberry Pi oder Home-Server mit FFmpeg & yt-dlp).

---

## 📁 Projektstruktur

```text
YouTubeDownloadTool/
├── frontend/                     # Statisches Web-Frontend (Netlify-kompatibel)
│   ├── index.html                # App-Interface & iPad Meta-Tags
│   ├── styles.css                # Dunkles Utility-Theme mit iPad Safe-Areas
│   ├── app.js                    # UI- und Download-Ablaufsteuerung
│   ├── api.js                    # API-Client (Analyse, Polling, Download)
│   ├── ui.js                     # Plattform-Erkennung & Hilfsfunktionen
│   ├── storage.js                # Lokaler Speicher (Einstellungen & Verlauf)
│   ├── config.js                 # Standard-Konfiguration (API_BASE_URL)
│   ├── manifest.webmanifest      # PWA-Manifest für Homescreen
│   ├── service-worker.js         # Offline-App-Shell-Cache
│   └── icons/
│       └── icon.svg              # Vektor-App-Icon
│
├── backend/                      # Python FastAPI Backend
│   ├── server.py                 # API-Server, yt-dlp & FFmpeg Worker
│   ├── requirements.txt          # Python-Abhängigkeiten
│   ├── .env.example              # Umgebungsvariablen-Vorlage
│   ├── start.bat                 # Windows-Startskript
│   ├── start.sh                  # Linux/macOS-Startskript
│   └── README.md                 # Backend-Dokumentation
│
├── netlify.toml                  # Netlify Build- & Security-Header-Konfiguration
└── README.md                     # Hauptanleitung
```

---

## 🚀 Vollständige Schritt-für-Schritt-Anleitung

### 1. Frontend lokal starten
Das Frontend benötigt keine Build-Tools oder Node.js. Du kannst es mit jedem lokalen Webserver öffnen:

**Mit Python:**
```bash
cd frontend
python -m http.server 3000
```
Öffne anschließend `http://localhost:3000` im Browser.

---

### 2. Frontend auf Netlify deployen

Das Frontend ist 100% statisch und funktioniert sofort auf Netlify:

**Option A: Netlify CLI**
```bash
# Im Projekt-Hauptverzeichnis:
netlify deploy --prod
```
(Die im Projekt enthaltene `netlify.toml` setzt automatisch das Verzeichnis `frontend` als Publish-Ordner).

**Option B: Netlify Web-Dashboard (Drag & Drop – direkt diesen Ordner hochladen)**
1. Logge dich auf [app.netlify.com/drop](https://app.netlify.com/drop) ein.
2. Ziehe einfach diesen gesamten Projektordner (`YouTubeDownloadTool`) per Drag & Drop in das Netlify-Upload-Feld.
3. Netlify erkennt `index.html` direkt im Hauptverzeichnis.
4. Deine Site ist in wenigen Sekunden unter einer URL wie `https://meine-app.netlify.app` online!
*(Das `backend/`-Verzeichnis wird durch `_redirects` und `netlify.toml` automatisch vor öffentlichem Webzugriff geschützt).*

---

### 3. Backend installieren

Auf deinem privaten Server, Heim-PC oder Raspberry Pi:

1. Navigiere in das Backend-Verzeichnis:
   ```bash
   cd backend
   ```
2. Installiere die Python-Pakete:
   ```bash
   pip install -r requirements.txt
   ```

---

### 4. FFmpeg installieren

FFmpeg ist notwendig, um Streams zusammenzuführen und Audioformate (MP3, M4A, WAV) mit variablen Bitraten zu kodieren:

- **Windows**:
  - Lade FFmpeg herunter (z. B. via [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)) oder installiere es via Winget:
    ```powershell
    winget install Gyan.FFmpeg
    ```
  - Prüfe in PowerShell mit `ffmpeg -version`, dass es im Pfad liegt.
- **Ubuntu / Debian**:
  ```bash
  sudo apt update && sudo apt install -y ffmpeg
  ```
- **macOS (Homebrew)**:
  ```bash
  brew install ffmpeg
  ```

---

### 5. API konfigurieren

Kopiere im Ordner `backend/` die Vorlage:
```bash
cp .env.example .env
```
Inhalte der `.env`:
```env
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=*
MAX_CONCURRENT_DOWNLOADS=3
FILE_RETENTION_MINUTES=60
ALLOW_PRIVATE_URLS=false
```

---

### 6. CORS konfigurieren

Wenn dein Frontend auf Netlify läuft (z. B. `https://mein-video-tool.netlify.app`), passe im Backend `.env` die erlaubten Origins an:

```env
ALLOWED_ORIGINS=https://mein-video-tool.netlify.app
```
*(Für Tests im Heimnetzwerk kann `ALLOWED_ORIGINS=*` beibehalten werden).*

---

### 7. API-URL im Frontend einstellen

Es gibt zwei einfache Möglichkeiten, ohne Code-Änderungen auf dem iPad zu arbeiten:

- **Möglichkeit A (In der Benutzeroberfläche):**
  1. Öffne die App im Browser auf dem iPad oder Desktop.
  2. Tippe auf den Tab **⚙️ Einstellungen**.
  3. Trage unter **Server-Basis-URL** die IP oder Domain deines Servers ein, z. B.:
     ```text
     http://192.168.178.50:8000
     ```
  4. Tippe auf **„Verbindung testen“** → Bei Erfolg erscheint `API erreichbar!`
  5. Tippe auf **„Einstellungen speichern“**. Die Adresse wird dauerhaft im lokalen Browser-Speicher deines iPads gesichert.

- **Möglichkeit B (In `frontend/config.js` vor dem Netlify-Upload):**
  ```javascript
  window.APP_CONFIG = {
      API_BASE_URL: "http://192.168.178.50:8000"
  };
  ```

---

### 8. Server starten

- **Windows**: Starte einfach die Datei `backend/start.bat` per Doppelklick.
- **Linux / macOS**:
  ```bash
  cd backend
  python3 server.py
  ```
Der Server lauscht auf `http://0.0.0.0:8000`.

---

### 9. iPad mit der App verbinden

1. Stelle sicher, dass iPad und Server sich im selben WLAN-Netzwerk befinden (oder dass dein Server über VPN / WireGuard / Port-Forwarding / Domain erreichbar ist).
2. Öffne **Safari** auf dem iPad.
3. Rufe die URL deiner App auf:
   - Deine Netlify-URL (z. B. `https://mein-video-tool.netlify.app`) oder deine lokale Serveradresse.
4. Prüfe den Status-Punkt oben rechts: Dieser leuchtet grün (`Verbunden`), sobald die API antwortet.

---

### 10. Website zum Homescreen hinzufügen (iPadOS PWA)

1. Tippe in Safari oben rechts auf das **Teilen-Symbol** (Viereck mit Pfeil nach oben).
2. Scrolle nach unten und wähle **„Zum Home-Bildschirm“** (Add to Home Screen).
3. Bestätige mit **Hinzufügen**.
4. Die App erscheint nun mit eigenem App-Icon auf deinem iPad-Homescreen.
5. Beim Antippen öffnet sich die App im **Standalone-Vollbildmodus** ohne störende Safari-Adressleiste.

---

## 📱 Bedienung & Features auf dem iPad

1. **Link einfügen:**
   Kopiere einen Videolink (z. B. aus YouTube, TikTok, Reddit, Instagram). Tippe in der App auf **„📋 Aus Zwischenablage einfügen“** oder füge den Link in das Feld ein.
2. **Plattform-Erkennung:**
   Die App erkennt automatisch das Netzwerk und zeigt das entsprechende Plattform-Badge an.
3. **Analysieren:**
   Tippe auf **„Analysieren“**. Die App lädt Titel, Thumbnail, Dauer und alle tatsächlich verfügbaren Qualitätsstufen.
4. **Format wählen:**
   - **🎬 Video:** Wähle Auflösung (z. B. 1080p, 720p, 4K) und Format (MP4 / WebM).
   - **🎵 Nur Audio:** Wähle Format (MP3, M4A, WAV) und Bitrate (128 bis 320 kbps).
5. **Download & Speichern:**
   Tippe auf **„Download starten“**. Ein Echtzeit-Fortschrittsbalken informiert über Status, Downloadrate und Restzeit.
   Nach Abschluss:
   - **„⬇️ Datei herunterladen“**: Normaler Safari-Download.
   - **„📤 In Dateien sichern / Teilen“**: Öffnet den nativen iOS Teilen-Dialog (AirDrop, „In Dateien sichern“, iCloud Drive etc.).
6. **Verlauf:**
   Alle Downloads werden mit Metadaten im Tab **📜 Verlauf** gesichert. Ein Klick auf **„🔄 Neu“** analysiert ein Video sofort erneut.

---

## 🔒 Sicherheit & Datenschutz

- **Kein Tracking, keine Cookies, keine Werbung.**
- **Keine Cloud-Speicherung**: Der Verlauf verbleibt ausschließlich lokal im Browser (`localStorage`).
- **SSRF-Schutz**: Das Backend sperrt clientseitige Downloads von lokalen/privaten Adressen im URL-Host.
- **Sichere Dateinamen**: Dateinamen werden gegen Path-Traversal und ungültige Zeichen bereinigt.
- **Automatischer Cleanup**: Temporäre Downloads werden serverseitig nach Ablauf von 60 Minuten automatisch gelöscht.
- **Rechtlicher Hinweis:** Die App umgeht keine DRM-, Paywall- oder Authentifizierungsschutzmechanismen. Sie ist für private Nutzung mit zulässigen Inhalten konzipiert.
