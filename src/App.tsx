import React, { useState, useEffect, useMemo } from 'react';
import { 
  loadProjects, 
  saveProjects, 
  loadPrompts, 
  savePrompts, 
  loadUser,
  saveUser,
  clearUser,
  exportBackupJSON, 
  exportPromptsMarkdown 
} from './utils/storage';
import { Project, PromptItem, ViewFilter, UserProfile } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProjectBanner } from './components/ProjectBanner';
import { PromptCard } from './components/PromptCard';
import { PromptRunnerModal } from './components/PromptRunnerModal';
import { PromptEditorModal } from './components/PromptEditorModal';
import { FileUploadModal } from './components/FileUploadModal';
import { ProjectEditorModal } from './components/ProjectEditorModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { supabase } from './supabaseClient';
import { 
  fetchUserProjects, 
  fetchUserPrompts, 
  createUserProject, 
  updateUserProject, 
  deleteUserProject, 
  createUserPrompt, 
  batchCreateUserPrompts, 
  updateUserPrompt, 
  toggleUserPromptFavorite, 
  recordPromptCopy, 
  deleteUserPrompt 
} from './services/supabaseService';
import { INITIAL_PROJECTS, INITIAL_PROMPTS } from './data/initialData';
import { 
  Sparkles, 
  Plus, 
  Upload, 
  SearchX, 
  FolderPlus, 
  Layers, 
  Star 
} from 'lucide-react';

export default function App() {
  // --- Persistent State ---
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [prompts, setPrompts] = useState<PromptItem[]>(() => loadPrompts());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('promptvault_theme') === 'dark' || 
      (!('promptvault_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // --- Navigation & Filter State ---
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'copyCount' | 'title' | 'createdAt'>('updatedAt');

  // --- Mobile & Responsive Sidebar State ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsDesktopSidebarCollapsed((prev) => !prev);
    }
  };

  // --- Modal States ---
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [runnerPrompt, setRunnerPrompt] = useState<PromptItem | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(() => loadUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  // Sync route pathname on browser popstate navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Toast Messages ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (newUser: UserProfile, message: string) => {
    setUser(newUser);
    saveUser(newUser);
    if (window.location.pathname === '/login') {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    }
    setIsLoginModalOpen(false);
    addToast(message, 'success');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
    clearUser();
    window.history.pushState({}, '', '/login');
    setCurrentPath('/login');
    setIsLoginModalOpen(true);
    addToast('Anda telah keluar dari akun.', 'info');
  };

  // Protect private pages with supabase.auth.getSession() — if no session, redirect to /login
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (!session) {
          // No session: Protect private pages -> redirect to /login
          setUser(null);
          clearUser();
          if (window.location.pathname !== '/login') {
            window.history.pushState({}, '', '/login');
            setCurrentPath('/login');
          }
          setIsLoginModalOpen(true);
        } else {
          // Real session exists: grant access to private pages
          const authUser = session.user;
          const displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
          const profile: UserProfile = {
            id: authUser.id,
            name: displayName,
            email: authUser.email || '',
            provider: 'email',
            createdAt: authUser.created_at,
          };
          setUser(profile);
          saveUser(profile);

          // If currently on /login, redirect to /
          if (window.location.pathname === '/login') {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }
          setIsLoginModalOpen(false);
        }
      } catch (err) {
        console.error('Session check failed', err);
        if (window.location.pathname !== '/login') {
          window.history.pushState({}, '', '/login');
          setCurrentPath('/login');
        }
        setIsLoginModalOpen(true);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    verifySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session) {
        setUser(null);
        clearUser();
        if (window.location.pathname !== '/login') {
          window.history.pushState({}, '', '/login');
          setCurrentPath('/login');
        }
        setIsLoginModalOpen(true);
      } else {
        const authUser = session.user;
        const displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
        const profile: UserProfile = {
          id: authUser.id,
          name: displayName,
          email: authUser.email || '',
          provider: 'email',
          createdAt: authUser.created_at,
        };
        setUser(profile);
        saveUser(profile);

        if (window.location.pathname === '/login') {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }
        setIsLoginModalOpen(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch real data from Supabase whenever user is authenticated
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    const loadUserData = async () => {
      try {
        const [dbProjects, dbPrompts] = await Promise.all([
          fetchUserProjects(user.id),
          fetchUserPrompts(user.id)
        ]);

        if (!isMounted) return;

        if (dbProjects.length > 0 || dbPrompts.length > 0) {
          setProjects(dbProjects);
          setPrompts(dbPrompts);
        } else {
          // If this is a new Supabase user, seed starter data into Supabase
          try {
            const seededProjects = await Promise.all(
              INITIAL_PROJECTS.map(p => createUserProject(p, user.id))
            );
            const seededPrompts = await Promise.all(
              INITIAL_PROMPTS.map(pr => createUserPrompt(pr, user.id))
            );
            if (isMounted) {
              setProjects(seededProjects);
              setPrompts(seededPrompts);
            }
          } catch (seedErr) {
            console.warn('Initial seed to Supabase deferred, using local starter data:', seedErr);
            setProjects(INITIAL_PROJECTS);
            setPrompts(INITIAL_PROMPTS);
          }
        }
      } catch (err) {
        console.error('Failed to load user data from Supabase:', err);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('promptvault_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('promptvault_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync projects and prompts to local storage
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    savePrompts(prompts);
  }, [prompts]);

  // Keyboard shortcut: Cmd+N or Ctrl+N to create new prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isPromptEditorOpen && !isUploadOpen && !isProjectEditorOpen) {
        e.preventDefault();
        setEditingPrompt(null);
        setIsPromptEditorOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPromptEditorOpen, isUploadOpen, isProjectEditorOpen]);

  // Active Project object if selected
  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  // --- Filter and Search Computation ---
  const filteredPrompts = useMemo(() => {
    return prompts
      .filter((p) => {
        // Project filter
        if (activeProjectId) {
          if (p.projectId !== activeProjectId) return false;
        } else {
          // If viewing specific view filter
          if (activeView === 'favorites' && !p.isFavorite) return false;
          if (activeView === 'no-project' && p.projectId) return false;
        }

        // Category filter
        if (selectedCategory !== 'Semua' && p.category !== selectedCategory) {
          return false;
        }

        // Tag filter
        if (selectedTag && !p.tags?.includes(selectedTag)) {
          return false;
        }

        // Search Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchContent = p.content.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          const matchVars = p.variables?.some((v) => v.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchDesc && !matchTags && !matchVars) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'copyCount') return b.copyCount - a.copyCount;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        // default: updatedAt
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [prompts, activeProjectId, activeView, selectedCategory, selectedTag, searchQuery, sortBy]);

  // --- Handlers ---
  const handleCopyPrompt = async (prompt: PromptItem) => {
    navigator.clipboard.writeText(prompt.content);
    const newCount = prompt.copyCount + 1;
    // Update locally immediately for instant UX feedback
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id
          ? {
              ...p,
              copyCount: newCount,
              lastUsedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    addToast(`Prompt "${prompt.title}" disalin ke clipboard!`, 'success');

    // Persist to Supabase
    if (user?.id) {
      recordPromptCopy(prompt.id, newCount).catch(console.error);
    }
  };

  const handleCopyTextDirect = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} disalin ke clipboard!`, 'success');
  };

  const handleToggleFavorite = async (id: string) => {
    const target = prompts.find((p) => p.id === id);
    if (!target) return;
    const newStatus = !target.isFavorite;

    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: newStatus, updatedAt: new Date().toISOString() } : p))
    );
    addToast(newStatus ? `"${target.title}" ditambahkan ke Favorit.` : `"${target.title}" dihapus dari Favorit.`, 'info');

    if (user?.id) {
      toggleUserPromptFavorite(id, newStatus).catch(console.error);
    }
  };

  const handleSavePrompt = async (data: Partial<PromptItem>) => {
    if (editingPrompt) {
      // Update existing prompt in Supabase & local state
      try {
        if (user?.id) {
          const updated = await updateUserPrompt(editingPrompt.id, data);
          setPrompts((prev) => prev.map((p) => (p.id === editingPrompt.id ? updated : p)));
        } else {
          setPrompts((prev) =>
            prev.map((p) => (p.id === editingPrompt.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p))
          );
        }
        addToast(`Prompt "${data.title}" berhasil diperbarui!`, 'success');
      } catch (err: any) {
        console.error('Update prompt error:', err);
        setPrompts((prev) =>
          prev.map((p) => (p.id === editingPrompt.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p))
        );
        addToast(`Prompt "${data.title}" berhasil diperbarui!`, 'success');
      }
    } else {
      // Create new prompt in Supabase & local state
      try {
        if (user?.id) {
          const created = await createUserPrompt(
            {
              ...data,
              projectId: data.projectId || activeProjectId || null,
            },
            user.id
          );
          setPrompts((prev) => [created, ...prev]);
          addToast(`Prompt "${created.title}" berhasil dibuat!`, 'success');
        } else {
          const newPrompt: PromptItem = {
            id: 'prompt-' + Date.now().toString(),
            title: data.title || 'Prompt Baru',
            content: data.content || '',
            projectId: data.projectId || activeProjectId || null,
            description: data.description || '',
            tags: data.tags || [],
            variables: data.variables || [],
            category: data.category || 'Coding & Tech',
            targetModel: data.targetModel || 'Claude 3.7 Sonnet',
            isFavorite: false,
            copyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setPrompts((prev) => [newPrompt, ...prev]);
          addToast(`Prompt "${newPrompt.title}" berhasil dibuat!`, 'success');
        }
      } catch (err: any) {
        console.error('Create prompt error:', err);
        const newPrompt: PromptItem = {
          id: 'prompt-' + Date.now().toString(),
          title: data.title || 'Prompt Baru',
          content: data.content || '',
          projectId: data.projectId || activeProjectId || null,
          description: data.description || '',
          tags: data.tags || [],
          variables: data.variables || [],
          category: data.category || 'Coding & Tech',
          targetModel: data.targetModel || 'Claude 3.7 Sonnet',
          isFavorite: false,
          copyCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPrompts((prev) => [newPrompt, ...prev]);
        addToast(`Prompt "${newPrompt.title}" berhasil dibuat!`, 'success');
      }
    }
    setEditingPrompt(null);
  };

  const handleBatchSavePrompts = async (batch: Partial<PromptItem>[]) => {
    try {
      if (user?.id) {
        const createdBatch = await batchCreateUserPrompts(
          batch.map((b) => ({ ...b, projectId: b.projectId || activeProjectId || null })),
          user.id
        );
        setPrompts((prev) => [...createdBatch, ...prev]);
        addToast(`${createdBatch.length} prompt berhasil diimpor!`, 'success');
      } else {
        const newItems: PromptItem[] = batch.map((item, idx) => ({
          id: `prompt-${Date.now()}-${idx}`,
          title: item.title || `Prompt ${idx + 1}`,
          content: item.content || '',
          projectId: item.projectId || activeProjectId || null,
          description: item.description || '',
          tags: item.tags || ['imported'],
          variables: item.variables || [],
          category: item.category || 'Coding & Tech',
          targetModel: 'Claude 3.7 Sonnet',
          isFavorite: false,
          copyCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setPrompts((prev) => [...newItems, ...prev]);
        addToast(`${newItems.length} prompt berhasil diimpor!`, 'success');
      }
    } catch (err: any) {
      console.error('Batch save error:', err);
      const newItems: PromptItem[] = batch.map((item, idx) => ({
        id: `prompt-${Date.now()}-${idx}`,
        title: item.title || `Prompt ${idx + 1}`,
        content: item.content || '',
        projectId: item.projectId || activeProjectId || null,
        description: item.description || '',
        tags: item.tags || ['imported'],
        variables: item.variables || [],
        category: item.category || 'Coding & Tech',
        targetModel: 'Claude 3.7 Sonnet',
        isFavorite: false,
        copyCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setPrompts((prev) => [...newItems, ...prev]);
      addToast(`${newItems.length} prompt berhasil diimpor!`, 'success');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    addToast('Prompt berhasil dihapus.', 'info');
    if (user?.id) {
      deleteUserPrompt(id).catch(console.error);
    }
  };

  const handleSaveProject = async (data: Partial<Project>) => {
    if (editingProject) {
      try {
        if (user?.id) {
          const updated = await updateUserProject(editingProject.id, data);
          setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? updated : p)));
        } else {
          setProjects((prev) =>
            prev.map((p) => (p.id === editingProject.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p))
          );
        }
        addToast(`Proyek "${data.name}" berhasil diperbarui!`, 'success');
      } catch (err: any) {
        console.error('Update project error:', err);
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p))
        );
        addToast(`Proyek "${data.name}" berhasil diperbarui!`, 'success');
      }
    } else {
      try {
        if (user?.id) {
          const created = await createUserProject(data, user.id);
          setProjects((prev) => [...prev, created]);
          setActiveProjectId(created.id);
          addToast(`Proyek "${created.name}" berhasil dibuat!`, 'success');
        } else {
          const newProject: Project = {
            id: 'proj-' + Date.now().toString(),
            name: data.name || 'Proyek Baru',
            description: data.description || '',
            customInstructions: data.customInstructions || '',
            color: data.color || '#cc785c',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setProjects((prev) => [...prev, newProject]);
          setActiveProjectId(newProject.id);
          addToast(`Proyek "${newProject.name}" berhasil dibuat!`, 'success');
        }
      } catch (err: any) {
        console.error('Create project error:', err);
        const newProject: Project = {
          id: 'proj-' + Date.now().toString(),
          name: data.name || 'Proyek Baru',
          description: data.description || '',
          customInstructions: data.customInstructions || '',
          color: data.color || '#cc785c',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProjects((prev) => [...prev, newProject]);
        setActiveProjectId(newProject.id);
        addToast(`Proyek "${newProject.name}" berhasil dibuat!`, 'success');
      }
    }
    setEditingProject(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    // Unassign prompts that belonged to this project locally
    setPrompts((prev) => prev.map((p) => (p.projectId === projectId ? { ...p, projectId: null } : p)));
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setActiveView('all');
    }
    addToast('Proyek berhasil dihapus. Prompt di dalamnya dipindahkan ke "Tanpa Proyek".', 'info');

    if (user?.id) {
      deleteUserProject(projectId).catch(console.error);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#faf9f5] dark:bg-[#181716] text-[#1f1e1d] dark:text-[#f0eee6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#faece7] dark:bg-[#38251e] border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c] animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#84817a] font-medium">Memeriksa sesi pengguna...</div>
        </div>
      </div>
    );
  }

  // If user is unauthenticated or on /login, render the dedicated Login view
  if (!user || currentPath === '/login') {
    return (
      <div className="min-h-screen w-full bg-[#faf9f5] dark:bg-[#181716] flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          onClose={() => {}}
          onLoginSuccess={handleLoginSuccess}
          canClose={false}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#faf9f5] dark:bg-[#181716] text-[#1f1e1d] dark:text-[#f0eee6]">
      {/* Claude Style Left Sidebar */}
      <Sidebar
        projects={projects}
        prompts={prompts}
        activeProjectId={activeProjectId}
        activeView={activeView}
        selectedTag={selectedTag}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsedDesktop={isDesktopSidebarCollapsed}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setActiveView('all');
        }}
        onSelectView={(view) => {
          setActiveView(view);
          setActiveProjectId(null);
        }}
        onSelectTag={setSelectedTag}
        onNewPrompt={() => {
          setEditingPrompt(null);
          setIsPromptEditorOpen(true);
        }}
        onNewProject={() => {
          setEditingProject(null);
          setIsProjectEditorOpen(true);
        }}
        onEditProject={(proj) => {
          setEditingProject(proj);
          setIsProjectEditorOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onExportBackup={() => exportBackupJSON(projects, prompts)}
        onExportMarkdown={() => exportPromptsMarkdown(prompts, projects)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          activeProject={activeProject}
          activeView={activeView}
          selectedTag={selectedTag}
          onClearTag={() => setSelectedTag(null)}
          onNewPrompt={() => {
            setEditingPrompt(null);
            setIsPromptEditorOpen(true);
          }}
          onOpenUpload={() => setIsUploadOpen(true)}
          onToggleSidebar={handleToggleSidebar}
          user={user}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onExportData={() => exportBackupJSON(projects, prompts)}
          totalPrompts={prompts.length}
          totalProjects={projects.length}
        />

        {/* Project Context Banner (shown when a project is selected) */}
        {activeProject && (
          <ProjectBanner
            project={activeProject}
            prompts={filteredPrompts}
            onEditProject={() => {
              setEditingProject(activeProject);
              setIsProjectEditorOpen(true);
            }}
            onNewPromptInProject={() => {
              setEditingPrompt(null);
              setIsPromptEditorOpen(true);
            }}
            onUploadInProject={() => setIsUploadOpen(true)}
            onCopyText={handleCopyTextDirect}
          />
        )}

        {/* Prompts Scroll View */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* View Title & Quick Summary */}
            {!activeProject && (
              <div className="flex items-center justify-between pb-2 border-b border-[#e5e3da]/60 dark:border-[#33312c]/60">
                <div>
                  <h1 className="font-serif-claude text-2xl font-bold tracking-tight text-[#1f1e1d] dark:text-[#f0eee6]">
                    {activeView === 'favorites'
                      ? 'Prompt Favorit'
                      : activeView === 'no-project'
                      ? 'Prompt Tanpa Proyek'
                      : 'Semua Koleksi Prompt'}
                  </h1>
                  <p className="text-xs text-[#84817a] dark:text-[#78756e] mt-0.5">
                    {activeView === 'favorites'
                      ? 'Prompt penting yang sering Anda pakai kembali'
                      : 'Cari, salin langsung, atau isi variabel parameter'}
                  </p>
                </div>

                <div className="text-xs text-[#84817a] dark:text-[#78756e] font-mono tabular-nums">
                  Menampilkan {filteredPrompts.length} dari {prompts.length} prompt
                </div>
              </div>
            )}

            {/* Prompt Cards Grid */}
            {filteredPrompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                {filteredPrompts.map((prompt) => {
                  const proj = projects.find((p) => p.id === prompt.projectId) || null;
                  return (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      project={proj}
                      onCopy={handleCopyPrompt}
                      onOpenRunner={(p) => {
                        setRunnerPrompt(p);
                        setIsRunnerOpen(true);
                      }}
                      onEdit={(p) => {
                        setEditingPrompt(p);
                        setIsPromptEditorOpen(true);
                      }}
                      onDelete={handleDeletePrompt}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectTag={(tag) => setSelectedTag(tag)}
                    />
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="py-16 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#faf9f5] dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] flex items-center justify-center mx-auto text-[#cc785c]">
                  {searchQuery ? (
                    <SearchX className="w-6 h-6" />
                  ) : activeProject ? (
                    <FolderPlus className="w-6 h-6" />
                  ) : (
                    <Sparkles className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif-claude text-base font-bold text-[#1f1e1d] dark:text-[#f0eee6]">
                    {searchQuery
                      ? 'Tidak ada prompt yang cocok'
                      : activeProject
                      ? `Belum ada prompt di proyek "${activeProject.name}"`
                      : 'Belum ada prompt'}
                  </h3>
                  <p className="text-xs text-[#84817a] dark:text-[#78756e]">
                    {searchQuery
                      ? `Tidak ditemukan hasil untuk "${searchQuery}". Coba kata kunci lain atau reset filter.`
                      : 'Tambahkan prompt pertamamu dengan mengetik langsung atau upload file teks.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Semua');
                        setSelectedTag(null);
                      }}
                      className="px-4 py-2 text-xs font-medium bg-[#faf9f5] dark:bg-[#282622] border border-[#e5e3da] dark:border-[#363430] hover:bg-[#eeebe3] rounded-xl transition-colors cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white dark:bg-[#282622] hover:bg-[#faf9f5] border border-[#e5e3da] dark:border-[#363430] rounded-xl transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>Upload File</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrompt(null);
                          setIsPromptEditorOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#cc785c] hover:bg-[#b5674c] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat Prompt</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- Modals --- */}
      {/* 1. Prompt Runner / Variable Replacer Modal */}
      <PromptRunnerModal
        prompt={runnerPrompt}
        project={projects.find((p) => p.id === runnerPrompt?.projectId) || null}
        isOpen={isRunnerOpen}
        onClose={() => {
          setIsRunnerOpen(false);
          setRunnerPrompt(null);
        }}
        onCopySuccess={(text, title) => {
          if (runnerPrompt) {
            // increment copy count
            setPrompts((prev) =>
              prev.map((p) =>
                p.id === runnerPrompt.id
                  ? { ...p, copyCount: p.copyCount + 1, lastUsedAt: new Date().toISOString() }
                  : p
              )
            );
          }
          addToast(`Prompt "${title}" disalin ke clipboard!`, 'success');
        }}
        onEditPrompt={(prompt) => {
          setEditingPrompt(prompt);
          setIsPromptEditorOpen(true);
        }}
      />

      {/* 2. Prompt Editor Modal (Create / Edit) */}
      <PromptEditorModal
        isOpen={isPromptEditorOpen}
        onClose={() => {
          setIsPromptEditorOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        promptToEdit={editingPrompt}
        projects={projects}
        defaultProjectId={activeProjectId}
      />

      {/* 3. File Upload / Paste Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSavePrompt={handleSavePrompt}
        onBatchSavePrompts={handleBatchSavePrompts}
        projects={projects}
        activeProjectId={activeProjectId}
      />

      {/* 4. Project Editor Modal (Create / Edit) */}
      <ProjectEditorModal
        isOpen={isProjectEditorOpen}
        onClose={() => {
          setIsProjectEditorOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        projectToEdit={editingProject}
      />

      {/* 5. Login / Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || currentPath === '/login' || !user}
        onClose={() => {
          if (user && currentPath !== '/login') {
            setIsLoginModalOpen(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
        canClose={!!user && currentPath !== '/login'}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
