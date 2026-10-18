import { Note } from '../types/note';
import { INITIAL_NOTES } from './initialNotes';
import JSZip from 'jszip';

const STORAGE_KEY = 'debian_wikinote_library_v1';

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveNotes(INITIAL_NOTES);
      return INITIAL_NOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_NOTES;
  } catch (e) {
    console.error('Failed to load notes from localStorage, falling back to defaults', e);
    return INITIAL_NOTES;
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to persist notes to localStorage', e);
  }
}

export function exportSingleNoteAsMarkdown(note: Note): void {
  const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = note.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'note';
  a.download = `${safeTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAllNotesAsZip(notes: Note[]): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('wikinote-library');

  notes.forEach((note) => {
    const safeTitle = note.title.replace(/[\/\\?%*:|"<>]/g, '_');
    const filename = `${safeTitle}.md`;
    const metadataHeader = `---
title: "${note.title}"
folder: "${note.folder}"
tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]
createdAt: ${new Date(note.createdAt).toISOString()}
updatedAt: ${new Date(note.updatedAt).toISOString()}
---

`;
    folder?.file(filename, metadataHeader + note.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debian-wikinote-export-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
