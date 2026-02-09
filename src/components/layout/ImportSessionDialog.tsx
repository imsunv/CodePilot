"use client";

import { useState, useEffect, useCallback, useRef, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Loading02Icon,
  FolderOpenIcon,
  GitBranchIcon,
  ClockIcon,
  FileImportIcon,
  MessageAddIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ClaudeSessionInfo {
  sessionId: string;
  projectPath: string;
  projectName: string;
  cwd: string;
  gitBranch: string;
  version: string;
  preview: string;
  userMessageCount: number;
  assistantMessageCount: number;
  createdAt: string;
  updatedAt: string;
  fileSize: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

interface ImportSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportSessionDialog({
  open,
  onOpenChange,
}: ImportSessionDialogProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ClaudeSessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });

  // 虚拟滚动 ref
  const parentRef = useRef<HTMLDivElement>(null);
  // 无限滚动哨兵 ref
  const lastItemRef = useRef<HTMLDivElement>(null);
  // pagination ref 用于避免依赖问题
  const paginationRef = useRef<PaginationInfo>(pagination);

  // 同步 pagination 到 ref
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  // 搜索防抖
  const debouncedSearch = useDeferredValue(searchQuery);

  const fetchSessions = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setSessions([]);
      setPagination({ currentPage: 1, totalPages: 1, totalCount: 0, hasMore: false });
    } else {
      setLoadingMore(true);
    }

    setError(null);
    try {
      const page = reset ? 1 : paginationRef.current.currentPage + 1;
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const res = await fetch(`/api/claude-sessions?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch sessions");
      }
      const data = await res.json();

      setSessions(prev => reset ? data.sessions : [...prev, ...data.sessions]);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch]);

  // 监听搜索变化和对话框打开
  useEffect(() => {
    if (open) {
      fetchSessions(true);
    }
  }, [debouncedSearch, open, fetchSessions]);

  // 无限滚动监听器
  useEffect(() => {
    if (!lastItemRef.current || !pagination.hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !loadingMore) {
          fetchSessions(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(lastItemRef.current);
    return () => observer.disconnect();
  }, [pagination.hasMore, loadingMore, fetchSessions]);

  // 虚拟滚动器
  const virtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const handleImport = async (sessionId: string) => {
    setImporting(sessionId);
    setError(null);
    try {
      const res = await fetch("/api/claude-sessions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (res.status === 409 && data.existingSessionId) {
        // Already imported — navigate to the existing session
        onOpenChange(false);
        router.push(`/chat/${data.existingSessionId}`);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to import session");
      }

      // Navigate to the newly imported session
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent("session-created"));
      window.dispatchEvent(new CustomEvent("project-created"));
      router.push(`/chat/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import session");
    } finally {
      setImporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={FileImportIcon}
              className="h-5 w-5 text-primary"
            />
            Import CLI Session
          </DialogTitle>
          <DialogDescription>
            Browse and import conversations from Claude Code CLI. Imported
            sessions can be resumed in CodePilot.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by project, message, or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Session List */}
        <div
          ref={parentRef}
          className="flex-1 min-h-0 -mx-6 px-6 overflow-y-auto"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <HugeiconsIcon
                icon={Loading02Icon}
                className="h-5 w-5 animate-spin text-muted-foreground"
              />
              <span className="ml-2 text-sm text-muted-foreground">
                Scanning CLI sessions...
              </span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <HugeiconsIcon
                icon={FolderOpenIcon}
                className="h-8 w-8 mb-2 opacity-40"
              />
              <p className="text-sm">
                {searchQuery
                  ? "No matching sessions"
                  : "No Claude Code CLI sessions found"}
              </p>
              <p className="text-xs mt-1 opacity-60">
                {searchQuery
                  ? "Try a different search term"
                  : "Sessions are stored in ~/.claude/projects/"}
              </p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const session = sessions[virtualItem.index];
                const isImporting = importing === session.sessionId;
                const totalMessages =
                  session.userMessageCount + session.assistantMessageCount;
                const isLastItem = virtualItem.index === sessions.length - 1;

                return (
                  <div
                    key={session.sessionId}
                    data-index={virtualItem.index}
                    ref={isLastItem ? lastItemRef : undefined}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div
                      className={cn(
                        "group flex flex-col gap-1.5 rounded-lg border p-3 transition-colors mb-2",
                        "hover:bg-accent/50",
                        isImporting && "opacity-60 pointer-events-none"
                      )}
                    >
                      {/* Top row: project name + import button */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {session.projectName}
                            </span>
                            {session.gitBranch && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                              >
                                <HugeiconsIcon
                                  icon={GitBranchIcon}
                                  className="h-2.5 w-2.5 mr-0.5"
                                />
                                {session.gitBranch}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 break-all">
                            {session.preview}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 h-7 text-xs"
                          onClick={() => handleImport(session.sessionId)}
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <>
                              <HugeiconsIcon
                                icon={Loading02Icon}
                                className="h-3 w-3 mr-1 animate-spin"
                              />
                              Importing...
                            </>
                          ) : (
                            <>
                              <HugeiconsIcon
                                icon={FileImportIcon}
                                className="h-3 w-3 mr-1"
                              />
                              Import
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Bottom row: metadata */}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                        <span
                          className="flex items-center gap-0.5 truncate"
                          title={session.cwd}
                        >
                          <HugeiconsIcon
                            icon={FolderOpenIcon}
                            className="h-2.5 w-2.5 shrink-0"
                          />
                          {session.cwd}
                        </span>
                        <span className="flex items-center gap-0.5 shrink-0">
                          <HugeiconsIcon
                            icon={MessageAddIcon}
                            className="h-2.5 w-2.5"
                          />
                          {totalMessages} msg{totalMessages !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-0.5 shrink-0">
                          <HugeiconsIcon
                            icon={ClockIcon}
                            className="h-2.5 w-2.5"
                          />
                          {formatRelativeTime(session.updatedAt)}
                        </span>
                        <span className="shrink-0">
                          {formatFileSize(session.fileSize)}
                        </span>
                        {session.version && (
                          <span className="shrink-0">v{session.version}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <HugeiconsIcon
                icon={Loading02Icon}
                className="h-4 w-4 animate-spin text-muted-foreground"
              />
              <span className="ml-2 text-xs text-muted-foreground">
                Loading more sessions...
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
