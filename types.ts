
export interface Note {
  id: string;
  text: string;
  createdAt: number;
  completed?: boolean;
  parentId?: string; // ID-ul notei părinte, dacă există
}

export interface NoteConnection {
  id: string;
  fromId: string;
  toId: string;
}

export interface Project {
  id: string;
  name: string;
  url: string;
  description: string;
  color: string;
  icon: string;
}

export interface ProjectNotes {
  [projectId: string]: Note[];
}

export interface ProjectPaths {
  [projectId: string]: string[]; // Array of Note IDs in order
}

export type ProjectConnections = NoteConnection[];

export type ComePeriod = 'trecut' | 'prezent' | 'viitor';

export interface ComeEvent {
  id: string;
  text: string;
  period: ComePeriod;
  createdAt: number;
  date?: number; // Target date for 'viitor'
  isOverdue?: boolean;
  order: number;
}
