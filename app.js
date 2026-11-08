/**
 * Video Multitool - Main App Logic
 */
document.addEventListener("DOMContentLoaded", () => {
    // State
    const state = {
        currentTab: "start",
        analysisData: null,
        activeJobId: null,
        pollInterval: null,
        selectedMode: "video", // "video" oder "audio"
        lastCompletedJob: null
    };

    // DOM Elements - Navigation & Status
    const navButtons = document.querySelectorAll(".nav-btn");
    const tabViews = document.querySelectorAll(".tab-view");
    const statusIndicator = document.getElementById("server-status-pill");
    const statusText = document.getElementById("server-status-text");
    const offlineWarningBanner = document.getElementById("offline-warning-banner");
    const openSettingsBtn = document.getElementById("banner-open-settings-btn");
    const retryConnectBtn = document.getElementById("banner-retry-btn");

    // DOM Elements - Tab 1: Start
    const urlInput = document.getElementById("video-url-input");
    const btnPaste = document.getElementById("btn-paste");
    const btnClearUrl = document.getElementById("btn-clear-url");
    const btnAnalyze = document.getElementById("btn-analyze");
    const platformBadge = document.getElementById("platform-badge");
    const dropZone = document.getElementById("drop-zone");

    // Video Card
    const videoCard = document.getElementById("video-card");
    const videoThumbnail = document.getElementById("video-thumbnail");
    const videoDuration = document.getElementById("video-duration");
    const videoTitle = document.getElementById("video-title");
    const videoUploader = document.getElementById("video-uploader");
    const videoPlatform = document.getElementById("video-platform-name");

    // Format Controls
    const modeTabs = document.querySelectorAll(".mode-tab");
    const videoOptionsGroup = document.getElementById("video-options-group");
    const audioOptionsGroup = document.getElementById("audio-options-group");
    const selectVideoRes = document.getElementById("select-video-resolution");
    const selectVideoContainer = document.getElementById("select-video-container");
    const selectAudioFormat = document.getElementById("select-audio-format");
    const selectAudioBitrate = document.getElementById("select-audio-bitrate");
    const btnStartDownload = document.getElementById("btn-start-download");

    // Progress Card
    const progressCard = document.getElementById("progress-card");
    const progressPhase = document.getElementById("progress-phase");
    const progressBar = document.getElementById("progress-bar-fill");
    const progressPercent = document.getElementById("progress-percent");
    const progressSpeed = document.getElementById("progress-speed");
    const progressEta = document.getElementById("progress-eta");
    const btnCancelDownload = document.getElementById("btn-cancel-download");

    // Completed Card
    const completedCard = document.getElementById("completed-card");
    const completedFilename = document.getElementById("completed-filename");
    const completedSize = document.getElementById("completed-size");
    const btnDownloadFile = document.getElementById("btn-download-file");
    const btnShareFile = document.getElementById("btn-share-file");
    const btnResetView = document.getElementById("btn-reset-view");

    // DOM Elements - Tab 2: Downloads
    const historyList = document.getElementById("history-list");
    const historyEmpty = document.getElementById("history-empty");
    const btnClearHistory = document.getElementById("btn-clear-history");

    // DOM Elements - Tab 3: Einstellungen
    const inputApiUrl = document.getElementById("settings-api-url");
    const btnTestConnection = document.getElementById("btn-test-connection");
    const testResultEl = document.getElementById("connection-test-result");
    const btnResetApiUrl = document.getElementById("btn-reset-api-url");
    const selectTheme = document.getElementById("settings-theme");
    const selectDefaultMode = document.getElementById("settings-default-mode");
    const selectDefaultQuality = document.getElementById("settings-default-quality");
    const toggleSaveHistory = document.getElementById("settings-save-history");
    const toggleAutoDownload = document.getElementById("settings-auto-download");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const debugLogsEl = document.getElementById("debug-logs-container");
    const btnClearLogs = document.getElementById("btn-clear-logs");

    // --- Init App Settings & Theme ---
    function initSettings() {
        const settings = window.Storage.getSettings();
        window.UI.setTheme(settings.theme || "dark");

        if (inputApiUrl) inputApiUrl.value = settings.apiUrl;
        if (selectTheme) selectTheme.value = settings.theme || "dark";
        if (selectDefaultMode) selectDefaultMode.value = settings.defaultMode || "video";
        if (selectDefaultQuality) selectDefaultQuality.value = settings.defaultVideoQuality || "1080p";
        if (toggleSaveHistory) toggleSaveHistory.checked = !!settings.saveHistory;
        if (toggleAutoDownload) toggleAutoDownload.checked = !!settings.autoDownload;

        state.selectedMode = settings.defaultMode || "video";
        updateModeUI();
    }

    // --- Tab Navigation ---
    function switchTab(tabId) {
        state.currentTab = tabId;
        navButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabId);
        });
        tabViews.forEach(view => {
            view.classList.toggle("active", view.id === `tab-${tabId}`);
        });

        if (tabId === "history") {
            renderHistory();
        } else if (tabId === "settings") {
            renderDebugLogs();
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    if (openSettingsBtn) {
        openSettingsBtn.addEventListener("click", () => switchTab("settings"));
    }

    // --- Server Health & Status Check ---
    async function checkServerStatus(quiet = false) {
        let currentUrl = window.Storage.getApiUrl();
        try {
            const res = await window.Api.checkHealth(currentUrl);
            if (statusIndicator) {
                statusIndicator.className = "status-pill status-online";
                statusText.textContent = "Verbunden";
                statusIndicator.title = `API v${res.data.version} | Latenz: ${res.latency}ms | FFmpeg: ${res.data.ffmpeg_installed ? 'Ja' : 'Nein'}`;
            }
            if (offlineWarningBanner) offlineWarningBanner.classList.add("hidden");
            if (!quiet) {
                window.UI.showToast(`Server verbunden (${res.latency}ms)`, "success", 2000);
            }
            return true;
        } catch (err) {
            // Falls localhost:8000 fehlschlägt, versuche automatisch 127.0.0.1:8000
            if (currentUrl.includes("localhost:8000")) {
                const fallbackUrl = currentUrl.replace("localhost:8000", "127.0.0.1:8000");
                try {
                    const fallbackRes = await window.Api.checkHealth(fallbackUrl);
                    const s = window.Storage.getSettings();
                    s.apiUrl = fallbackUrl;
                    window.Storage.saveSettings(s);
                    if (inputApiUrl) inputApiUrl.value = fallbackUrl;
                    if (statusIndicator) {
                        statusIndicator.className = "status-pill status-online";
                        statusText.textContent = "Verbunden";
                        statusIndicator.title = `API v${fallbackRes.data.version} | Latenz: ${fallbackRes.latency}ms`;
                    }
                    if (offlineWarningBanner) offlineWarningBanner.classList.add("hidden");
                    if (!quiet) {
                        window.UI.showToast(`Server verbunden über 127.0.0.1 (${fallbackRes.latency}ms)`, "success", 2000);
                    }
                    return true;
                } catch (e2) {
                    // Beide fehlgeschlagen
                }
            }

            if (statusIndicator) {
                statusIndicator.className = "status-pill status-offline";
                statusText.textContent = "Offline";
                statusIndicator.title = err.message;
            }
            if (offlineWarningBanner) {
                offlineWarningBanner.classList.remove("hidden");
                const hintEl = document.getElementById("banner-offline-hint");
                if (hintEl) {
                    if (window.Api.checkMixedContent(currentUrl)) {
                        hintEl.textContent = "⚠️ Browser blockiert unverschlüsseltes HTTP von Netlify (Mixed Content). Starte die App lokal über WLAN oder nutze HTTPS.";
                    } else if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && currentUrl.includes("localhost")) {
                        hintEl.textContent = "⚠️ Auf dem iPad muss die PC-WLAN-IP (z. B. http://192.168.178.20:8000) statt 'localhost' eingetragen sein.";
                    } else {
                        hintEl.textContent = "⚠️ Kein Download-Server erreichbar. Starte start_app.bat oder prüfe die Server-Adresse.";
                    }
                }
            }
            if (!quiet) {
                window.UI.showToast(err.message, "error", 6000);
            }
            return false;
        }
    }

    if (retryConnectBtn) {
        retryConnectBtn.addEventListener("click", () => checkServerStatus(false));
    }
    if (statusIndicator) {
        statusIndicator.style.cursor = "pointer";
        statusIndicator.addEventListener("click", () => checkServerStatus(false));
    }

    // Schnellauswahl Buttons für URLs in den Einstellungen
    document.querySelectorAll(".url-preset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const url = btn.dataset.url;
            if (inputApiUrl) inputApiUrl.value = url;
            const s = window.Storage.getSettings();
            s.apiUrl = url;
            window.Storage.saveSettings(s);
            window.UI.showToast(`URL gesetzt auf: ${url}`, "info", 2000);
            if (btnTestConnection) btnTestConnection.click();
        });
    });

    // --- Live Platform Erkennung ---
    function updatePlatformPreview(url) {
        const detected = window.UI.detectPlatform(url);
        if (detected && url.trim().length > 5) {
            platformBadge.style.display = "inline-flex";
            platformBadge.textContent = `${detected.icon} ${detected.name}`;
            platformBadge.style.borderColor = detected.color;
        } else {
            platformBadge.style.display = "none";
        }
        btnClearUrl.style.display = url ? "inline-flex" : "none";
    }

    urlInput.addEventListener("input", (e) => {
        updatePlatformPreview(e.target.value);
    });

    btnClearUrl.addEventListener("click", () => {
        urlInput.value = "";
        updatePlatformPreview("");
        urlInput.focus();
    });

    // --- Zwischenablage einfügen (iPad & Mobile optimiert) ---
    btnPaste.addEventListener("click", async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text && text.trim().startsWith("http")) {
                    urlInput.value = text.trim();
                    updatePlatformPreview(urlInput.value);
                    window.UI.showToast("Link aus Zwischenablage eingefügt", "info", 2000);
                    // Automatisch analysieren wenn Link eingefügt wird
                    handleAnalyze();
                } else if (text) {
                    urlInput.value = text.trim();
                    updatePlatformPreview(urlInput.value);
                } else {
                    window.UI.showToast("Die Zwischenablage ist leer.", "info");
                }
            } else {
                urlInput.focus();
                window.UI.showToast("Bitte Link manuell einfügen (Tastatur-Shortcut / Halten)", "info");
            }
        } catch (err) {
            urlInput.focus();
            window.UI.showToast("Zwischenablage nicht freigegeben. Bitte manuell einfügen.", "info");
        }
    });

    // --- Drag & Drop (Desktop) ---
    if (dropZone) {
        ["dragenter", "dragover"].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add("drag-active");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove("drag-active");
            }, false);
        });

        dropZone.addEventListener("drop", (e) => {
            const text = e.dataTransfer.getData("text/plain");
            if (text && text.trim().startsWith("http")) {
                urlInput.value = text.trim();
                updatePlatformPreview(urlInput.value);
                handleAnalyze();
            } else {
                window.UI.showToast("Kein gültiger Video-Link gedroppt.", "error");
            }
        });
    }

    // --- Modus Switcher (Video vs. Nur Audio) ---
    function updateModeUI() {
        modeTabs.forEach(tab => {
            tab.classList.toggle("active", tab.dataset.mode === state.selectedMode);
        });

        if (state.selectedMode === "video") {
            videoOptionsGroup.classList.remove("hidden");
            audioOptionsGroup.classList.add("hidden");
        } else {
            videoOptionsGroup.classList.add("hidden");
            audioOptionsGroup.classList.remove("hidden");
        }
    }

    modeTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            state.selectedMode = tab.dataset.mode;
            updateModeUI();
        });
    });

    // --- Video analysieren ---
    async function handleAnalyze() {
        const url = urlInput.value.trim();
        if (!url) {
            window.UI.showToast("Bitte gib zuerst einen Video-Link ein.", "error");
            urlInput.focus();
            return;
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            window.UI.showToast("Ungültiger Link. URL muss mit http:// oder https:// beginnen.", "error");
            return;
        }

        // UI Reset
        videoCard.classList.add("hidden");
        progressCard.classList.add("hidden");
        completedCard.classList.add("hidden");
        btnAnalyze.disabled = true;
        btnAnalyze.innerHTML = `<span class="spinner"></span> Analysiere...`;

        try {
            const data = await window.Api.analyze(url);
            state.analysisData = data;

            // Video-Informationen befüllen
            videoTitle.textContent = data.title || "Unbekannter Titel";
            videoTitle.title = data.title;
            videoUploader.textContent = data.uploader || "";
            videoPlatform.textContent = data.platform || "Web";
            
            if (data.thumbnail) {
                videoThumbnail.src = data.thumbnail;
                videoThumbnail.classList.remove("hidden");
            } else {
                videoThumbnail.classList.add("hidden");
            }

            if (data.duration_formatted) {
                videoDuration.textContent = data.duration_formatted;
                videoDuration.classList.remove("hidden");
            } else {
                videoDuration.classList.add("hidden");
            }

            // Auflösungen befüllen
            selectVideoRes.innerHTML = "";
            (data.video_resolutions || []).forEach(res => {
                const opt = document.createElement("option");
                opt.value = res.id;
                opt.textContent = res.label;
                selectVideoRes.appendChild(opt);
            });

            // Standard-Qualität bevorzugen wenn verfügbar
            const settings = window.Storage.getSettings();
            if (settings.defaultVideoQuality) {
                const match = Array.from(selectVideoRes.options).find(o => o.value.includes(settings.defaultVideoQuality));
                if (match) selectVideoRes.value = match.value;
            }

            // Audio-Bitraten befüllen
            selectAudioBitrate.innerHTML = "";
            (data.audio_bitrates || []).forEach(b => {
                const opt = document.createElement("option");
                opt.value = b.id;
                opt.textContent = b.label;
                selectAudioBitrate.appendChild(opt);
            });
            if (settings.defaultAudioBitrate) {
                selectAudioBitrate.value = settings.defaultAudioBitrate;
            }

            videoCard.classList.remove("hidden");
            videoCard.scrollIntoView({ behavior: "smooth", block: "nearest" });

            // Auto-Download Feature falls aktiviert
            if (settings.autoDownload) {
                handleStartDownload();
            }

        } catch (err) {
            window.UI.showToast(err.message, "error", 6000);
        } finally {
            btnAnalyze.disabled = false;
            btnAnalyze.innerHTML = `Analysieren`;
        }
    }

    btnAnalyze.addEventListener("click", handleAnalyze);
    urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAnalyze();
    });

    // --- Download-Prozess ---
    async function handleStartDownload() {
        if (!state.analysisData) return;

        const isAudio = state.selectedMode === "audio";
        const format = isAudio ? selectAudioFormat.value : selectVideoContainer.value;
        const quality = isAudio ? selectAudioBitrate.value : selectVideoRes.value;

        btnStartDownload.disabled = true;
        btnStartDownload.innerHTML = `<span class="spinner"></span> Starte...`;

        try {
            const res = await window.Api.startDownload({
                url: state.analysisData.url,
                format: format,
                quality: quality,
                audio_only: isAudio
            });

            state.activeJobId = res.job_id;
            
            // Progress UI aktivieren
            videoCard.classList.add("hidden");
            progressCard.classList.remove("hidden");
            progressBar.style.width = "0%";
            progressPercent.textContent = "0 %";
            progressPhase.textContent = "In Warteschlange...";
            progressSpeed.textContent = "";
            progressEta.textContent = "";

            // Starte Polling
            startPolling(res.job_id, {
                title: state.analysisData.title,
                url: state.analysisData.url,
                platform: state.analysisData.platform,
                thumbnail: state.analysisData.thumbnail,
                format: format.toUpperCase(),
                quality: quality,
                isAudio: isAudio
            });

        } catch (err) {
            window.UI.showToast(err.message, "error");
            btnStartDownload.disabled = false;
            btnStartDownload.innerHTML = `Download starten`;
        }
    }

    btnStartDownload.addEventListener("click", handleStartDownload);

    // --- Polling für Download-Fortschritt ---
    function startPolling(jobId, meta) {
        if (state.pollInterval) clearInterval(state.pollInterval);

        const pollMs = (window.APP_CONFIG && window.APP_CONFIG.POLL_INTERVAL_MS) || 800;

        state.pollInterval = setInterval(async () => {
            try {
                const job = await window.Api.getJobStatus(jobId);

                // UI aktualisieren
                const pct = Math.min(Math.max(job.progress || 0, 0), 100);
                progressBar.style.width = `${pct}%`;
                progressPercent.textContent = `${Math.round(pct)} %`;
                progressPhase.textContent = job.phase || "Wird verarbeitet...";
                progressSpeed.textContent = job.speed_str ? `⚡ ${job.speed_str}` : "";
                progressEta.textContent = job.eta_str ? `⏱️ ${job.eta_str}` : "";

                // Status prüfen
                if (job.status === "completed") {
                    clearInterval(state.pollInterval);
                    state.pollInterval = null;
                    onJobCompleted(jobId, job, meta);
                } else if (job.status === "failed") {
                    clearInterval(state.pollInterval);
                    state.pollInterval = null;
                    onJobFailed(job.error || "Download ist fehlgeschlagen.");
                }
            } catch (err) {
                clearInterval(state.pollInterval);
                state.pollInterval = null;
                onJobFailed("Verbindung zum Download-Server verloren.");
            }
        }, pollMs);
    }

    function onJobCompleted(jobId, job, meta) {
        progressCard.classList.add("hidden");
        completedCard.classList.remove("hidden");

        const filename = job.filename || `${meta.title}.${meta.format.toLowerCase()}`;
        completedFilename.textContent = filename;
        completedSize.textContent = job.file_size ? window.UI.formatBytes(job.file_size) : "";

        const downloadUrl = window.Api.getFileDownloadUrl(jobId);

        // Download Button konfigurieren
        btnDownloadFile.onclick = () => {
            triggerFileDownload(downloadUrl, filename);
        };

        // Teilen-Button für iPad / iOS Safari
        btnShareFile.onclick = async () => {
            await handleShare(downloadUrl, filename);
        };

        // Im Verlauf speichern
        window.Storage.addToHistory({
            ...meta,
            fileSize: job.file_size
        });

        state.lastCompletedJob = { jobId, filename, url: downloadUrl };
        window.UI.showToast("Download bereit!", "success");
    }

    function onJobFailed(errorMsg) {
        progressCard.classList.add("hidden");
        videoCard.classList.remove("hidden");
        btnStartDownload.disabled = false;
        btnStartDownload.innerHTML = `Download starten`;
        window.UI.showToast(errorMsg, "error", 6000);
    }

    // Abbrechen
    btnCancelDownload.addEventListener("click", async () => {
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
            state.pollInterval = null;
        }
        if (state.activeJobId) {
            await window.Api.deleteJob(state.activeJobId);
            state.activeJobId = null;
        }
        progressCard.classList.add("hidden");
        videoCard.classList.remove("hidden");
        btnStartDownload.disabled = false;
        btnStartDownload.innerHTML = `Download starten`;
        window.UI.showToast("Download abgebrochen.", "info");
    });

    // --- Datei-Download auslösen (Safari & Desktop kompatibel) ---
    function triggerFileDownload(url, filename) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.target = "_blank"; // Für iPad Safari Dateidownload
        document.body.appendChild(link);
        link.click();
        setTimeout(() => link.remove(), 200);
        window.UI.showToast("Download im Browser gestartet", "info", 3000);
    }

    // --- Web Share API (iPad Safari "In Dateien sichern" / Teilen) ---
    async function handleShare(fileUrl, filename) {
        if (navigator.share) {
            try {
                // Versuche zuerst die Datei zu teilen wenn möglich, ansonsten den Link
                await navigator.share({
                    title: filename,
                    text: `Video: ${filename}`,
                    url: fileUrl
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    triggerFileDownload(fileUrl, filename);
                }
            }
        } else {
            // Fallback auf normalen Download
            triggerFileDownload(fileUrl, filename);
        }
    }

    // Weiteres Video
    btnResetView.addEventListener("click", () => {
        completedCard.classList.add("hidden");
        videoCard.classList.add("hidden");
        urlInput.value = "";
        updatePlatformPreview("");
        btnStartDownload.disabled = false;
        btnStartDownload.innerHTML = `Download starten`;
        urlInput.focus();
    });

    // --- Tab 2: Download-Verlauf ---
    function renderHistory() {
        const history = window.Storage.getHistory();
        historyList.innerHTML = "";

        if (!history || history.length === 0) {
            historyEmpty.classList.remove("hidden");
            btnClearHistory.style.display = "none";
            return;
        }

        historyEmpty.classList.add("hidden");
        btnClearHistory.style.display = "inline-flex";

        history.forEach(item => {
            const card = document.createElement("div");
            card.className = "history-item";

            const thumbHtml = item.thumbnail 
                ? `<img src="${window.UI.escapeHtml(item.thumbnail)}" class="history-thumb" alt="Thumb" loading="lazy">` 
                : `<div class="history-thumb-placeholder">${item.isAudio ? '🎵' : '🎬'}</div>`;

            card.innerHTML = `
                ${thumbHtml}
                <div class="history-info">
                    <h4 class="history-title" title="${window.UI.escapeHtml(item.title)}">${window.UI.escapeHtml(item.title)}</h4>
                    <div class="history-meta">
                        <span class="badge-tag">${window.UI.escapeHtml(item.platform)}</span>
                        <span class="badge-tag">${window.UI.escapeHtml(item.format)} • ${window.UI.escapeHtml(item.quality)}</span>
                        <span class="history-date">${window.UI.formatDate(item.timestamp)}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-secondary btn-sm btn-reanalyze" title="Erneut analysieren">
                        🔄 Neu
                    </button>
                    <button class="btn btn-icon btn-sm btn-delete-history" title="Aus Verlauf entfernen">
                        🗑️
                    </button>
                </div>
            `;

            // Neu analysieren Button
            card.querySelector(".btn-reanalyze").addEventListener("click", () => {
                switchTab("start");
                urlInput.value = item.url;
                updatePlatformPreview(item.url);
                handleAnalyze();
            });

            // Löschen Button
            card.querySelector(".btn-delete-history").addEventListener("click", () => {
                window.Storage.removeFromHistory(item.id);
                renderHistory();
                window.UI.showToast("Eintrag entfernt", "info", 1500);
            });

            historyList.appendChild(card);
        });
    }

    btnClearHistory.addEventListener("click", () => {
        if (confirm("Möchtest du den gesamten Download-Verlauf wirklich löschen?")) {
            window.Storage.clearHistory();
            renderHistory();
            window.UI.showToast("Verlauf geleert.", "info");
        }
    });

    // --- Tab 3: Einstellungen ---
    btnTestConnection.addEventListener("click", async () => {
        testResultEl.className = "test-result";
        testResultEl.innerHTML = `<span class="spinner"></span> Prüfe Verbindung zu ${inputApiUrl.value}...`;
        testResultEl.classList.remove("hidden");

        // Temporär für Test speichern
        const tempSettings = window.Storage.getSettings();
        tempSettings.apiUrl = inputApiUrl.value.trim();
        window.Storage.saveSettings(tempSettings);

        try {
            const res = await window.Api.checkHealth();
            testResultEl.className = "test-result success";
            testResultEl.innerHTML = `
                ✅ <strong>API erreichbar!</strong> (Antwortzeit: ${res.latency}ms)<br>
                • Version: ${res.data.version}<br>
                • yt-dlp: ${res.data.ytdlp_version}<br>
                • FFmpeg: ${res.data.ffmpeg_installed ? 'Installiert (bereit für Konvertierungen)' : '⚠️ Nicht gefunden'}
            `;
            checkServerStatus(true);
        } catch (err) {
            testResultEl.className = "test-result error";
            testResultEl.innerHTML = `❌ <strong>API nicht erreichbar:</strong> ${window.UI.escapeHtml(err.message)}`;
            checkServerStatus(true);
        }
    });

    btnResetApiUrl.addEventListener("click", () => {
        const defaultUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8000";
        inputApiUrl.value = defaultUrl;
        window.UI.showToast("Standard-URL wiederhergestellt.", "info");
    });

    selectTheme.addEventListener("change", (e) => {
        window.UI.setTheme(e.target.value);
    });

    btnSaveSettings.addEventListener("click", () => {
        const newSettings = {
            ...window.Storage.getSettings(),
            apiUrl: inputApiUrl.value.trim().replace(/\/+$/, ""),
            theme: selectTheme.value,
            defaultMode: selectDefaultMode.value,
            defaultVideoQuality: selectDefaultQuality.value,
            saveHistory: toggleSaveHistory.checked,
            autoDownload: toggleAutoDownload.checked
        };

        window.Storage.saveSettings(newSettings);
        window.UI.setTheme(newSettings.theme);
        window.UI.showToast("Einstellungen erfolgreich gespeichert!", "success");
        checkServerStatus(true);
    });

    function renderDebugLogs() {
        if (!debugLogsEl) return;
        const logs = window.Storage.getDebugLogs();
        if (logs.length === 0) {
            debugLogsEl.innerHTML = `<div class="empty-hint">Keine Fehler oder Warnungen protokolliert.</div>`;
            return;
        }

        debugLogsEl.innerHTML = logs.map(l => `
            <div class="log-entry">
                <span class="log-time">${l.time}</span>
                <span class="log-msg">${window.UI.escapeHtml(l.message)}</span>
                ${l.details ? `<pre class="log-details">${window.UI.escapeHtml(typeof l.details === 'object' ? JSON.stringify(l.details, null, 2) : l.details)}</pre>` : ''}
            </div>
        `).join("");
    }

    if (btnClearLogs) {
        btnClearLogs.addEventListener("click", () => {
            window.Storage.clearDebugLogs();
            renderDebugLogs();
            window.UI.showToast("Logs gelöscht.", "info");
        });
    }

    // --- Service Worker Registrierung (PWA) ---
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./service-worker.js")
                .then(reg => {
                    console.log("PWA Service Worker erfolgreich registriert:", reg.scope);
                })
                .catch(err => {
                    console.warn("PWA Service Worker Registrierung fehlgeschlagen:", err);
                });
        });
    }

    // Start-Initialisierung
    initSettings();
    checkServerStatus(true);
});
