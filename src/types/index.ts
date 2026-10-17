export interface Project {
  id: string;
  name: string;
  description: string;
  customInstructions?: string; // Like Claude's project custom instructions
  color?: string; // Theme accent color
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type PromptCategory = 
  | 'Semua'
  | 'Coding & Tech'
  | 'Copywriting & Konten'
  | 'Bisnis & Strategi'
  | 'Riset & Analisis'
  | 'Kreatif'
  | 'Produktivitas'
  | 'System Prompt';

export interface PromptVersion {
  timestamp: string;
  content: string;
  note?: string;
}

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  projectId?: string | null; // Belongs to a project or standalone
  description?: string;
  tags: string[];
  variables: string[]; // e.g. ['nama_produk', 'target_audiens']
  category: PromptCategory;
  targetModel?: string; // e.g. 'Claude 3.7 Sonnet', 'Claude 3.5 Haiku', 'General'
  isFavorite: boolean;
  copyCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  versions?: PromptVersion[];
}

export type ViewFilter = 'all' | 'favorites' | 'recent' | 'no-project';

export interface FilterState {
  searchQuery: string;
  projectId: string | null; // null = not filtering by specific project
  view: ViewFilter;
  category: string;
  selectedTag: string | null;
  sortBy: 'updatedAt' | 'copyCount' | 'title' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
