"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPicker } from "@/components/chat/FolderPicker";
import type { Project } from "@/types";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "rename";
  project?: Project;
  onCreated?: (project: Project) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  mode = "create",
  project,
  onCreated,
}: CreateProjectDialogProps) {
  const [workingDirectory, setWorkingDirectory] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const isRename = mode === "rename";

  // Sync state when dialog opens
  useEffect(() => {
    if (open && isRename && project) {
      setWorkingDirectory(project.working_directory);
      setName(project.name);
    } else if (open && !isRename) {
      setWorkingDirectory("");
      setName("");
    }
  }, [open, isRename, project]);

  const handleFolderSelect = (dir: string) => {
    setWorkingDirectory(dir);
    if (!name) {
      const parts = dir.replace(/\/+$/, "").split("/");
      setName(parts[parts.length - 1] || "");
    }
  };

  const handleDirectoryInput = (value: string) => {
    setWorkingDirectory(value);
    if (!name && value.trim()) {
      const parts = value.replace(/\/+$/, "").split("/");
      setName(parts[parts.length - 1] || "");
    }
  };

  const handleSubmit = async () => {
    if (isRename) {
      if (!name.trim() || !project) return;
    } else {
      if (!workingDirectory.trim()) return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isRename && project) {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to rename project");
        }
        window.dispatchEvent(new CustomEvent("project-created"));
        onOpenChange(false);
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            working_directory: workingDirectory.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create project");
        }
        const data = await res.json();
        window.dispatchEvent(new CustomEvent("project-created"));
        onCreated?.(data.project);
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setWorkingDirectory("");
      setName("");
      setError(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRename ? "Rename Project" : "Create Project"}</DialogTitle>
            <DialogDescription>
              {isRename
                ? "Change the display name for this project."
                : "Add a project directory to organize your conversations."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-dir">Working Directory</Label>
              <div className="flex gap-2">
                <Input
                  id="project-dir"
                  placeholder="/path/to/project"
                  value={workingDirectory}
                  onChange={(e) => handleDirectoryInput(e.target.value)}
                  className="flex-1 text-sm"
                  disabled={isRename}
                />
                {!isRename && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFolderPickerOpen(true)}
                  >
                    <HugeiconsIcon icon={FolderOpenIcon} className="h-3.5 w-3.5" />
                    Browse
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="my-project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm"
                autoFocus={isRename}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={isRename ? !name.trim() || submitting : !workingDirectory.trim() || submitting}
            >
              {submitting ? (isRename ? "Saving..." : "Creating...") : (isRename ? "Save" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isRename && (
        <FolderPicker
          open={folderPickerOpen}
          onOpenChange={setFolderPickerOpen}
          onSelect={handleFolderSelect}
          initialPath={workingDirectory || undefined}
        />
      )}
    </>
  );
}
