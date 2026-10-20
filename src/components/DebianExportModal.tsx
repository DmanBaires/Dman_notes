import React, { useState } from 'react';
import { Note } from '../types/note';
import {
  DebianPackageConfig,
  DEFAULT_DEBIAN_CONFIG,
  sanitizePackageName,
  generateControlFile,
  generateDesktopEntry,
  generateLauncherScript,
  generateBuildScript,
  downloadDebianPackageBundle,
  DEBIAN_SVG_ICON,
} from '../utils/debBuilder';
import {
  Download,
  Terminal,
  FileCode,
  CheckCircle,
  Copy,
  Box,
  Layers,
  Info,
  X,
  ExternalLink,
  Wrench,
} from 'lucide-react';

interface DebianExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
}

export const DebianExportModal: React.FC<DebianExportModalProps> = ({
  isOpen,
  onClose,
  notes,
}) => {
  const [config, setConfig] = useState<DebianPackageConfig>(DEFAULT_DEBIAN_CONFIG);
  const [activeTab, setActiveTab] = useState<'overview' | 'control' | 'desktop' | 'launcher' | 'commands' | 'fix'>('overview');
  const [isPackaging, setIsPackaging] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const pkg = sanitizePackageName(config.packageName);
  const safeConfig = { ...config, packageName: pkg };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = async () => {
    setIsPackaging(true);
    try {
      await downloadDebianPackageBundle(safeConfig, notes);
    } catch (e) {
      console.error('Packaging failed', e);
    } finally {
      setIsPackaging(false);
    }
  };

  const controlContent = generateControlFile(safeConfig);
  const desktopContent = generateDesktopEntry(safeConfig);
  const launcherContent = generateLauncherScript(safeConfig);
  const buildScriptContent = generateBuildScript(safeConfig);

  const installCommand = `# 1. Extract package bundle
unzip ${pkg}_${safeConfig.version}_debian_bundle.zip
cd ${pkg}_${safeConfig.version}_debian_bundle

# 2. Automated 1-command build & install
chmod +x install-deb.sh
./install-deb.sh

# 3. For pure native GTK desktop window (like Gnote), install GTK WebKit runtime:
sudo apt install python3-gi gir1.2-gtk-3.0 gir1.2-webkit2-4.1

# 4. Launch standalone application (NO browser, dedicated window)
${pkg}
`;

  const fixExistingCommand = `# To make your existing installed app launch in a standalone window (like Gnote):
# 1. Install the native GTK desktop engine:
sudo apt install python3-gi gir1.2-gtk-3.0 gir1.2-webkit2-4.1

# 2. Download and install the updated package bundle:
unzip ${pkg}_${safeConfig.version}_debian_bundle.zip
cd ${pkg}_${safeConfig.version}_debian_bundle
chmod +x install-deb.sh
./install-deb.sh

# 3. Launch WikiNote in its dedicated standalone window:
${pkg}
`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-950/80 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: DEBIAN_SVG_ICON }}
            />
            <div>
              <h2 className="text-base font-semibold font-display text-white flex items-center gap-2">
                <span>Debian Package (.deb) Suite</span>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded">
                  v{safeConfig.version}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Generate production-ready Debian Linux installation packages & desktop entries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-800 bg-neutral-900 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Package Overview
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'commands'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Installation Commands
          </button>
          <button
            onClick={() => setActiveTab('fix')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'fix'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-rose-400" />
            <span>Fix URI / Missing File Error</span>
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'control'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            DEBIAN/control
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'desktop'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Desktop Entry
          </button>
          <button
            onClick={() => setActiveTab('launcher')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'launcher'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Launcher Script
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Package Configuration Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Package Name</label>
                  <input
                    type="text"
                    value={config.packageName}
                    onChange={(e) => setConfig({ ...config, packageName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 font-mono focus:border-rose-500 outline-hidden"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Debian sanitized name: <code className="text-neutral-400 font-mono">{pkg}</code>
                  </span>
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Version</label>
                  <input
                    type="text"
                    value={config.version}
                    onChange={(e) => setConfig({ ...config, version: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 font-mono focus:border-rose-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Architecture</label>
                  <select
                    value={config.architecture}
                    onChange={(e) => setConfig({ ...config, architecture: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 font-mono focus:border-rose-500 outline-hidden"
                  >
                    <option value="amd64">amd64 (x86_64)</option>
                    <option value="arm64">arm64 (aarch64)</option>
                    <option value="all">all (Architecture Independent)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Maintainer Email</label>
                  <input
                    type="email"
                    value={config.maintainerEmail}
                    onChange={(e) => setConfig({ ...config, maintainerEmail: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 font-mono focus:border-rose-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Package Architecture Directory Tree */}
              <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-rose-400" />
                    <span>Standard Debian Package Directory Tree</span>
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">dpkg-deb compliant</span>
                </div>
                <pre className="font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
{`${pkg}_${safeConfig.version}_${safeConfig.architecture}/
├── DEBIAN/
│   ├── control                     # Package metadata, arch, dependencies
│   ├── postinst                    # Desktop & icon cache update
│   └── prerm                       # Clean uninstallation hook
├── usr/
│   ├── bin/
│   │   └── ${pkg}                          # Absolute-path launcher script
│   └── share/
│       ├── applications/
│       │   └── ${pkg}.desktop              # GNOME/KDE desktop launcher entry
│       ├── icons/hicolor/scalable/apps/
│       │   └── ${pkg}.svg                  # Debian red spiral application icon
│       └── ${pkg}/
│           ├── index.html                  # Full offline Wiki runtime (${notes.length} notes)
│           └── index.htm                   # Compatibility symlink`}
                </pre>
              </div>

              {/* Download Callout */}
              <div className="p-4 rounded-lg bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Download Updated Debian Package Bundle
                  </div>
                  <div className="text-xs text-neutral-400">
                    Includes all fixed binaries, automatic <code className="text-rose-300">install-deb.sh</code>, and your {notes.length} notes library.
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={isPackaging}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>{isPackaging ? 'Packaging...' : 'Download Debian Bundle (.zip)'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'fix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-800/60 text-xs space-y-2">
                <div className="font-semibold text-rose-200 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-rose-400" />
                  <span>Cause of "failed to open URI / no such file" Error</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  The error <code className="font-mono text-rose-300">error when getting information for the file "usr/share/.../index.htm"</code> happened because:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-neutral-300 leading-relaxed">
                  <li>The previous builder script clean-up removed the package directory before copying the web files, leaving <code className="font-mono text-neutral-200">/usr/share/{pkg}/index.html</code> missing on the installed system.</li>
                  <li>The launcher script passed a <code className="font-mono text-neutral-200">file://</code> URI with two slashes which caused GNOME's <code className="font-mono text-neutral-200">gio open</code> to mistake <code className="font-mono text-neutral-200">usr</code> for a network hostname instead of an absolute filesystem path.</li>
                </ol>
                <p className="text-neutral-300">
                  Both issues have now been completely resolved with absolute file paths, fallback checks, and both <code className="font-mono text-neutral-200">index.html</code> and <code className="font-mono text-neutral-200">index.htm</code> bundled!
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-300">Terminal Fix Commands:</span>
                  <button
                    onClick={() => handleCopy(fixExistingCommand, 'fix')}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5"
                  >
                    {copiedKey === 'fix' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'fix' ? 'Copied' : 'Copy Fix Commands'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto">
                  {fixExistingCommand}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Run on Debian / Ubuntu / Linux Mint:</span>
                <button
                  onClick={() => handleCopy(installCommand, 'commands')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5"
                >
                  {copiedKey === 'commands' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'commands' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto">
                {installCommand}
              </pre>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Path: <code className="font-mono text-rose-300">DEBIAN/control</code></span>
                <button
                  onClick={() => handleCopy(controlContent, 'control')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5"
                >
                  {copiedKey === 'control' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'control' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
                {controlContent}
              </pre>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Path: <code className="font-mono text-rose-300">usr/share/applications/{pkg}.desktop</code></span>
                <button
                  onClick={() => handleCopy(desktopContent, 'desktop')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5"
                >
                  {copiedKey === 'desktop' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'desktop' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
                {desktopContent}
              </pre>
            </div>
          )}

          {activeTab === 'launcher' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Path: <code className="font-mono text-rose-300">usr/bin/{pkg}</code></span>
                <button
                  onClick={() => handleCopy(launcherContent, 'launcher')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5"
                >
                  {copiedKey === 'launcher' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'launcher' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
                {launcherContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for Debian 12 (Bookworm), Trixie, Ubuntu 24.04, & Linux Mint</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-neutral-800 text-neutral-300"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={isPackaging}
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isPackaging ? 'Packaging...' : 'Download Updated .deb Bundle'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
