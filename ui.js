/**
 * Video Multitool - UI Helpers & Platform Detection
 */
const UI = {
    // Erkennt Plattform anhand der URL schon vor der Backend-Anfrage
    detectPlatform(url) {
        if (!url || typeof url !== "string") return null;
        const u = url.trim().toLowerCase();

        if (u.includes("youtube.com") || u.includes("youtu.be")) {
            return { name: "YouTube", icon: "▶️", color: "#FF0000" };
        }
        if (u.includes("tiktok.com")) {
            return { name: "TikTok", icon: "🎵", color: "#00F2FE" };
        }
        if (u.includes("instagram.com")) {
            return { name: "Instagram", icon: "📸", color: "#E1306C" };
        }
        if (u.includes("twitter.com") || u.includes("x.com")) {
            return { name: "X (Twitter)", icon: "✖️", color: "#FFFFFF" };
        }
        if (u.includes("reddit.com")) {
            return { name: "Reddit", icon: "🤖", color: "#FF4500" };
        }
        if (u.includes("vimeo.com")) {
            return { name: "Vimeo", icon: "🎬", color: "#1AB7EA" };
        }
        if (u.includes("facebook.com") || u.includes("fb.watch")) {
            return { name: "Facebook", icon: "👥", color: "#1877F2" };
        }
        if (u.includes("twitch.tv")) {
            return { name: "Twitch", icon: "🎮", color: "#9146FF" };
        }
        if (u.includes("soundcloud.com")) {
            return { name: "SoundCloud", icon: "🎧", color: "#FF5500" };
        }
        if (u.match(/\.(mp4|webm|mkv|mov|avi|mp3|m4a|wav)(\?|$)/i)) {
            return { name: "Direkt-Video", icon: "🔗", color: "#10B981" };
        }
        if (u.startsWith("http://") || u.startsWith("https://")) {
            return { name: "Web-Video", icon: "🌐", color: "#6366F1" };
        }
        return null;
    },

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    },

    formatDate(isoString) {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (e) {
            return "";
        }
    },

    showToast(message, type = "info", duration = 4000) {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        if (type === "error") icon = "⚠️";

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Animation auslösen
        setTimeout(() => toast.classList.add("visible"), 10);

        setTimeout(() => {
            toast.classList.remove("visible");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    setTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
    }
};

window.UI = UI;
