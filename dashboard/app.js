
// Configuration
const REFRESH_INTERVAL = 5000; // 5 seconds
const LOG_URL = '../SESSION_LOG.md';
const STATUS_URL = '../CURRENT_STATE.md';

// Configuration for Characters (Image + File Path)
const CHAR_DATA = {
    'ツツイケンタ': { img: 'protagonist.png', file: '../chara/Protagonist/Protagonist.md' },
    'リム': { img: 'rim.png', file: '../chara/Rim/Rim.md' },
    'アリア': { img: 'knight.png', file: '../chara/Knight/Knight.md' },
    'ゴブリン': { img: 'goblin.png', file: '../chara/Goblin/Goblin.md' },
};

let lastLogText = '';
let lastStatusText = '';
let isViewingCharacter = false; // State to pause auto-refresh
let refreshTimer = null;

// Mobile Menu Toggle
function togglePanel() {
    const panel = document.getElementById('status-panel');
    panel.classList.toggle('active');
}

// Fetch and Render Data
async function fetchData() {
    if (isViewingCharacter) return; // Stop fetching if viewing a character sheet

    try {
        // 1. Fetch Status
        const statusRes = await fetch(STATUS_URL + '?t=' + Date.now());
        if (statusRes.ok) {
            const statusText = await statusRes.text();
            if (statusText !== lastStatusText) {
                document.getElementById('status-content').innerHTML = marked.parse(statusText);
                injectInteractiveLogic(); // Updated Injection Logic
                lastStatusText = statusText;
            }
        }

        // 2. Fetch Log
        const logRes = await fetch(LOG_URL + '?t=' + Date.now());
        if (logRes.ok) {
            const logText = await logRes.text();
            if (logText !== lastLogText) {
                const logDiv = document.getElementById('log-content');
                const isAtBottom = logDiv.scrollHeight - logDiv.scrollTop <= logDiv.clientHeight + 100;

                document.getElementById('log-content').innerHTML = marked.parse(logText);
                lastLogText = logText;

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

// Interactive Logic (Images + Click Handlers)
function injectInteractiveLogic() {
    const statusPanel = document.getElementById('status-content');

    // 1. Party Members (List Items)
    statusPanel.querySelectorAll('li').forEach(li => {
        const text = li.textContent;
        for (const [name, data] of Object.entries(CHAR_DATA)) {
            if (text.includes(name)) {
                // Determine contents
                const imgPath = `assets/chars/${data.img}`;

                // Create Image
                const img = document.createElement('img');
                img.src = imgPath;
                img.className = 'char-icon';
                img.onerror = function () { this.style.display = 'none'; };

                // Create Container
                const content = li.innerHTML;
                li.innerHTML = '';
                li.className = 'char-entry clickable'; // Add clickable class
                li.title = "Click to view details";
                li.onclick = () => showCharacter(name, data.file); // Add Click Handler

                li.appendChild(img);
                const span = document.createElement('span');
                span.innerHTML = content;
                li.appendChild(span);
                break;
            }
        }
    });

    // 2. Protagonist (Table Cells) - Inject Image & Convert Stats to Bars
    const tables = statusPanel.querySelectorAll('table');
    tables.forEach(table => {
        // Check if this is the Protagonist table (contains "ツツイケンタ")
        if (table.textContent.includes('ツツイケンタ')) {
            const rows = table.querySelectorAll('tr');

            // Row 1: Headers (skip)
            // Row 2: Values (Name | Harem | HP | SP)
            if (rows.length >= 2) {
                const cells = rows[1].querySelectorAll('td');

                // Cell 0: Name (Inject Image)
                if (cells[0]) {
                    const data = CHAR_DATA['ツツイケンタ'];
                    const imgPath = `assets/chars/${data.img}`;
                    const img = document.createElement('img');
                    img.src = imgPath;
                    img.className = 'char-icon';
                    img.style.width = '40px'; // Slightly smaller for table
                    img.style.height = '40px';
                    img.onerror = function () { this.style.display = 'none'; };
                    cells[0].insertBefore(img, cells[0].firstChild);
                }

                // Identify Columns by Header (Robustness)
                const headers = rows[0].querySelectorAll('th');
                let hpIndex = -1;
                let spIndex = -1;

                headers.forEach((th, index) => {
                    if (th.textContent.includes('HP')) hpIndex = index;
                    if (th.textContent.includes('SP')) spIndex = index;
                });

                // Apply Bars
                if (hpIndex !== -1 && cells[hpIndex]) convertToBar(cells[hpIndex], 'hp-fill');
                if (spIndex !== -1 && cells[spIndex]) convertToBar(cells[spIndex], 'sp-fill'); // SP gets same style for now, change class if needed
            }
        }
    });
}

// Helper to convert "3 / 3" text into a progress bar
function convertToBar(cell, fillClass) {
    const text = cell.innerText.trim(); // e.g., "**3 / 3**" or "3 / 3"
    // Regex to extract numbers: match num / num
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);

    if (match) {
        const current = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        const percent = (current / max) * 100;

        cell.innerHTML = `
            <span class="stat-text">${current} / ${max}</span>
            <div class="stat-bar-container">
                <div class="stat-bar-fill ${fillClass}" style="width: ${percent}%"></div>
            </div>
        `;
    }
}

// Function to switch view to Character Sheet
async function showCharacter(name, filePath) {
    isViewingCharacter = true; // Pause log updates

    // UI Updates
    document.getElementById('main-title').innerText = `${name} - 詳細データ`;
    document.getElementById('back-btn').style.display = 'inline-block';
    document.getElementById('log-content').innerHTML = '<div class="loading">データを読み込んでいます...</div>';

    // Fetch File
    try {
        const res = await fetch(filePath + '?t=' + Date.now());
        if (res.ok) {
            const text = await res.text();
            document.getElementById('log-content').innerHTML = marked.parse(text);
            document.getElementById('log-content').scrollTop = 0; // consistent scroll to top
        } else {
            document.getElementById('log-content').innerHTML = '<p>データの読み込みに失敗しました。</p>';
        }
    } catch (e) {
        document.getElementById('log-content').innerHTML = `<p>エラーが発生しました: ${e}</p>`;
    }
}

// Function to return to Log View
function showLog() {
    isViewingCharacter = false; // Resume updates

    // UI Updates
    document.getElementById('main-title').innerText = '冒険の記録';
    document.getElementById('back-btn').style.display = 'none';

    // Restore Log immediately
    document.getElementById('log-content').innerHTML = marked.parse(lastLogText);

    // Scroll back to bottom
    const logDiv = document.getElementById('log-content');
    window.setTimeout(() => {
        logDiv.scrollTop = logDiv.scrollHeight;
    }, 50);

    // Force immediate fetch check
    fetchData();
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    refreshTimer = setInterval(fetchData, REFRESH_INTERVAL);
});
