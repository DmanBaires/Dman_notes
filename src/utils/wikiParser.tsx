import React from 'react';
import { Note, BacklinkItem } from '../types/note';

/**
 * Escapes regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts all backlinks (both linked references and unlinked mentions) for a given note.
 */
export function extractBacklinks(targetNote: Note, allNotes: Note[]): {
  linkedReferences: BacklinkItem[];
  unlinkedMentions: BacklinkItem[];
} {
  const linkedReferences: BacklinkItem[] = [];
  const unlinkedMentions: BacklinkItem[] = [];

  const targetTitleLower = targetNote.title.trim().toLowerCase();
  if (!targetTitleLower) {
    return { linkedReferences, unlinkedMentions };
  }

  // Regex for explicit [[targetTitle]] or [[targetTitle|label]]
  const explicitLinkRegex = new RegExp(
    `\\[\\[(${escapeRegex(targetNote.title)})(?:\\|([^\\]]+))?\\]\\]`,
    'i'
  );

  // Regex for word boundary mention
  const wordMentionRegex = new RegExp(`\\b${escapeRegex(targetNote.title)}\\b`, 'gi');

  allNotes.forEach((sourceNote) => {
    if (sourceNote.id === targetNote.id) return;

    const content = sourceNote.content;
    const explicitMatch = explicitLinkRegex.exec(content);

    if (explicitMatch) {
      // Find a sentence or snippet around the match
      const idx = explicitMatch.index;
      const start = Math.max(0, content.lastIndexOf('\n', idx) + 1);
      const end = content.indexOf('\n', idx + explicitMatch[0].length);
      const snippet = content.slice(start, end !== -1 ? end : content.length).trim();

      linkedReferences.push({
        sourceNoteId: sourceNote.id,
        sourceNoteTitle: sourceNote.title,
        contextSnippet: snippet || explicitMatch[0],
        isLinked: true,
        mentionIndex: idx,
      });
    } else {
      // Check for unlinked mention
      wordMentionRegex.lastIndex = 0;
      const mentionMatch = wordMentionRegex.exec(content);
      if (mentionMatch) {
        const idx = mentionMatch.index;
        const start = Math.max(0, content.lastIndexOf('\n', idx) + 1);
        const end = content.indexOf('\n', idx + mentionMatch[0].length);
        const snippet = content.slice(start, end !== -1 ? end : content.length).trim();

        unlinkedMentions.push({
          sourceNoteId: sourceNote.id,
          sourceNoteTitle: sourceNote.title,
          contextSnippet: snippet || mentionMatch[0],
          isLinked: false,
          mentionIndex: idx,
        });
      }
    }
  });

  return { linkedReferences, unlinkedMentions };
}

/**
 * Builds the graph nodes and links between notes
 */
export function buildGraphData(notes: Note[]): {
  nodes: { id: string; title: string; folder: string; linkCount: number }[];
  links: { source: string; target: string; isAuto: boolean }[];
} {
  const noteMap = new Map<string, Note>();
  const titleToIdMap = new Map<string, string>();

  notes.forEach((n) => {
    noteMap.set(n.id, n);
    titleToIdMap.set(n.title.trim().toLowerCase(), n.id);
  });

  const links: { source: string; target: string; isAuto: boolean }[] = [];
  const connectionCounts = new Map<string, number>();

  notes.forEach((n) => connectionCounts.set(n.id, 0));

  notes.forEach((sourceNote) => {
    // 1. Explicit [[Title]] links
    const explicitRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match: RegExpExecArray | null;
    const targetsInThisNote = new Set<string>();

    while ((match = explicitRegex.exec(sourceNote.content)) !== null) {
      const targetTitle = match[1].trim().toLowerCase();
      const targetId = titleToIdMap.get(targetTitle);
      if (targetId && targetId !== sourceNote.id && !targetsInThisNote.has(targetId)) {
        targetsInThisNote.add(targetId);
        links.push({ source: sourceNote.id, target: targetId, isAuto: false });
        connectionCounts.set(sourceNote.id, (connectionCounts.get(sourceNote.id) || 0) + 1);
        connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
      }
    }

    // 2. Automatic title mentions
    notes.forEach((targetNote) => {
      if (targetNote.id === sourceNote.id || targetsInThisNote.has(targetNote.id)) return;
      if (targetNote.title.length < 3) return; // ignore very short single letters

      const mentionRegex = new RegExp(`\\b${escapeRegex(targetNote.title)}\\b`, 'i');
      if (mentionRegex.test(sourceNote.content)) {
        targetsInThisNote.add(targetNote.id);
        links.push({ source: sourceNote.id, target: targetNote.id, isAuto: true });
        connectionCounts.set(sourceNote.id, (connectionCounts.get(sourceNote.id) || 0) + 1);
        connectionCounts.set(targetNote.id, (connectionCounts.get(targetNote.id) || 0) + 1);
      }
    });
  });

  const nodes = notes.map((n) => ({
    id: n.id,
    title: n.title,
    folder: n.folder,
    linkCount: connectionCounts.get(n.id) || 0,
  }));

  return { nodes, links };
}
