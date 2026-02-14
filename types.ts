
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
