import { supabase } from '../supabaseClient';
import { Project, PromptItem, UserProfile } from '../types';
import { 
  batchGetSignedUrls, 
  getSignedUrl, 
  deleteFileFromStorage 
} from './storageService';

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
    coverPath: row.cover_path || undefined,
    coverUrl: row.cover_url || undefined,
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
  if (project.coverPath !== undefined) row.cover_path = project.coverPath;
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
    attachmentPath: row.attachment_path || undefined,
    attachmentName: row.attachment_name || undefined,
    attachmentSize: row.attachment_size ? Number(row.attachment_size) : undefined,
    attachmentType: row.attachment_type || undefined,
    attachmentUrl: row.attachment_url || undefined,
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
  if (prompt.attachmentPath !== undefined) row.attachment_path = prompt.attachmentPath;
  if (prompt.attachmentName !== undefined) row.attachment_name = prompt.attachmentName;
  if (prompt.attachmentSize !== undefined) row.attachment_size = prompt.attachmentSize;
  if (prompt.attachmentType !== undefined) row.attachment_type = prompt.attachmentType;
  row.updated_at = new Date().toISOString();
  return row;
}

// ============================================================================
// PROJECTS QUERIES (CRUD)
// ============================================================================

/**
 * Fetch all projects belonging to the authenticated user and attach signed URLs for covers
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

    const projects = (data || []).map(mapProjectFromRow);

    // Retrieve signed URLs for any projects with private cover_path
    const coverPaths = projects.map((p) => p.coverPath).filter(Boolean) as string[];
    if (coverPaths.length > 0) {
      const signedUrls = await batchGetSignedUrls(coverPaths, 3600);
      projects.forEach((p) => {
        if (p.coverPath && signedUrls[p.coverPath]) {
          p.coverUrl = signedUrls[p.coverPath];
        }
      });
    }

    return projects;
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

  const saved = mapProjectFromRow(data);
  if (saved.coverPath) {
    saved.coverUrl = await getSignedUrl(saved.coverPath, 3600) || undefined;
  }
  return saved;
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

  const updated = mapProjectFromRow(data);
  if (updated.coverPath) {
    updated.coverUrl = await getSignedUrl(updated.coverPath, 3600) || undefined;
  }
  return updated;
}

/**
 * Delete a project from Supabase and remove its cover image from Storage if present
 */
export async function deleteUserProject(projectId: string): Promise<void> {
  try {
    // Check if project has an associated cover file in storage
    const { data } = await supabase
      .from('projects')
      .select('cover_path')
      .eq('id', projectId)
      .maybeSingle();

    if (data?.cover_path) {
      await deleteFileFromStorage(data.cover_path);
    }
  } catch (err) {
    console.warn('Storage cleanup warning for project:', err);
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Delete only the cover image from storage and clear cover_path in database
 */
export async function deleteProjectCover(projectId: string, coverPath: string): Promise<void> {
  if (coverPath) {
    await deleteFileFromStorage(coverPath);
  }
  const { error } = await supabase
    .from('projects')
    .update({ cover_path: null, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// PROMPTS QUERIES (CRUD)
// ============================================================================

/**
 * Fetch all prompts belonging to the authenticated user and attach signed URLs for attachments
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

    const prompts = (data || []).map(mapPromptFromRow);

    // Retrieve signed URLs for any prompts with private attachment_path
    const attachmentPaths = prompts.map((p) => p.attachmentPath).filter(Boolean) as string[];
    if (attachmentPaths.length > 0) {
      const signedUrls = await batchGetSignedUrls(attachmentPaths, 3600);
      prompts.forEach((p) => {
        if (p.attachmentPath && signedUrls[p.attachmentPath]) {
          p.attachmentUrl = signedUrls[p.attachmentPath];
        }
      });
    }

    return prompts;
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

  const saved = mapPromptFromRow(data);
  if (saved.attachmentPath) {
    saved.attachmentUrl = await getSignedUrl(saved.attachmentPath, 3600) || undefined;
  }
  return saved;
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

  const savedList = (data || []).map(mapPromptFromRow);
  const attachmentPaths = savedList.map((p) => p.attachmentPath).filter(Boolean) as string[];
  if (attachmentPaths.length > 0) {
    const signedUrls = await batchGetSignedUrls(attachmentPaths, 3600);
    savedList.forEach((p) => {
      if (p.attachmentPath && signedUrls[p.attachmentPath]) {
        p.attachmentUrl = signedUrls[p.attachmentPath];
      }
    });
  }

  return savedList;
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

  const updated = mapPromptFromRow(data);
  if (updated.attachmentPath) {
    updated.attachmentUrl = await getSignedUrl(updated.attachmentPath, 3600) || undefined;
  }
  return updated;
}

/**
 * Delete a prompt from Supabase and remove its attachment from Storage if present
 */
export async function deleteUserPrompt(promptId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('prompts')
      .select('attachment_path')
      .eq('id', promptId)
      .maybeSingle();

    if (data?.attachment_path) {
      await deleteFileFromStorage(data.attachment_path);
    }
  } catch (err) {
    console.warn('Storage cleanup warning for prompt attachment:', err);
  }

  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Delete only the attachment from storage and clear attachment fields in database
 */
export async function deletePromptAttachment(promptId: string, attachmentPath: string): Promise<void> {
  if (attachmentPath) {
    await deleteFileFromStorage(attachmentPath);
  }

  const { error } = await supabase
    .from('prompts')
    .update({
      attachment_path: null,
      attachment_name: null,
      attachment_size: null,
      attachment_type: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', promptId);

  if (error) {
    throw new Error(error.message);
  }
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

// ============================================================================
// USER AVATAR / PROFILE STORAGE
// ============================================================================

/**
 * Update user avatar path in Supabase Auth user_metadata
 */
export async function updateUserAvatar(userId: string, avatarPath: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({
    data: { avatar_path: avatarPath },
  });

  if (error) {
    throw new Error(error.message);
  }

  return await getSignedUrl(avatarPath, 3600);
}

/**
 * Delete user avatar from Storage and clear avatar_path in user_metadata
 */
export async function deleteUserAvatar(userId: string, avatarPath: string): Promise<void> {
  if (avatarPath) {
    await deleteFileFromStorage(avatarPath);
  }

  const { error } = await supabase.auth.updateUser({
    data: { avatar_path: null },
  });

  if (error) {
    throw new Error(error.message);
  }
}
