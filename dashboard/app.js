
// Configuration
const REFRESH_INTERVAL = 5000; // 5 seconds
// Note: When hosted on GitHub Pages or served from root, these paths are relative to dashboard/index.html
// If dashboard is at root/dashboard/, then root is ../
const LOG_URL = '../SESSION_LOG.md';
const STATUS_URL = '../CURRENT_STATE.md';

let lastLogText = '';
let lastStatusText = '';

// Mobile Menu Toggle
function togglePanel() {
    const panel = document.getElementById('status-panel');
    panel.classList.toggle('active');
}

// Fetch and Render Data
async function fetchData() {
    try {
        // 1. Fetch Status
        const statusRes = await fetch(STATUS_URL + '?t=' + Date.now()); // Prevent caching
        if (statusRes.ok) {
            const statusText = await statusRes.text();
            if (statusText !== lastStatusText) {
                document.getElementById('status-content').innerHTML = marked.parse(statusText);
                lastStatusText = statusText;
            }
        }

        // 2. Fetch Log
        const logRes = await fetch(LOG_URL + '?t=' + Date.now());
        if (logRes.ok) {
            const logText = await logRes.text();
            if (logText !== lastLogText) {
                // Determine if we should scroll to bottom (only if already near bottom)
                const logDiv = document.getElementById('log-content');
                const isAtBottom = logDiv.scrollHeight - logDiv.scrollTop <= logDiv.clientHeight + 100;

                document.getElementById('log-content').innerHTML = marked.parse(logText);
                lastLogText = logText;

                // Auto-scroll on initial load or if user was at bottom
                if (isAtBottom || lastLogText === '') {
                    window.setTimeout(() => {
                        logDiv.scrollTop = logDiv.scrollHeight;
                    }, 100);
                }
            }
        }
    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

// Initial Load & Interval
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setInterval(fetchData, REFRESH_INTERVAL);
});
