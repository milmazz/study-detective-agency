#!/usr/bin/env python3
"""
Local dev server that mimics Cloudflare's clean-URL asset resolution
(html_handling: "auto-trailing-slash" in wrangler.jsonc), since plain
`python3 -m http.server` only serves exact file paths and 404s on the
extension-less URLs this site actually links (e.g. /games/math/foo).

  /                       -> index.html
  /games/math/foo         -> serves games/math/foo.html directly (200)
  /games/math/foo.html    -> 307 redirect to /games/math/foo, matching
                             production's own canonicalization
  /index.html             -> 307 redirect to /

Responses are sent with no-cache headers — unlike production's
_headers file, local dev should always show your latest edit, not
whatever cache duration Cloudflare would apply.

Usage: python3 scripts/dev-server.py [port]   (default port 8000)
"""
import http.server
import os
import sys
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


def load_assetsignore():
    """Same file Cloudflare reads to decide what NOT to deploy/serve —
    read it here too so local dev 404s on the same paths production does
    (repo/tooling files like .git, README.md, wrangler.jsonc)."""
    patterns = []
    path = os.path.join(ROOT, '.assetsignore')
    if os.path.isfile(path):
        with open(path) as f:
            for line in f:
                line = line.strip().strip('/')
                if line and not line.startswith('#'):
                    patterns.append(line)
    return patterns


IGNORED = load_assetsignore()


def is_ignored(path):
    parts = path.lstrip('/').split('/')
    return any('/'.join(parts[:i]) in IGNORED for i in range(1, len(parts) + 1))


class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        parsed = urlsplit(self.path)
        path = parsed.path
        query_suffix = ('?' + parsed.query) if parsed.query else ''

        if is_ignored(path):
            self.send_error(404, "File not found")
            return None

        # Literal .html request -> redirect to the clean URL, same as
        # production. /index.html is a special case: it collapses to /
        # rather than /index.
        if path.endswith('.html'):
            clean = path[:-len('.html')]
            if clean.endswith('/index'):
                clean = clean[:-len('index')]
            self.send_response(307)
            self.send_header('Location', clean + query_suffix)
            self.end_headers()
            return None

        # Clean URL -> serve the matching .html file directly (no
        # redirect), if one exists and nothing already matches literally.
        if path != '/' and not path.endswith('/'):
            literal = self.translate_path(path)
            if not os.path.isfile(literal):
                candidate = self.translate_path(path + '.html')
                if os.path.isfile(candidate):
                    self.path = path + '.html' + query_suffix

        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()


# A browser loads a page's CSS/JS/images as several requests at once
# and cancels others (favicons, aborted navigations); the plain
# single-threaded server in the stdlib serves those serially and
# prints a full traceback for every cancelled one. ThreadingHTTPServer
# handles them concurrently, and handle_error() below silences the
# ones that are just "the browser closed the connection," not a bug.
class DevServer(http.server.ThreadingHTTPServer):
    def handle_error(self, request, client_address):
        exc_type = sys.exc_info()[0]
        if exc_type and issubclass(
            exc_type, (BrokenPipeError, ConnectionResetError, ConnectionAbortedError)
        ):
            return
        super().handle_error(request, client_address)


if __name__ == '__main__':
    with DevServer(('', PORT), CleanUrlHandler) as httpd:
        print(f"Serving {ROOT}")
        print(f"http://localhost:{PORT}/  (clean URLs, no caching)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
