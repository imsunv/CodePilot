"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Search01Icon,
  Notification02Icon,
  FileImportIcon,
  FolderAddIcon,
  FolderOpenIcon,
  MoreVerticalIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePanel } from "@/hooks/usePanel";
import { ConnectionStatus } from "./ConnectionStatus";
import { ImportSessionDialog } from "./ImportSessionDialog";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { OrganizeDropdown, type OrganizeMode, type SortBy } from "./OrganizeDropdown";
import type { ChatSession, Project } from "@/types";

interface ChatListPanelProps {
  open: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

const DATE_GROUP_ORDER = ["Today", "Yesterday", "Last 7 Days", "Older"];

function groupSessionsByDate(
  sessions: ChatSession[]
): Record<string, ChatSession[]> {
  const groups: Record<string, ChatSession[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  for (const session of sessions) {
    const date = new Date(session.updated_at);
    let group: string;
    if (date >= today) group = "Today";
    else if (date >= yesterday) group = "Yesterday";
    else if (date >= lastWeek) group = "Last 7 Days";
    else group = "Older";

    if (!groups[group]) groups[group] = [];
    groups[group].push(session);
  }
  return groups;
}

function sortSessions(sessions: ChatSession[], sortBy: SortBy): ChatSession[] {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(sortBy === "created" ? a.created_at : a.updated_at).getTime();
    const dateB = new Date(sortBy === "created" ? b.created_at : b.updated_at).getTime();
    return dateB - dateA;
  });
}

const MODE_BADGE_CONFIG = {
  code: { label: "Code", className: "bg-blue-500/10 text-blue-500" },
  plan: { label: "Plan", className: "bg-purple-500/10 text-purple-500" },
  ask: { label: "Ask", className: "bg-green-500/10 text-green-500" },
} as const;

function SessionItem({
  session,
  isActive,
  isSessionStreaming,
  needsApproval,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  isSessionStreaming: boolean;
  needsApproval: boolean;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const mode = session.mode || "code";
  const badgeCfg = MODE_BADGE_CONFIG[mode];

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/chat/${session.id}`}
        className={cn(
          "flex flex-col gap-0.5 rounded-lg px-2.5 py-2 transition-all duration-150",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-accent/50"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isSessionStreaming && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
          )}
          <span className="line-clamp-2 text-[13px] font-medium leading-tight break-all">
            {session.title}
          </span>
          {needsApproval && (
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <HugeiconsIcon icon={Notification02Icon} className="h-2.5 w-2.5 text-amber-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium leading-none shrink-0", badgeCfg.className)}>
            {badgeCfg.label}
          </span>
          {session.project_name && (
            <span className="truncate text-[10px] text-muted-foreground/50">
              {session.project_name}
            </span>
          )}
          {session.project_name && (
            <span className="text-muted-foreground/30 text-[10px]">
              ·
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/40 shrink-0">
            {formatRelativeTime(session.updated_at)}
          </span>
        </div>
      </Link>
      {hovered && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-1 top-2 text-muted-foreground/60 hover:text-destructive"
              onClick={(e) => onDelete(e, session.id)}
            >
              <HugeiconsIcon icon={Delete02Icon} className="h-3 w-3" />
              <span className="sr-only">Delete session</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Delete</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function ChatListPanel({ open }: ChatListPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { streamingSessionId, pendingApprovalSessionId, setActiveProjectId, setWorkingDirectory } = usePanel();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [organize, setOrganize] = useState<OrganizeMode>("chronological");
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const s = data.settings || {};
          if (s.chat_list_organize === "project" || s.chat_list_organize === "chronological") {
            setOrganize(s.chat_list_organize);
          }
          if (s.chat_list_sort_by === "created" || s.chat_list_sort_by === "updated") {
            setSortBy(s.chat_list_sort_by);
          }
        }
      } catch {
        // use defaults
      } finally {
        setSettingsLoaded(true);
      }
    })();
  }, []);

  // Save settings when they change
  const saveSettings = useCallback(async (newOrganize: OrganizeMode, newSortBy: SortBy) => {
    try {
      // Read current settings, merge, then write
      const readRes = await fetch("/api/settings");
      let current: Record<string, string> = {};
      if (readRes.ok) {
        const data = await readRes.json();
        current = data.settings || {};
      }
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...current,
            chat_list_organize: newOrganize,
            chat_list_sort_by: newSortBy,
          },
        }),
      });
    } catch {
      // silent
    }
  }, []);

  const handleOrganizeChange = useCallback((mode: OrganizeMode) => {
    setOrganize(mode);
    saveSettings(mode, sortBy);
  }, [sortBy, saveSettings]);

  const handleSortByChange = useCallback((sort: SortBy) => {
    setSortBy(sort);
    saveSettings(organize, sort);
  }, [organize, saveSettings]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // API may not be available yet
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        const projectList: Project[] = data.projects || [];
        setProjects(projectList);
        // Default: expand all projects
        setExpandedProjects((prev) => {
          if (prev.size === 0 && projectList.length > 0) {
            return new Set(projectList.map((p: Project) => p.id));
          }
          return prev;
        });
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchProjects();
  }, [fetchSessions, fetchProjects]);

  // Refresh on navigation
  useEffect(() => {
    fetchSessions();
  }, [pathname, fetchSessions]);

  // Refresh on session/project events
  useEffect(() => {
    const sessionHandler = () => fetchSessions();
    const projectHandler = () => fetchProjects();
    window.addEventListener("session-created", sessionHandler);
    window.addEventListener("session-updated", sessionHandler);
    window.addEventListener("project-created", projectHandler);
    return () => {
      window.removeEventListener("session-created", sessionHandler);
      window.removeEventListener("session-updated", sessionHandler);
      window.removeEventListener("project-created", projectHandler);
    };
  }, [fetchSessions, fetchProjects]);

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    setDeletingSession(sessionId);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (pathname === `/chat/${sessionId}`) {
          router.push("/chat");
        }
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingSession(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Remove this project? Sessions will not be deleted.")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch {
      // silent
    }
  };


  const toggleProject = (projectId: string) => {
    const wasExpanded = expandedProjects.has(projectId);
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
    if (!wasExpanded) {
      setActiveProjectId(projectId);
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setWorkingDirectory(project.working_directory);
      }
    }
  };

  // Filtered sessions for search
  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    const q = searchQuery.toLowerCase();
    if (organize === "project") {
      // Match project name or session title
      return sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.project_name && s.project_name.toLowerCase().includes(q)) ||
          projects.some(
            (p) =>
              p.name.toLowerCase().includes(q) &&
              s.project_id === p.id
          )
      );
    }
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.project_name && s.project_name.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery, organize, projects]);

  // Filtered projects for search
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        filteredSessions.some((s) => s.project_id === p.id)
    );
  }, [projects, searchQuery, filteredSessions]);

  const sortedFilteredSessions = useMemo(
    () => sortSessions(filteredSessions, sortBy),
    [filteredSessions, sortBy]
  );

  const groupedSessions = useMemo(
    () => groupSessionsByDate(sortedFilteredSessions),
    [sortedFilteredSessions]
  );

  if (!open) return null;

  const renderProjectMode = () => {
    if (filteredProjects.length === 0) {
      return (
        <p className="px-2.5 py-3 text-[11px] text-muted-foreground/60">
          {searchQuery ? "No matching projects" : "No projects yet. Create one to get started."}
        </p>
      );
    }

    return filteredProjects.map((project) => {
      const projectSessions = sortSessions(
        filteredSessions.filter((s) => s.project_id === project.id),
        sortBy
      );
      const isExpanded = expandedProjects.has(project.id);

      return (
        <div key={project.id} className="mt-2 first:mt-0">
          <div className="group/project flex items-center gap-1 px-1">
            <button
              onClick={() => toggleProject(project.id)}
              className="flex flex-1 items-center gap-1.5 min-w-0 py-1 px-1.5 rounded hover:bg-accent/50 transition-colors"
            >
              <span className="relative h-3.5 w-3.5 shrink-0">
                <HugeiconsIcon
                  icon={FolderOpenIcon}
                  className="h-3.5 w-3.5 text-muted-foreground absolute inset-0 group-hover/project:opacity-0 transition-opacity"
                />
                <HugeiconsIcon
                  icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                  className="h-3.5 w-3.5 text-muted-foreground absolute inset-0 opacity-0 group-hover/project:opacity-100 transition-opacity"
                />
              </span>
              <span className="text-[13px] font-medium truncate text-sidebar-foreground">
                {project.name}
              </span>
              <span className="text-[11px] text-muted-foreground/40 shrink-0">
                {projectSessions.length}
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover/project:opacity-100 shrink-0 text-muted-foreground/60"
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => setEditingProject(project)}
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isExpanded && (
            <div className="ml-3 mt-0.5 flex flex-col gap-0.5">
              {projectSessions.length === 0 ? (
                <p className="px-2.5 py-1.5 text-[10px] text-muted-foreground/40">
                  No conversations
                </p>
              ) : (
                projectSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={pathname === `/chat/${session.id}`}
                    isSessionStreaming={streamingSessionId === session.id}
                    needsApproval={pendingApprovalSessionId === session.id}
                    onDelete={handleDeleteSession}
                  />
                ))
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const renderChronologicalMode = () => {
    if (sortedFilteredSessions.length === 0) {
      return (
        <p className="px-2.5 py-3 text-[11px] text-muted-foreground/60">
          {searchQuery ? "No matching chats" : "No conversations yet"}
        </p>
      );
    }

    return DATE_GROUP_ORDER.map((group) => {
      const groupSessions = groupedSessions[group];
      if (!groupSessions || groupSessions.length === 0) return null;
      return (
        <div key={group} className="mt-2 first:mt-0">
          <span className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
            {group}
          </span>
          <div className="mt-1 flex flex-col gap-1">
            {groupSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={pathname === `/chat/${session.id}`}
                isSessionStreaming={streamingSessionId === session.id}
                needsApproval={pendingApprovalSessionId === session.id}
                onDelete={handleDeleteSession}
              />
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden bg-sidebar lg:flex">
      {/* Header - extra top padding for macOS traffic lights */}
      <div className="flex h-12 shrink-0 items-center justify-between px-3 mt-5 pl-6">
        <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
          Chats
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setCreateProjectOpen(true)}
              >
                <HugeiconsIcon icon={FolderAddIcon} className="h-3.5 w-3.5" />
                <span className="sr-only">New Project</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New Project</TooltipContent>
          </Tooltip>
          {/* Import CLI Session 按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setImportDialogOpen(true)}
              >
                <HugeiconsIcon icon={FileImportIcon} className="h-3.5 w-3.5" />
                <span className="sr-only">Import CLI Session</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Import CLI Session</TooltipContent>
          </Tooltip>
          <OrganizeDropdown
            organize={organize}
            sortBy={sortBy}
            onOrganizeChange={handleOrganizeChange}
            onSortByChange={handleSortByChange}
          />
          <ConnectionStatus />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Chat sessions list */}
      <ScrollArea className="flex-1 min-h-0 px-3">
        <div className="flex flex-col pb-3">
          {settingsLoaded && (organize === "project" ? renderProjectMode() : renderChronologicalMode())}
        </div>
      </ScrollArea>

      {/* Version */}
      <div className="shrink-0 px-3 py-2 text-center">
        <span className="text-[10px] text-muted-foreground/40">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </span>
      </div>

      {/* Dialogs */}
      <ImportSessionDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreated={(project) => {
          setActiveProjectId(project.id);
          setWorkingDirectory(project.working_directory);
          setExpandedProjects((prev) => new Set([...prev, project.id]));
          router.push("/chat");
        }}
      />
      <CreateProjectDialog
        open={!!editingProject}
        onOpenChange={(open) => { if (!open) setEditingProject(null); }}
        mode="rename"
        project={editingProject ?? undefined}
      />
    </aside>
  );
}
