'use client';

import { useState } from 'react';
import type { Message, PermissionRequestEvent, Project } from '@/types';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import { MessageItem } from './MessageItem';
import { StreamingMessage } from './StreamingMessage';
import { HugeiconsIcon } from "@hugeicons/react";
import { BotIcon, FolderOpenIcon, FolderAddIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolUseInfo {
  id: string;
  name: string;
  input: unknown;
}

interface ToolResultInfo {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  toolUses?: ToolUseInfo[];
  toolResults?: ToolResultInfo[];
  streamingToolOutput?: string;
  statusText?: string;
  pendingPermission?: PermissionRequestEvent | null;
  onPermissionResponse?: (decision: 'allow' | 'allow_session' | 'deny') => void;
  permissionResolved?: 'allow' | 'deny' | null;
  projects?: Project[];
  activeProjectId?: string;
  onProjectChange?: (projectId: string, workingDirectory: string) => void;
  onAddProject?: () => void;
}

export function MessageList({
  messages,
  streamingContent,
  isStreaming,
  toolUses = [],
  toolResults = [],
  streamingToolOutput,
  statusText,
  pendingPermission,
  onPermissionResponse,
  permissionResolved,
  projects,
  activeProjectId,
  onProjectChange,
  onAddProject,
}: MessageListProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeProject = projects?.find((p) => p.id === activeProjectId);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <ConversationEmptyState>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20">
            <HugeiconsIcon icon={BotIcon} className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-medium">Let&apos;s Claude Chat</h3>
          {projects !== undefined && (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <span className="text-sm">
                    {activeProject ? activeProject.name : "Select a project"}
                  </span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Select your project
                </div>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => onProjectChange?.(project.id, project.working_directory)}
                  >
                    <HugeiconsIcon icon={FolderOpenIcon} className="h-3.5 w-3.5" />
                    <span className="flex-1 truncate">{project.name}</span>
                    {project.id === activeProjectId && (
                      <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                {projects.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => onAddProject?.()}>
                  <HugeiconsIcon icon={FolderAddIcon} className="h-3.5 w-3.5" />
                  <span>Add new project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </ConversationEmptyState>
      </div>
    );
  }

  return (
    <Conversation>
      <ConversationContent className="mx-auto max-w-3xl px-4 py-6 gap-6">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {isStreaming && (
          <StreamingMessage
            content={streamingContent}
            isStreaming={isStreaming}
            toolUses={toolUses}
            toolResults={toolResults}
            streamingToolOutput={streamingToolOutput}
            statusText={statusText}
            pendingPermission={pendingPermission}
            onPermissionResponse={onPermissionResponse}
            permissionResolved={permissionResolved}
          />
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
