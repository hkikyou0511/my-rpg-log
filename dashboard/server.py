import http.server
import socketserver
import os

# Configuration
PORT = 8000
# Ensure we serve the parent directory (Project Root) so ../SESSION_LOG.md works
# Current dir is likely dashboard/ or root. We want to serve 'c:/Users/user/Documents/chatAI/RPG'
# But for simplicity, we assume this script is run FROM the root, or we explicitly change dir.

# Set the working directory to the parent of the 'dashboard' folder (i.e., the project root)
# identifying where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir) # Go up one level from 'dashboard'

print(f"Serving RPG Dashboard from: {project_root}")
os.chdir(project_root)

Handler = http.server.SimpleHTTPRequestHandler

# Disable caching to ensure updates are seen immediately
Handler.extensions_map.update({
    ".md": "text/markdown",
})

class NoCacheHandler(Handler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}/dashboard/")
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
