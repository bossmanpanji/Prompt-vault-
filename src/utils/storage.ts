import { Project, PromptItem } from '../types';
import { INITIAL_PROJECTS, INITIAL_PROMPTS } from '../data/initialData';
import { extractVariables } from './variableDetector';

const STORAGE_KEYS = {
  PROJECTS: 'promptvault_projects_v1',
  PROMPTS: 'promptvault_prompts_v1',
  THEME: 'promptvault_theme_v1',
};

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PROJECTS;
  } catch (e) {
    console.error('Failed to load projects from storage', e);
    return INITIAL_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects', e);
  }
}

export function loadPrompts(): PromptItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMPTS);
    if (!raw) {
      savePrompts(INITIAL_PROMPTS);
      return INITIAL_PROMPTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PROMPTS;
  } catch (e) {
    console.error('Failed to load prompts from storage', e);
    return INITIAL_PROMPTS;
  }
}

export function savePrompts(prompts: PromptItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  } catch (e) {
    console.error('Failed to save prompts', e);
  }
}

/**
 * Export all data to a JSON backup file for download
 */
export function exportBackupJSON(projects: Project[], prompts: PromptItem[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    appName: 'PromptVault',
    version: '1.0',
    projects,
    prompts,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PromptVault_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export prompts as a clean Markdown bundle
 */
export function exportPromptsMarkdown(prompts: PromptItem[], projects: Project[]): void {
  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  
  let md = `# PromptVault - Kumpulan Prompt\nDiekspor pada: ${new Date().toLocaleDateString('id-ID')}\n\n---\n\n`;

  prompts.forEach((p, idx) => {
    const projName = p.projectId ? projectMap.get(p.projectId) || 'Proyek Lain' : 'Tanpa Proyek';
    md += `## ${idx + 1}. ${p.title}\n`;
    md += `**Proyek:** ${projName} | **Kategori:** ${p.category} | **Salin:** ${p.copyCount}x\n\n`;
    if (p.description) {
      md += `*Deskripsi: ${p.description}*\n\n`;
    }
    if (p.tags && p.tags.length > 0) {
      md += `**Tag:** ${p.tags.join(', ')}\n\n`;
    }
    md += `\`\`\`\n${p.content}\n\`\`\`\n\n---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PromptVault_Prompts_${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse an uploaded text file (.txt or .md)
 * Automatically detects title from first line or filename
 */
export function parseTextFileContent(filename: string, rawText: string): {
  title: string;
  description: string;
  content: string;
  variables: string[];
} {
  const lines = rawText.split('\n');
  let title = filename.replace(/\.(txt|md|markdown)$/i, '').replace(/[-_]/g, ' ');
  let description = '';
  let content = rawText;

  // If first line starts with # or is short, use it as title
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.startsWith('# ')) {
      title = firstLine.replace(/^#+\s*/, '').trim();
      content = lines.slice(1).join('\n').trim();
    } else if (firstLine.length > 0 && firstLine.length < 80 && lines.length > 2 && lines[1].trim() === '') {
      title = firstLine;
      content = lines.slice(2).join('\n').trim();
    }
  }

  // Check if second line is a blockquote or italic description
  const contentLines = content.split('\n');
  if (contentLines.length > 0) {
    const maybeDesc = contentLines[0].trim();
    if (maybeDesc.startsWith('>') || (maybeDesc.startsWith('*') && maybeDesc.endsWith('*'))) {
      description = maybeDesc.replace(/^>\s*|\*/g, '').trim();
      content = contentLines.slice(1).join('\n').trim();
    }
  }

  const variables = extractVariables(content);

  return {
    title,
    description,
    content,
    variables,
  };
}
