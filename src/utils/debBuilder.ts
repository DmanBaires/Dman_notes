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
  description: 'Desktop Wiki & Markdown Notepad for Debian Linux',
  longDescription: ` WikiNote is a high-performance personal knowledge base and Markdown
 notepad designed for Debian GNU/Linux. It features automatic title-to-hyperlink
 cross-referencing, clipboard image integration, local offline storage, and
 interactive graph visualizations.`,
  homepage: 'https://github.com/wikinote/wikinote',
  section: 'utils',
  priority: 'optional',
  depends: 'xdg-utils, bash (>= 5.0), python3 | nodejs | chromium | firefox-esr',
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

export function generateControlFile(config: DebianPackageConfig): string {
  return `Package: ${config.packageName}
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

export function generateDesktopEntry(config: DebianPackageConfig): string {
  return `[Desktop Entry]
Version=1.0
Type=Application
Name=WikiNote
GenericName=Personal Wiki Notepad
Comment=${config.description}
Exec=/usr/bin/${config.packageName} %U
Icon=${config.packageName}
Terminal=false
Categories=Office;Utility;TextEditor;Documentation;
Keywords=markdown;wiki;notes;debian;editor;biography;
StartupNotify=true
MimeType=text/markdown;text/plain;x-scheme-handler/wikinote;
`;
}

export function generateLauncherScript(config: DebianPackageConfig): string {
  return `#!/bin/bash
# WikiNote Debian Desktop Launcher
# /usr/bin/${config.packageName}

APP_DIR="/usr/share/${config.packageName}"
APP_URL="file://\${APP_DIR}/index.html"

# If an argument is provided (e.g. file path or URL), process it
if [ "$#" -gt 0 ]; then
  FILE_PARAM="$1"
fi

# Detect best desktop web browser/webview available on Debian
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "\${APP_URL}" &
elif command -v sensible-browser >/dev/null 2>&1; then
  sensible-browser "\${APP_URL}" &
elif command -v firefox-esr >/dev/null 2>&1; then
  firefox-esr --new-window "\${APP_URL}" &
elif command -v chromium >/dev/null 2>&1; then
  chromium --app="\${APP_URL}" &
else
  echo "Error: No compatible web runtime or browser found. Please install xdg-utils or firefox-esr."
  exit 1
fi

exit 0
`;
}

export function generateBuildScript(config: DebianPackageConfig): string {
  return `#!/bin/bash
# Automated Debian (.deb) Package Builder
# Run on Debian 12 / Ubuntu / Kali / any dpkg-enabled system

set -e
PKG_NAME="${config.packageName}"
PKG_VER="${config.version}"
PKG_ARCH="${config.architecture}"
ROOT_DIR="\${PKG_NAME}_\${PKG_VER}_\${PKG_ARCH}"

echo "==> Preparing Debian package directory structure: \${ROOT_DIR}..."
rm -rf "\${ROOT_DIR}"
mkdir -p "\${ROOT_DIR}/DEBIAN"
mkdir -p "\${ROOT_DIR}/usr/bin"
mkdir -p "\${ROOT_DIR}/usr/share/\${PKG_NAME}"
mkdir -p "\${ROOT_DIR}/usr/share/applications"
mkdir -p "\${ROOT_DIR}/usr/share/icons/hicolor/scalable/apps"
mkdir -p "\${ROOT_DIR}/usr/share/doc/\${PKG_NAME}"

echo "==> Generating DEBIAN/control file..."
cat << 'EOF' > "\${ROOT_DIR}/DEBIAN/control"
${generateControlFile(config)}EOF

echo "==> Generating /usr/bin/\${PKG_NAME} executable..."
cat << 'EOF' > "\${ROOT_DIR}/usr/bin/\${PKG_NAME}"
${generateLauncherScript(config)}EOF
chmod 755 "\${ROOT_DIR}/usr/bin/\${PKG_NAME}"

echo "==> Generating Desktop launcher entry..."
cat << 'EOF' > "\${ROOT_DIR}/usr/share/applications/\${PKG_NAME}.desktop"
${generateDesktopEntry(config)}EOF
chmod 644 "\${ROOT_DIR}/usr/share/applications/\${PKG_NAME}.desktop"

echo "==> Generating Scalable SVG icon..."
cat << 'EOF' > "\${ROOT_DIR}/usr/share/icons/hicolor/scalable/apps/\${PKG_NAME}.svg"
${DEBIAN_SVG_ICON}
EOF
chmod 644 "\${ROOT_DIR}/usr/share/icons/hicolor/scalable/apps/\${PKG_NAME}.svg"

echo "==> Copying application bundle to /usr/share/\${PKG_NAME}..."
cp index.html "\${ROOT_DIR}/usr/share/\${PKG_NAME}/" || true

echo "==> Setting correct permissions..."
find "\${ROOT_DIR}" -type d -exec chmod 755 {} \\;
find "\${ROOT_DIR}/DEBIAN" -type f -exec chmod 644 {} \\;
chmod 755 "\${ROOT_DIR}/usr/bin/\${PKG_NAME}"

echo "==> Building Debian package with dpkg-deb..."
if command -v dpkg-deb >/dev/null 2>&1; then
  dpkg-deb --build "\${ROOT_DIR}"
  echo "SUCCESS! Created Debian package: \${ROOT_DIR}.deb"
  echo "Install with: sudo dpkg -i \${ROOT_DIR}.deb"
else
  echo "dpkg-deb not detected on this host. Directory \${ROOT_DIR} is prepared."
  echo "Transfer \${ROOT_DIR} to your Debian host and run: dpkg-deb --build \${ROOT_DIR}"
fi
`;
}

/**
 * Packages all Debian build scripts, files, and notes library into a ready-to-run ZIP archive
 */
export async function downloadDebianPackageBundle(
  config: DebianPackageConfig,
  notes: Note[]
): Promise<void> {
  const zip = new JSZip();
  const pkgDirName = `${config.packageName}_${config.version}_${config.architecture}`;
  const pkgFolder = zip.folder(pkgDirName);

  // DEBIAN folder
  const debianFolder = pkgFolder?.folder('DEBIAN');
  debianFolder?.file('control', generateControlFile(config));

  // usr/bin folder
  const binFolder = pkgFolder?.folder('usr')?.folder('bin');
  binFolder?.file(config.packageName, generateLauncherScript(config), { unixPermissions: '755' });

  // usr/share/applications folder
  const appsFolder = pkgFolder?.folder('usr')?.folder('share')?.folder('applications');
  appsFolder?.file(`${config.packageName}.desktop`, generateDesktopEntry(config));

  // usr/share/icons folder
  const iconFolder = pkgFolder
    ?.folder('usr')
    ?.folder('share')
    ?.folder('icons')
    ?.folder('hicolor')
    ?.folder('scalable')
    ?.folder('apps');
  iconFolder?.file(`${config.packageName}.svg`, DEBIAN_SVG_ICON);

  // usr/share/wikinote app folder
  const appFolder = pkgFolder?.folder('usr')?.folder('share')?.folder(config.packageName);
  
  // Create an offline standalone HTML package bundled with the user's notes
  const standaloneHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Debian WikiNote - Desktop App</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #1e1e24; color: #f3f4f6; margin: 0; padding: 24px; }
    h1 { color: #D70A53; border-bottom: 2px solid #D70A53; padding-bottom: 8px; }
    .note-card { background: #282830; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .note-title { font-size: 1.25rem; font-weight: 600; color: #38bdf8; margin-top: 0; }
    .note-body { white-space: pre-wrap; line-height: 1.6; }
    .badge { display: inline-block; background: #D70A53; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Debian WikiNote Standalone Library</h1>
  <p>Local package compiled for Debian Linux. Library contains ${notes.length} notes.</p>
  <div>
    ${notes
      .map(
        (n) => `
      <div class="note-card">
        <h2 class="note-title">${escapeHtml(n.title)} <span class="badge">${escapeHtml(n.folder)}</span></h2>
        <div class="note-body">${escapeHtml(n.content)}</div>
      </div>
    `
      )
      .join('\n')}
  </div>
</body>
</html>`;

  appFolder?.file('index.html', standaloneHtml);

  // Root build script & README
  zip.file('build-deb.sh', generateBuildScript(config), { unixPermissions: '755' });
  zip.file(
    'README-DEBIAN.txt',
    `============================================================
 DEBIAN LINUX PACKAGE (DEB) INSTRUCTIONS FOR WIKINOTE
============================================================

To build and install the official .deb package on Debian 12 / Sid / Ubuntu:

1. Open your terminal in this extracted directory:
   cd debian-wikinote-bundle

2. Run the automated builder script:
   chmod +x build-deb.sh
   ./build-deb.sh

3. Install the generated .deb package:
   sudo dpkg -i ${pkgDirName}.deb

4. If dependencies need resolution:
   sudo apt-get install -f

5. Launch WikiNote:
   - Type 'wikinote' in any terminal, OR
   - Open your desktop Application Menu -> Office -> WikiNote!
`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.packageName}_${config.version}_debian_bundle.zip`;
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
