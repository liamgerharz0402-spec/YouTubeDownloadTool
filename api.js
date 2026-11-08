/**
 * Video Multitool - API Client
 * Schnittstelle zwischen Frontend und Backend-Server mit Mixed-Content & Netzwerk-Diagnose.
 */
const Api = {
    getBaseUrl() {
        return window.Storage.getApiUrl();
    },

    // Prüft, ob Frontend über HTTPS läuft, aber das Backend über HTTP angesprochen wird
    checkMixedContent(url) {
        if (!url) return false;
        return window.location.protocol === "https:" && url.toLowerCase().startsWith("http:");
    },

    async checkHealth(targetUrl = null) {
        const baseUrl = (targetUrl || this.getBaseUrl() || "").replace(/\/+$/, "");
        if (!baseUrl) {
            throw new Error("Keine Server-URL konfiguriert.");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
            const start = performance.now();
            const res = await fetch(`${baseUrl}/api/health`, {
                method: "GET",
                signal: controller.signal,
                headers: { "Accept": "application/json" }
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`Server antwortete mit HTTP-Status ${res.status}`);
            }

            const data = await res.json();
            const latency = Math.round(performance.now() - start);
            return { ok: true, latency, data, testedUrl: baseUrl };
        } catch (err) {
            clearTimeout(timeoutId);
            let msg = err.message || "Netzwerkfehler / Server nicht erreichbar.";
            
            if (err.name === "AbortError") {
                msg = `Zeitüberschreitung: Server unter ${baseUrl} antwortet nicht (Timeout nach 6s).`;
            } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || err.name === "TypeError") {
                if (this.checkMixedContent(baseUrl)) {
                    msg = `Browser blockiert HTTP von HTTPS (Mixed Content):\n` +
                          `Da diese Seite auf Netlify über HTTPS läuft, sperrt dein Browser Anfragen an ${baseUrl}.\n\n` +
                          `Lösung A (Empfohlen): Öffne die App im WLAN lokal per HTTP (z. B. http://192.168.178.20:3000 mit start_app.bat).\n` +
                          `Lösung B: Nutze eine HTTPS-Adresse für dein Backend (z. B. via ngrok oder Cloudflare).`;
                } else {
                    msg = `Download-Server unter ${baseUrl} nicht erreichbar.\n` +
                          `• Läuft das Backend auf deinem PC? (start_app.bat starten)\n` +
                          `• Auf dem iPad? Trage die PC-WLAN-IP (z. B. http://192.168.178.20:8000) statt localhost ein.`;
                }
            }
            window.Storage.addDebugLog("Health-Check fehlgeschlagen", msg);
            throw new Error(msg);
        }
    },

    async analyze(url) {
        const baseUrl = this.getBaseUrl();
        if (!baseUrl) {
            throw new Error("Kein API-Server konfiguriert. Bitte öffne die Einstellungen.");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000);

        try {
            const res = await fetch(`${baseUrl}/api/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ url }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                const detail = json.detail || `Server meldet Fehler (${res.status})`;
                window.Storage.addDebugLog("Analyse fehlgeschlagen", detail);
                throw new Error(detail);
            }

            return json;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError") {
                const timeoutMsg = "Die Video-Analyse hat zu lange gedauert. Eventuell ist die Netzwerkverbindung langsam.";
                window.Storage.addDebugLog("Analyse-Timeout", timeoutMsg);
                throw new Error(timeoutMsg);
            }
            if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.name === "TypeError") {
                const connMsg = this.checkMixedContent(baseUrl)
                    ? `Browser blockiert HTTP von HTTPS (${baseUrl}). Nutze die Web-App lokal über WLAN per HTTP oder verwende HTTPS für dein Backend.`
                    : `Download-Server ist nicht erreichbar. Bitte prüfe, ob start_app.bat läuft.`;
                window.Storage.addDebugLog("Netzwerkfehler Analyse", connMsg);
                throw new Error(connMsg);
            }
            throw err;
        }
    },

    async startDownload(params) {
        const baseUrl = this.getBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await fetch(`${baseUrl}/api/download`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(params),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                const detail = json.detail || `Download-Start fehlgeschlagen (${res.status})`;
                window.Storage.addDebugLog("Download-Start Fehler", detail);
                throw new Error(detail);
            }

            return json;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError") {
                throw new Error("Zeitüberschreitung beim Starten des Download-Jobs.");
            }
            if (err.message.includes("Failed to fetch") || err.name === "TypeError") {
                if (this.checkMixedContent(baseUrl)) {
                    throw new Error(`Browser blockiert HTTP von HTTPS (${baseUrl}).`);
                }
            }
            throw err;
        }
    },

    async getJobStatus(jobId) {
        const baseUrl = this.getBaseUrl();
        try {
            const res = await fetch(`${baseUrl}/api/download/${jobId}`, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error("Download-Job existiert nicht mehr oder ist abgelaufen.");
                }
                throw new Error(`Fehler beim Abrufen des Job-Status (${res.status})`);
            }

            return await res.json();
        } catch (err) {
            window.Storage.addDebugLog(`Job-Status-Fehler (${jobId})`, err.message);
            throw err;
        }
    },

    getFileDownloadUrl(jobId) {
        const baseUrl = this.getBaseUrl();
        return `${baseUrl}/api/download/${jobId}/file`;
    },

    async deleteJob(jobId) {
        const baseUrl = this.getBaseUrl();
        try {
            await fetch(`${baseUrl}/api/download/${jobId}`, {
                method: "DELETE"
            });
        } catch (e) {
            // silent catch
        }
    }
};

window.Api = Api;
