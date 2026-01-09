#!/usr/bin/env python3
"""
Simple HTTP server to run the DDP Calculator locally.
Run: python server.py
Then open: http://localhost:8080
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"\n{'='*50}")
        print(f"  DDP Calculator Server Running")
        print(f"{'='*50}")
        print(f"\n  Open in browser: {url}")
        print(f"\n  Press Ctrl+C to stop the server\n")
        print(f"{'='*50}\n")
        
        # Try to open browser automatically
        try:
            webbrowser.open(url)
        except:
            pass
        
        httpd.serve_forever()

if __name__ == "__main__":
    main()
