import { supabase } from '../supabaseClient';
import { Project, PromptItem } from '../types';

/**
 * Helper to convert Supabase row (snake_case) to Project (camelCase)
 */
export function mapProjectFromRow(row: any): Project {
  return {
    id: row.id,
    name: row.name || 'Untitled Project',
    description: row.description || '',
    customInstructions: row.custom_instructions || '',
    color: row.color || '#cc785c',
    icon: row.icon || 'Folder',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Helper to convert Project to Supabase row payload
 */
export function mapProjectToRow(project: Partial<Project>, userId?: string) {
  const row: Record<string, any> = {};
  if (project.id) row.id = project.id;
  if (userId) row.user_id = userId;
  if (project.name !== undefined) row.name = project.name;
  if (project.description !== undefined) row.description = project.description;
  if (project.customInstructions !== undefined) row.custom_instructions = project.customInstructions;
  if (project.color !== undefined) row.color = project.color;
  if (project.icon !== undefined) row.icon = project.icon;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Helper to convert Supabase row (snake_case) to PromptItem (camelCase)
 */
export function mapPromptFromRow(row: any): PromptItem {
  return {
    id: row.id,
    title: row.title || 'Untitled Prompt',
    content: row.content || '',
    projectId: row.project_id || null,
    description: row.description || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    variables: Array.isArray(row.variables) ? row.variables : [],
    category: row.category || 'Coding & Tech',
    targetModel: row.target_model || 'Claude 3.7 Sonnet',
    isFavorite: Boolean(row.is_favorite),
    copyCount: Number(row.copy_count) || 0,
    lastUsedAt: row.last_used_at || undefined,
    versions: Array.isArray(row.versions) ? row.versions : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Helper to convert PromptItem to Supabase row payload
 */
export function mapPromptToRow(prompt: Partial<PromptItem>, userId?: string) {
  const row: Record<string, any> = {};
  if (prompt.id) row.id = prompt.id;
  if (userId) row.user_id = userId;
  if (prompt.title !== undefined) row.title = prompt.title;
  if (prompt.content !== undefined) row.content = prompt.content;
  if (prompt.projectId !== undefined) row.project_id = prompt.projectId;
  if (prompt.description !== undefined) row.description = prompt.description;
  if (prompt.tags !== undefined) row.tags = prompt.tags;
  if (prompt.variables !== undefined) row.variables = prompt.variables;
  if (prompt.category !== undefined) row.category = prompt.category;
  if (prompt.targetModel !== undefined) row.target_model = prompt.targetModel;
  if (prompt.isFavorite !== undefined) row.is_favorite = prompt.isFavorite;
  if (prompt.copyCount !== undefined) row.copy_count = prompt.copyCount;
  if (prompt.lastUsedAt !== undefined) row.last_used_at = prompt.lastUsedAt;
  if (prompt.versions !== undefined) row.versions = prompt.versions;
  row.updated_at = new Date().toISOString();
  return row;
}

// ============================================================================
// PROJECTS QUERIES (CRUD)
// ============================================================================

/**
 * Fetch all projects belonging to the authenticated user
 */
export async function fetchUserProjects(userId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchUserProjects warning:', error.message);
      return [];
    }
    return (data || []).map(mapProjectFromRow);
  } catch (err) {
    console.error('fetchUserProjects error:', err);
    return [];
  }
}

/**
 * Insert a new project in Supabase
 */
export async function createUserProject(project: Partial<Project>, userId: string): Promise<Project> {
  const payload = mapProjectToRow(project, userId);
  if (!payload.id) {
    payload.id = 'proj-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6);
  }
  payload.created_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapProjectFromRow(data);
}

/**
 * Update an existing project in Supabase
 */
export async function updateUserProject(projectId: string, project: Partial<Project>): Promise<Project> {
  const payload = mapProjectToRow(project);

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapProjectFromRow(data);
}

/**
 * Delete a project from Supabase
 */
export async function deleteUserProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// PROMPTS QUERIES (CRUD)
// ============================================================================

/**
 * Fetch all prompts belonging to the authenticated user
 */
export async function fetchUserPrompts(userId: string): Promise<PromptItem[]> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchUserPrompts warning:', error.message);
      return [];
    }
    return (data || []).map(mapPromptFromRow);
  } catch (err) {
    console.error('fetchUserPrompts error:', err);
    return [];
  }
}

/**
 * Insert a new prompt in Supabase
 */
export async function createUserPrompt(prompt: Partial<PromptItem>, userId: string): Promise<PromptItem> {
  const payload = mapPromptToRow(prompt, userId);
  if (!payload.id) {
    payload.id = 'prompt-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6);
  }
  payload.created_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('prompts')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapPromptFromRow(data);
}

/**
 * Batch insert prompts (e.g. for import file / bulk save)
 */
export async function batchCreateUserPrompts(prompts: Partial<PromptItem>[], userId: string): Promise<PromptItem[]> {
  const rows = prompts.map((item, idx) => {
    const row = mapPromptToRow(item, userId);
    if (!row.id) {
      row.id = `prompt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    }
    row.created_at = new Date().toISOString();
    return row;
  });

  const { data, error } = await supabase
    .from('prompts')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(mapPromptFromRow);
}

/**
 * Update an existing prompt in Supabase
 */
export async function updateUserPrompt(promptId: string, prompt: Partial<PromptItem>): Promise<PromptItem> {
  const payload = mapPromptToRow(prompt);

  const { data, error } = await supabase
    .from('prompts')
    .update(payload)
    .eq('id', promptId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapPromptFromRow(data);
}

/**
 * Toggle favorite status in Supabase
 */
export async function toggleUserPromptFavorite(promptId: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', promptId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Increment copy count & record last_used_at in Supabase
 */
export async function recordPromptCopy(promptId: string, newCount: number): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .update({
      copy_count: newCount,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', promptId);

  if (error) {
    console.warn('Failed to record copy count in Supabase:', error.message);
  }
}

/**
 * Delete a prompt from Supabase
 */
export async function deleteUserPrompt(promptId: string): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId);

  if (error) {
    throw new Error(error.message);
  }
}
