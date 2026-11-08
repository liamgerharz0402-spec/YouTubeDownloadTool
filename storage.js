/**
 * Video Multitool - Storage Management
 * Verwaltet Einstellungen und Download-Verlauf sicher im localStorage.
 */
const Storage = {
    KEYS: {
        SETTINGS: "vmt_settings",
        HISTORY: "vmt_history",
        DEBUG_LOGS: "vmt_debug_logs"
    },

    // Standard-Einstellungen
    getDefaultSettings() {
        const defaultBaseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) 
            ? window.APP_CONFIG.API_BASE_URL 
            : "http://localhost:8000";

        return {
            apiUrl: defaultBaseUrl,
            defaultMode: "video", // "video" oder "audio"
            defaultVideoQuality: "1080p",
            defaultVideoFormat: "mp4",
            defaultAudioFormat: "mp3",
            defaultAudioBitrate: "192k",
            saveHistory: true,
            theme: "dark", // "dark", "oled", "light"
            autoDownload: false
        };
    },

    getSettings() {
        try {
            const raw = localStorage.getItem(this.KEYS.SETTINGS);
            if (!raw) return this.getDefaultSettings();
            return { ...this.getDefaultSettings(), ...JSON.parse(raw) };
        } catch (e) {
            console.error("Fehler beim Lesen der Einstellungen:", e);
            return this.getDefaultSettings();
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error("Fehler beim Speichern der Einstellungen:", e);
            return false;
        }
    },

    getApiUrl() {
        const settings = this.getSettings();
        let url = settings.apiUrl || (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8000";
        // Entferne abschließenden Schrägstrich
        return url.replace(/\/+$/, "");
    },

    // --- Verlauf (History) ---

    getHistory() {
        try {
            const raw = localStorage.getItem(this.KEYS.HISTORY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Fehler beim Laden des Verlaufs:", e);
            return [];
        }
    },

    addToHistory(item) {
        const settings = this.getSettings();
        if (!settings.saveHistory) return;

        try {
            let history = this.getHistory();
            // Vermeide Duplikate mit gleicher URL und gleichem Format ganz oben
            history = history.filter(h => !(h.url === item.url && h.format === item.format && h.quality === item.quality));
            
            const historyEntry = {
                id: Date.now().toString(),
                title: item.title || "Unbekanntes Video",
                url: item.url,
                platform: item.platform || "Web",
                thumbnail: item.thumbnail || "",
                format: item.format,
                quality: item.quality,
                isAudio: !!item.isAudio,
                timestamp: new Date().toISOString(),
                fileSize: item.fileSize || 0
            };

            history.unshift(historyEntry);

            const maxItems = (window.APP_CONFIG && window.APP_CONFIG.MAX_HISTORY_ITEMS) || 50;
            if (history.length > maxItems) {
                history = history.slice(0, maxItems);
            }

            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
            return historyEntry;
        } catch (e) {
            console.error("Fehler beim Hinzufügen zum Verlauf:", e);
        }
    },

    removeFromHistory(id) {
        try {
            let history = this.getHistory();
            history = history.filter(h => h.id !== id);
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
            return history;
        } catch (e) {
            console.error("Fehler beim Löschen des Eintrags:", e);
            return [];
        }
    },

    clearHistory() {
        try {
            localStorage.removeItem(this.KEYS.HISTORY);
            return true;
        } catch (e) {
            console.error("Fehler beim Leeren des Verlaufs:", e);
            return false;
        }
    },

    // --- Debug Logs ---

    addDebugLog(message, details = null) {
        try {
            const raw = localStorage.getItem(this.KEYS.DEBUG_LOGS);
            let logs = raw ? JSON.parse(raw) : [];
            logs.unshift({
                time: new Date().toLocaleTimeString(),
                message,
                details
            });
            if (logs.length > 20) logs = logs.slice(0, 20);
            localStorage.setItem(this.KEYS.DEBUG_LOGS, JSON.stringify(logs));
        } catch (e) {
            // ignore
        }
    },

    getDebugLogs() {
        try {
            const raw = localStorage.getItem(this.KEYS.DEBUG_LOGS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    clearDebugLogs() {
        localStorage.removeItem(this.KEYS.DEBUG_LOGS);
    }
};

window.Storage = Storage;
