/**
 * Video Multitool - Globale Frontend-Konfiguration
 * 
 * Diese Datei wird statisch geladen. Die API_BASE_URL kann hier standardmäßig definiert werden.
 * Nutzer können die URL zusätzlich in den App-Einstellungen anpassen (wird im localStorage gespeichert).
 */
window.APP_CONFIG = {
    // Standard-Backend-URL (z. B. lokaler Dev-Server oder deine private Server-IP/Domain)
    // Beispiel: "http://192.168.178.50:8000" oder "https://api.mein-server.de"
    API_BASE_URL: "http://localhost:8000",
    
    // Versionsnummer der App
    APP_VERSION: "1.0.0",
    
    // Maximale Dateianzahl im Verlauf
    MAX_HISTORY_ITEMS: 50,
    
    // Polling-Intervall in ms für Download-Fortschritt
    POLL_INTERVAL_MS: 800
};
