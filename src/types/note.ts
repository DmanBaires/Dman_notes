export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface WikiLinkMatch {
  raw: string;
  targetTitle: string;
  customLabel?: string;
  isAutoLink: boolean;
  start: number;
  end: number;
}

export interface BacklinkItem {
  sourceNoteId: string;
  sourceNoteTitle: string;
  contextSnippet: string;
  isLinked: boolean; // true = explicit [[...]] link, false = unlinked mention of title
  mentionIndex?: number;
}

export type ViewMode = 'split' | 'edit' | 'preview' | 'graph';
