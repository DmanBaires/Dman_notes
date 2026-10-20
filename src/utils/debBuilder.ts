import JSZip from 'jszip';
import { Note } from '../types/note';

export interface DebianPackageConfig {
  packageName: string;
  version: string;
  architecture: string;
  maintainerName: string;
  maintainerEmail: string;
  description: string;
  longDescription: string;
  homepage: string;
  section: string;
  priority: string;
  depends: string;
}

export const DEFAULT_DEBIAN_CONFIG: DebianPackageConfig = {
  packageName: 'wikinote',
  version: '1.0.0',
  architecture: 'amd64',
  maintainerName: 'Debian Note Maintainer',
  maintainerEmail: 'delcantoster@gmail.com',
  description: 'Standalone Desktop Wiki & Markdown Notepad (Gnote-style)',
  longDescription: ` WikiNote is a standalone desktop personal knowledge base and Markdown
 notepad designed for Debian GNU/Linux. It runs as a native desktop application
 (similar to Gnote and Tomboy) with automatic title-to-hyperlink cross-referencing,
 clipboard image integration, local offline storage, and interactive graphs.`,
  homepage: 'https://github.com/wikinote/wikinote',
  section: 'utils',
  priority: 'optional',
  depends: 'python3, python3-gi, gir1.2-gtk-3.0, gir1.2-webkit2-4.1 | gir1.2-webkit2-4.0 | chromium | google-chrome-stable | electron',
};

export const DEBIAN_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <radialGradient id="debGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#FF2B75" />
      <stop offset="60%" stop-color="#D70A53" />
      <stop offset="100%" stop-color="#8E0032" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="120" height="120" x="4" y="4" rx="26" fill="#1e1e24" stroke="#D70A53" stroke-width="2.5" />
  <!-- Debian iconic spiral swirl -->
  <path d="M64 24 C82 24 96 36 96 52 C96 68 82 78 68 78 C56 78 48 70 48 60 C48 52 54 46 62 46 C68 46 72 50 72 56 C72 60 69 63 65 63 C63 63 61 61 61 59 C61 57 62 56 63 56 C64 56 64.5 56.5 64.5 57 C64.5 57.5 64 58 63.5 58 C63 58 62.5 57.5 62.5 57 C62.5 55 64 53 67 53 C71 53 74 56 74 61 C74 68 67 74 58 74 C47 74 38 64 38 52 C38 36 52 24 68 24 Z" 
        fill="url(#debGrad)" filter="url(#shadow)" />
  <!-- Notepad accent line -->
  <rect x="34" y="88" width="60" height="6" rx="3" fill="#D70A53" opacity="0.9" />
  <rect x="34" y="98" width="40" height="5" rx="2.5" fill="#ffffff" opacity="0.4" />
</svg>`;

export function sanitizePackageName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9+.-]/g, '-').replace(/^[^a-z0-9]+/, '') || 'wikinote';
}

export function generateControlFile(config: DebianPackageConfig): string {
  const pkg = sanitizePackageName(config.packageName);
  return `Package: ${pkg}
Version: ${config.version}
Section: ${config.section}
Priority: ${config.priority}
Architecture: ${config.architecture}
Depends: ${config.depends}
Maintainer: ${config.maintainerName} <${config.maintainerEmail}>
Homepage: ${config.homepage}
Description: ${config.description}
${config.longDescription}
`;
}

export function generatePostinst(config: DebianPackageConfig): string {
  return `#!/bin/bash
set -e

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database -q /usr/share/applications || true
fi

# Update icon cache
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi

exit 0
`;
}

export function generatePrerm(config: DebianPackageConfig): string {
  return `#!/bin/bash
set -e
exit 0
`;
}

export function generateDesktopEntry(config: DebianPackageConfig): string {
  const pkg = sanitizePackageName(config.packageName);
  return `[Desktop Entry]
Version=1.0
Type=Application
Name=WikiNote
GenericName=Personal Wiki Notepad
Comment=Standalone desktop wiki notepad for Debian Linux (Gnote-style)
Exec=/usr/bin/${pkg} %U
Icon=${pkg}
Terminal=false
Categories=Office;Utility;TextEditor;Documentation;
Keywords=markdown;wiki;notes;debian;editor;biography;gnote;tomboy;
StartupNotify=true
StartupWMClass=${pkg}
MimeType=text/markdown;text/plain;x-scheme-handler/wikinote;
`;
}

/**
 * Pure native GTK3 + WebKit2GTK Desktop Window Runner (Python 3 + PyGObject)
 * Creates a genuine Gnote-style desktop application window without browser UI.
 */
export function generateGtkAppPy(config: DebianPackageConfig): string {
  const pkg = sanitizePackageName(config.packageName);
  return `#!/usr/bin/env python3
"""
Native GTK Standalone Desktop Window for ${pkg}
Runs WikiNote in a dedicated GTK desktop window (like Gnote / Tomboy) without any web browser.
"""
import sys
import os

os.environ["RESOURCE_NAME"] = "${pkg}"
os.environ["GDK_BACKEND"] = "x11,wayland"

try:
    import gi
    gi.require_version('Gtk', '3.0')
    try:
        gi.require_version('WebKit2', '4.1')
    except (ValueError, AttributeError):
        gi.require_version('WebKit2', '4.0')
    from gi.repository import Gtk, WebKit2, Gio, GLib

    class StandaloneWikiApp(Gtk.Window):
        def __init__(self, app_path, title="WikiNote"):
            super().__init__(title=title)
            self.set_default_size(1260, 840)
            self.set_position(Gtk.WindowPosition.CENTER)
            self.set_wmclass("${pkg}", "WikiNote")

            # Native GNOME HeaderBar
            header = Gtk.HeaderBar()
            header.set_show_close_button(True)
            header.set_title(title)
            header.set_subtitle("Personal Knowledge Wiki")
            self.set_titlebar(header)

            # Application icon
            icon_path = "/usr/share/icons/hicolor/scalable/apps/${pkg}.svg"
            if os.path.exists(icon_path):
                self.set_icon_from_file(icon_path)

            # WebKit Settings configured strictly for Standalone Desktop App
            settings = WebKit2.Settings()
            settings.set_enable_developer_extras(False)
            settings.set_javascript_can_access_clipboard(True)
            settings.set_enable_write_console_messages_to_stdout(False)

            self.webview = WebKit2.WebView.new_with_settings(settings)
            
            # Dedicated local data directory for offline persistence
            data_dir = os.path.expanduser("~/.local/share/${pkg}")
            os.makedirs(data_dir, exist_ok=True)
            ctx = self.webview.get_context()
            ctx.set_favicon_database_directory(None)

            # Keep external hyperlinks in browser, keep wiki notes inside app window
            self.webview.connect("decide-policy", self.on_decide_policy)

            uri = Gio.File.new_for_path(app_path).get_uri()
            self.webview.load_uri(uri)

            scrolled = Gtk.ScrolledWindow()
            scrolled.add(self.webview)
            self.add(scrolled)
            self.connect("destroy", Gtk.main_quit)

        def on_decide_policy(self, webview, decision, decision_type):
            if decision_type == WebKit2.PolicyDecisionType.NAVIGATION_ACTION:
                nav_action = decision.get_navigation_action()
                uri = nav_action.get_request().get_uri()
                if uri and (uri.startswith("http://") or uri.startswith("https://")):
                    # Open external web links in user's browser, notes remain inside app
                    decision.ignore()
                    Gio.AppInfo.launch_default_for_uri(uri, None)
                    return True
            return False

    def main():
        app_file = sys.argv[1] if len(sys.argv) > 1 else "/usr/share/${pkg}/index.html"
        title = sys.argv[2] if len(sys.argv) > 2 else "WikiNote"
        win = StandaloneWikiApp(app_file, title=title)
        win.show_all()
        Gtk.main()

    if __name__ == "__main__":
        main()

except Exception as err:
    sys.exit(127)
`;
}

/**
 * Electron desktop runner configuration if user prefers Electron
 */
export function generateElectronMainJs(config: DebianPackageConfig): string {
  const pkg = sanitizePackageName(config.packageName);
  return `const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1260,
    height: 840,
    title: 'WikiNote',
    icon: path.join(__dirname, 'icon.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;
}

export function generateLauncherScript(config: DebianPackageConfig): string {
  const pkg = sanitizePackageName(config.packageName);
  return `#!/bin/bash
# Desktop Launcher for ${pkg}
# LAUNCHES AS A DEDICATED STANDALONE DESKTOP APPLICATION (LIKE GNOTE), NOT IN A BROWSER!

set -e

APP_DIR="/usr/share/${pkg}"
HTML_FILE="\${APP_DIR}/index.html"

# Fallback: check index.htm if index.html is missing
if [ ! -f "\${HTML_FILE}" ] && [ -f "\${APP_DIR}/index.htm" ]; then
  HTML_FILE="\${APP_DIR}/index.htm"
fi

if [ ! -f "\${HTML_FILE}" ]; then
  ERR_MSG="WikiNote Error: Application file was not found at \${APP_DIR}/index.html. Please reinstall via: sudo dpkg -i ${pkg}_${config.version}_${config.architecture}.deb"
  echo "\${ERR_MSG}" >&2
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="WikiNote" --text="\${ERR_MSG}"
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send -u critical "WikiNote Error" "\${ERR_MSG}"
  fi
  exit 1
fi

APP_NAME="WikiNote"
APP_DATA_DIR="\${HOME}/.local/share/${pkg}"
mkdir -p "\${APP_DATA_DIR}"

# ==============================================================================
# 1. NATIVE GTK APPLICATION WINDOW (Python 3 + PyGObject + WebKit2GTK)
# True native GNOME desktop window matching Gnote / Tomboy!
# ==============================================================================
if command -v python3 >/dev/null 2>&1 && [ -f "\${APP_DIR}/app.py" ]; then
  if python3 "\${APP_DIR}/app.py" "\${HTML_FILE}" "\${APP_NAME}" 2>/dev/null; then
    exit 0
  fi
fi

# ==============================================================================
# 2. STANDALONE APPLICATION WINDOW MODE (--app Mode)
# Runs in an isolated chromeless window: NO address bar, NO tabs, NO browser UI.
# Dedicated user-data-dir ensures it stays in its own window separate from browser sessions.
# ==============================================================================
CHROME_FLAGS="--app=file://\${HTML_FILE} --user-data-dir=\${APP_DATA_DIR}/profile --class=${pkg} --name=${pkg} --no-first-run --no-default-browser-check"

if command -v chromium >/dev/null 2>&1; then
  exec chromium \${CHROME_FLAGS} "$@" &
  exit 0
elif command -v google-chrome >/dev/null 2>&1; then
  exec google-chrome \${CHROME_FLAGS} "$@" &
  exit 0
elif command -v chromium-browser >/dev/null 2>&1; then
  exec chromium-browser \${CHROME_FLAGS} "$@" &
  exit 0
elif command -v brave-browser >/dev/null 2>&1; then
  exec brave-browser \${CHROME_FLAGS} "$@" &
  exit 0
fi

# ==============================================================================
# 3. ELECTRON STANDALONE RUNNER
# ==============================================================================
if command -v electron >/dev/null 2>&1 && [ -f "\${APP_DIR}/main.js" ]; then
  exec electron "\${APP_DIR}" "$@" &
  exit 0
fi

# ==============================================================================
# 4. NOTICE IF NATIVE GTK RUNTIME IS MISSING
# ==============================================================================
NOTIFY="WikiNote is designed to run in a standalone GTK window (like Gnote).\nPlease install the recommended Debian packages:\nsudo apt install python3-gi gir1.2-webkit2-4.1"
echo -e "\${NOTIFY}" >&2
if command -v zenity >/dev/null 2>&1; then
  zenity --info --title="WikiNote Desktop Setup" --text="\${NOTIFY}"
fi

# Fallback only if no standalone runner exists
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "\${HTML_FILE}" >/dev/null 2>&1 &
fi

exit 0
`;
}

export function generateBuildScript(config: DebianPackageConfig): string {
  const pkg = sanitizePackageName(config.packageName);
  return `#!/bin/bash
# Automated Debian (.deb) Package Builder
# Builds a standalone desktop application package (Gnote style)

set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "\${SCRIPT_DIR}"

PKG_NAME="${pkg}"
PKG_VER="${config.version}"
PKG_ARCH="${config.architecture}"
ROOT_DIR="\${PKG_NAME}_\${PKG_VER}_\${PKG_ARCH}"

echo "========================================================="
echo " Building Standalone Debian package: \${ROOT_DIR}.deb"
echo "========================================================="

TMP_HTML="/tmp/wikinote_app_backup_$$.html"
if [ -f "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.html" ]; then
  cp "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.html" "\${TMP_HTML}"
elif [ -f "index.html" ]; then
  cp "index.html" "\${TMP_HTML}"
elif [ -f "index.htm" ]; then
  cp "index.htm" "\${TMP_HTML}"
fi

echo "==> Creating clean directory structure..."
mkdir -p "\${ROOT_DIR}/DEBIAN"
mkdir -p "\${ROOT_DIR}/usr/bin"
mkdir -p "\${ROOT_DIR}/usr/share/\${PKG_NAME}"
mkdir -p "\${ROOT_DIR}/usr/share/applications"
mkdir -p "\${ROOT_DIR}/usr/share/icons/hicolor/scalable/apps"
mkdir -p "\${ROOT_DIR}/usr/share/doc/\${PKG_NAME}"

echo "==> Writing DEBIAN/control..."
cat << 'EOF' > "\${ROOT_DIR}/DEBIAN/control"
${generateControlFile(config)}EOF

echo "==> Writing DEBIAN/postinst & prerm..."
cat << 'EOF' > "\${ROOT_DIR}/DEBIAN/postinst"
${generatePostinst(config)}EOF
chmod 755 "\${ROOT_DIR}/DEBIAN/postinst"

cat << 'EOF' > "\${ROOT_DIR}/DEBIAN/prerm"
${generatePrerm(config)}EOF
chmod 755 "\${ROOT_DIR}/DEBIAN/prerm"

echo "==> Writing standalone /usr/bin/\${PKG_NAME} launcher..."
cat << 'EOF' > "\${ROOT_DIR}/usr/bin/\${PKG_NAME}"
${generateLauncherScript(config)}EOF
chmod 755 "\${ROOT_DIR}/usr/bin/\${PKG_NAME}"

echo "==> Writing native GTK desktop runner (app.py)..."
cat << 'EOF' > "\${ROOT_DIR}/usr/share/\${PKG_NAME}/app.py"
${generateGtkAppPy(config)}EOF
chmod 755 "\${ROOT_DIR}/usr/share/\${PKG_NAME}/app.py"

echo "==> Writing Electron runner (main.js)..."
cat << 'EOF' > "\${ROOT_DIR}/usr/share/\${PKG_NAME}/main.js"
${generateElectronMainJs(config)}EOF
chmod 644 "\${ROOT_DIR}/usr/share/\${PKG_NAME}/main.js"

echo "==> Writing desktop launcher entry..."
cat << 'EOF' > "\${ROOT_DIR}/usr/share/applications/\${PKG_NAME}.desktop"
${generateDesktopEntry(config)}EOF
chmod 644 "\${ROOT_DIR}/usr/share/applications/\${PKG_NAME}.desktop"

echo "==> Writing Debian scalable SVG icon..."
cat << 'EOF' > "\${ROOT_DIR}/usr/share/icons/hicolor/scalable/apps/\${PKG_NAME}.svg"
${DEBIAN_SVG_ICON}
EOF
chmod 644 "\${ROOT_DIR}/usr/share/icons/hicolor/scalable/apps/\${PKG_NAME}.svg"
cp "\${ROOT_DIR}/usr/share/icons/hicolor/scalable/apps/\${PKG_NAME}.svg" "\${ROOT_DIR}/usr/share/\${PKG_NAME}/icon.svg"

echo "==> Installing application files into /usr/share/\${PKG_NAME}/..."
if [ -f "\${TMP_HTML}" ]; then
  cp "\${TMP_HTML}" "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.html"
  cp "\${TMP_HTML}" "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.htm"
  rm -f "\${TMP_HTML}"
elif [ -f "index.html" ]; then
  cp "index.html" "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.html"
  cp "index.html" "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.htm"
fi

chmod 644 "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.html"
chmod 644 "\${ROOT_DIR}/usr/share/\${PKG_NAME}/index.htm"

echo "==> Setting directory permissions..."
find "\${ROOT_DIR}" -type d -exec chmod 755 {} \\;
find "\${ROOT_DIR}/DEBIAN" -type f -exec chmod 644 {} \\;
chmod 755 "\${ROOT_DIR}/DEBIAN/postinst"
chmod 755 "\${ROOT_DIR}/DEBIAN/prerm"
chmod 755 "\${ROOT_DIR}/usr/bin/\${PKG_NAME}"
chmod 755 "\${ROOT_DIR}/usr/share/\${PKG_NAME}/app.py"

echo "==> Building Debian package with dpkg-deb..."
if command -v dpkg-deb >/dev/null 2>&1; then
  dpkg-deb --build --root-owner-group "\${ROOT_DIR}"
  echo "---------------------------------------------------------"
  echo " SUCCESS! Created Standalone Debian package: \${ROOT_DIR}.deb"
  echo " Install now with: sudo dpkg -i \${ROOT_DIR}.deb"
  echo " To ensure native GTK window support, run: sudo apt-get install -f"
  echo "---------------------------------------------------------"
else
  echo "dpkg-deb command not found. You can build on any Debian system using:"
  echo "  dpkg-deb --build --root-owner-group \${ROOT_DIR}"
fi
`;
}

/**
 * Builds the standalone single-file HTML application that runs locally in /usr/share/${pkg}/index.html
 */
export function generateStandaloneHtml(notes: Note[], config: DebianPackageConfig): string {
  const notesJson = JSON.stringify(notes);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WikiNote - Debian Linux Desktop</title>
  <style>
    :root {
      --deb-red: #D70A53;
      --deb-red-hover: #E81A63;
      --bg-dark: #1e1e24;
      --bg-surface: #282830;
      --bg-sidebar: #18181c;
      --border: rgba(255, 255, 255, 0.08);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --link: #38bdf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Liberation Sans", sans-serif;
      background: var(--bg-dark);
      color: var(--text-main);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    header {
      height: 48px;
      background: #18181c;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      user-select: none;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 15px;
      color: #fff;
    }
    .badge {
      background: var(--deb-red);
      color: #fff;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 600;
    }
    .btn {
      background: #282832;
      border: 1px solid var(--border);
      color: #e5e7eb;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover { background: #383844; color: #fff; }
    .btn-primary { background: var(--deb-red); border-color: var(--deb-red); color: #fff; font-weight: 600; }
    .btn-primary:hover { background: var(--deb-red-hover); }
    .main-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    aside {
      width: 270px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }
    .search-box {
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .search-input {
      width: 100%;
      background: #101014;
      border: 1px solid var(--border);
      color: #fff;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
    }
    .notes-list {
      flex: 1;
      overflow-y: auto;
    }
    .note-item {
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      transition: background 0.15s;
    }
    .note-item:hover { background: rgba(255,255,255,0.04); }
    .note-item.active {
      background: rgba(215, 10, 83, 0.18);
      border-left: 3px solid var(--deb-red);
    }
    .note-item-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px; }
    .note-item-snippet { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-dark);
    }
    .toolbar {
      padding: 8px 16px;
      background: #22222a;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .editor-container {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    .editor-pane, .preview-pane {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      padding: 24px;
    }
    .editor-pane {
      border-right: 1px solid var(--border);
      padding: 0;
    }
    textarea.editor {
      width: 100%;
      height: 100%;
      padding: 20px;
      background: transparent;
      border: none;
      color: #f3f4f6;
      font-family: 'JetBrains Mono', 'Liberation Mono', monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      outline: none;
    }
    .preview-pane {
      line-height: 1.65;
      font-size: 14px;
    }
    .preview-pane h1 { font-size: 26px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-top: 0; color: #fff; }
    .preview-pane h2 { font-size: 20px; color: #f3f4f6; margin-top: 24px; }
    .preview-pane h3 { font-size: 16px; color: #e5e7eb; }
    .preview-pane img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid var(--border); }
    .preview-pane blockquote { border-left: 3px solid var(--deb-red); margin: 12px 0; padding-left: 14px; color: #d1d5db; font-style: italic; background: rgba(255,255,255,0.02); padding: 8px 14px; }
    .preview-pane code { background: #141418; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #fb7185; }
    .wiki-link {
      color: var(--link);
      background: rgba(56, 189, 248, 0.12);
      padding: 1px 5px;
      border-radius: 3px;
      border-bottom: 1px solid rgba(56, 189, 248, 0.5);
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
    }
    .wiki-link:hover {
      background: rgba(56, 189, 248, 0.25);
      color: #7dd3fc;
    }
    .footer-bar {
      height: 28px;
      background: #141418;
      border-top: 1px solid var(--border);
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header>
    <div class="header-brand">
      <svg width="22" height="22" viewBox="0 0 128 128">
        <rect width="120" height="120" x="4" y="4" rx="26" fill="#1e1e24" stroke="#D70A53" stroke-width="2.5" />
        <path d="M64 24 C82 24 96 36 96 52 C96 68 82 78 68 78 C56 78 48 70 48 60 C48 52 54 46 62 46 C68 46 72 50 72 56 C72 60 69 63 65 63 C63 63 61 61 61 59 C61 57 62 56 63 56 C64 56 64.5 56.5 64.5 57 C64.5 57.5 64 58 63.5 58 C63 58 62.5 57.5 62.5 57 C62.5 55 64 53 67 53 C71 53 74 56 74 61 C74 68 67 74 58 74 C47 74 38 64 38 52 C38 36 52 24 68 24 Z" fill="#D70A53" />
      </svg>
      <span>WikiNote</span>
      <span class="badge">Standalone App</span>
    </div>

    <div style="display: flex; gap: 8px;">
      <button class="btn btn-primary" onclick="createNewNote()">+ New Note</button>
      <button class="btn" onclick="exportCurrentNote()">Export .md</button>
      <button class="btn" onclick="toggleViewMode()">Toggle Split/Preview</button>
    </div>
  </header>

  <div class="main-layout">
    <aside>
      <div class="search-box">
        <input type="text" id="searchInput" class="search-input" placeholder="Search notes & titles (Ctrl+K)..." oninput="renderNotesList()">
      </div>
      <div class="notes-list" id="notesListContainer"></div>
    </aside>

    <div class="content-area">
      <div class="toolbar">
        <button class="btn" onclick="wrapText('**', '**')"><b>B</b></button>
        <button class="btn" onclick="wrapText('*', '*')"><i>I</i></button>
        <button class="btn" onclick="wrapText('~~', '~~')"><del>S</del></button>
        <button class="btn" onclick="wrapText('==', '==')">Highlight</button>
        <button class="btn" onclick="insertHeading('# ')">H1</button>
        <button class="btn" onclick="insertHeading('## ')">H2</button>
        <button class="btn" onclick="wrapText('\\n- ', '')">• Bullet</button>
        <button class="btn" onclick="wrapText('\\n- [ ] ', '')">☑ Task</button>
        <button class="btn" onclick="promptWikiLink()">[[WikiLink]]</button>
        <button class="btn" onclick="triggerImageUpload()">🖼 Image</button>
        <input type="file" id="imageInput" accept="image/*" style="display: none;" onchange="handleImageFile(this)">
      </div>

      <div class="editor-container">
        <div class="editor-pane" id="editorPane">
          <textarea id="noteEditor" class="editor" oninput="onEditorInput()"></textarea>
        </div>
        <div class="preview-pane" id="previewPane"></div>
      </div>

      <div class="footer-bar">
        <span id="footerStats">WikiNote for Debian Linux</span>
        <span>Dedicated Desktop Application · Clipboard image paste enabled</span>
      </div>
    </div>
  </div>

  <script>
    const INITIAL_DATA = ${notesJson};
    let notes = [];
    try {
      const stored = localStorage.getItem('debian_wikinote_library_v1');
      notes = stored ? JSON.parse(stored) : INITIAL_DATA;
    } catch(e) {
      notes = INITIAL_DATA;
    }
    if (!Array.isArray(notes) || notes.length === 0) notes = INITIAL_DATA;

    let activeNoteId = notes[0]?.id || '';
    let isSplit = true;

    function save() {
      localStorage.setItem('debian_wikinote_library_v1', JSON.stringify(notes));
    }

    function getActiveNote() {
      return notes.find(n => n.id === activeNoteId) || notes[0];
    }

    function renderNotesList() {
      const container = document.getElementById('notesListContainer');
      const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
      container.innerHTML = '';

      notes
        .filter(n => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
        .forEach(n => {
          const div = document.createElement('div');
          div.className = 'note-item' + (n.id === activeNoteId ? ' active' : '');
          div.onclick = () => selectNote(n.id);
          div.innerHTML = '<div class="note-item-title">' + escapeHtml(n.title) + '</div>' +
                          '<div class="note-item-snippet">' + escapeHtml(n.content.replace(/#+/g, '').slice(0, 60)) + '</div>';
          container.appendChild(div);
        });
    }

    function selectNote(id) {
      activeNoteId = id;
      const note = getActiveNote();
      if (!note) return;
      document.getElementById('noteEditor').value = note.content;
      renderPreview();
      renderNotesList();
    }

    function onEditorInput() {
      const note = getActiveNote();
      if (!note) return;
      note.content = document.getElementById('noteEditor').value;
      note.updatedAt = Date.now();
      save();
      renderPreview();
    }

    function renderPreview() {
      const note = getActiveNote();
      if (!note) return;
      const preview = document.getElementById('previewPane');
      preview.innerHTML = parseMarkdownWithWikiLinks(note.content);
    }

    function parseMarkdownWithWikiLinks(md) {
      let html = escapeHtml(md);

      const candidateTitles = notes
        .filter(n => n.id !== activeNoteId && n.title.trim().length > 1)
        .map(n => n.title.trim())
        .sort((a,b) => b.length - a.length);

      html = html.replace(/\\[\\[([^\\]|]+)(?:\\|([^\\]]+))?\\]\\]/g, (match, target, label) => {
        const text = label ? label : target;
        return '<span class="wiki-link" onclick="navigateToTitle(\\'' + target.replace(/'/g, "\\\\'") + '\\')">' + text + ' ↗</span>';
      });

      html = html.replace(/!\\[(.*?)\\]\\((.*?)\\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:6px;">');

      html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

      html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
      html = html.replace(/\\*(.*?)\\*/g, '<em>$1</em>');
      html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
      const bt = String.fromCharCode(96);
      html = html.replace(new RegExp(bt + '([^' + bt + ']+)' + bt, 'g'), '<code>$1</code>');
      html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
      html = html.replace(/^- \\[x\\] (.*$)/gim, '<div>☑ <del>$1</del></div>');
      html = html.replace(/^- \\[ \\] (.*$)/gim, '<div>☐ $1</div>');
      html = html.replace(/^- (.*$)/gim, '<div>• $1</div>');
      html = html.replace(/\\n/g, '<br>');

      candidateTitles.forEach(title => {
        const escaped = title.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\\\$&');
        const reg = new RegExp('\\\\b(' + escaped + ')\\\\b', 'gi');
        html = html.replace(reg, (m) => {
          return '<span class="wiki-link" onclick="navigateToTitle(\\'' + title.replace(/'/g, "\\\\'") + '\\')">' + m + ' ↗</span>';
        });
      });

      return html;
    }

    function navigateToTitle(title) {
      const found = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
      if (found) {
        selectNote(found.id);
      } else {
        createNewNote(title);
      }
    }

    function createNewNote(customTitle) {
      const title = customTitle || prompt('Note title:', 'New Note');
      if (!title) return;
      const newNote = {
        id: 'note-' + Date.now(),
        title: title.trim(),
        folder: 'General',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        content: '# ' + title + '\\n\\nStart writing... Any note title mentioned will auto-link!'
      };
      notes.unshift(newNote);
      save();
      selectNote(newNote.id);
    }

    function wrapText(prefix, suffix) {
      const textarea = document.getElementById('noteEditor');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selected = text.substring(start, end) || 'text';
      textarea.value = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      onEditorInput();
    }

    function insertHeading(prefix) {
      wrapText('\\n' + prefix, '');
    }

    function promptWikiLink() {
      const title = prompt('Enter note title to link:');
      if (title) wrapText('[[' + title + ']]', '');
    }

    function triggerImageUpload() {
      document.getElementById('imageInput').click();
    }

    function handleImageFile(input) {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          wrapText('\\n![' + file.name + '](' + reader.result + ')\\n', '');
        };
        reader.readAsDataURL(file);
      }
      input.value = '';
    }

    // Direct clipboard paste of images
    document.getElementById('noteEditor').addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              wrapText('\\n![Pasted Image](' + reader.result + ')\\n', '');
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    });

    function toggleViewMode() {
      isSplit = !isSplit;
      document.getElementById('editorPane').style.display = isSplit ? 'block' : 'none';
      document.getElementById('previewPane').style.flex = '1';
    }

    function exportCurrentNote() {
      const note = getActiveNote();
      if (!note) return;
      const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = note.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '.md';
      a.click();
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Init
    selectNote(activeNoteId);
  </script>
</body>
</html>`;
}

/**
 * Packages all Debian build scripts, files, and notes library into a ready-to-run ZIP archive
 */
export async function downloadDebianPackageBundle(
  config: DebianPackageConfig,
  notes: Note[]
): Promise<void> {
  const zip = new JSZip();
  const pkg = sanitizePackageName(config.packageName);
  const safeConfig = { ...config, packageName: pkg };

  const pkgDirName = `${pkg}_${safeConfig.version}_${safeConfig.architecture}`;
  const pkgFolder = zip.folder(pkgDirName);

  const standaloneHtml = generateStandaloneHtml(notes, safeConfig);

  // 1. Root level files in ZIP for easy access and guaranteed copy
  zip.file('index.html', standaloneHtml);
  zip.file('index.htm', standaloneHtml);
  zip.file('app.py', generateGtkAppPy(safeConfig), { unixPermissions: '755' });
  zip.file('main.js', generateElectronMainJs(safeConfig));
  zip.file('build-deb.sh', generateBuildScript(safeConfig), { unixPermissions: '755' });
  zip.file(
    'install-deb.sh',
    `#!/bin/bash
set -e
echo "==> Building Debian standalone package..."
chmod +x build-deb.sh
./build-deb.sh
echo "==> Installing package via dpkg..."
sudo dpkg -i ${pkgDirName}.deb
echo "==> Installing native GTK desktop dependencies (for Gnote-like standalone window)..."
sudo apt-get install -f -y || true
echo "==> Installation complete! Launch standalone application by typing: ${pkg}"
`,
    { unixPermissions: '755' }
  );

  // 2. Pre-constructed Debian directory tree inside ZIP
  // DEBIAN
  const debianFolder = pkgFolder?.folder('DEBIAN');
  debianFolder?.file('control', generateControlFile(safeConfig));
  debianFolder?.file('postinst', generatePostinst(safeConfig), { unixPermissions: '755' });
  debianFolder?.file('prerm', generatePrerm(safeConfig), { unixPermissions: '755' });

  // usr/bin
  const binFolder = pkgFolder?.folder('usr')?.folder('bin');
  binFolder?.file(pkg, generateLauncherScript(safeConfig), { unixPermissions: '755' });

  // usr/share/applications
  const appsFolder = pkgFolder?.folder('usr')?.folder('share')?.folder('applications');
  appsFolder?.file(`${pkg}.desktop`, generateDesktopEntry(safeConfig));

  // usr/share/icons
  const iconFolder = pkgFolder
    ?.folder('usr')
    ?.folder('share')
    ?.folder('icons')
    ?.folder('hicolor')
    ?.folder('scalable')
    ?.folder('apps');
  iconFolder?.file(`${pkg}.svg`, DEBIAN_SVG_ICON);

  // usr/share/<pkg>
  const appFolder = pkgFolder?.folder('usr')?.folder('share')?.folder(pkg);
  appFolder?.file('index.html', standaloneHtml);
  appFolder?.file('index.htm', standaloneHtml);
  appFolder?.file('app.py', generateGtkAppPy(safeConfig), { unixPermissions: '755' });
  appFolder?.file('main.js', generateElectronMainJs(safeConfig));
  appFolder?.file('icon.svg', DEBIAN_SVG_ICON);

  // README with instructions
  zip.file(
    'README-DEBIAN.txt',
    `============================================================
 DEBIAN LINUX STANDALONE APP (GNOTE-STYLE) FOR ${pkg.toUpperCase()}
============================================================

WikiNote is built to run as a dedicated, standalone desktop application
window (just like Gnote or Tomboy) without opening in your web browser.

HOW IT RUNS AS A STANDALONE DESKTOP APPLICATION:
------------------------------------------------------------
1. Native GTK Desktop Window (Primary):
   Uses Python 3 + WebKit2GTK / GTK3 to render a pure native GNOME
   desktop window with its own HeaderBar, taskbar icon, and tray integration.

2. Standalone App Window Mode (Secondary):
   Uses Chromium / Google Chrome / Brave with '--app=file://...' in an isolated
   window without address bar, tabs, or browser navigation.

HOW TO INSTALL ON DEBIAN / UBUNTU:
------------------------------------------------------------
1. Extract the bundle:
   unzip ${pkg}_${safeConfig.version}_debian_bundle.zip
   cd ${pkg}_${safeConfig.version}_debian_bundle

2. Run the installer:
   chmod +x install-deb.sh
   ./install-deb.sh

3. Install the native GTK runtime if not already installed:
   sudo apt install python3-gi gir1.2-gtk-3.0 gir1.2-webkit2-4.1

4. Launch:
   ${pkg}
   (or search for "WikiNote" in your GNOME / KDE Application Menu)
`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pkg}_${safeConfig.version}_debian_bundle.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
