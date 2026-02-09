"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { FilterHorizontalIcon, FolderOpenIcon, ClockIcon } from "@hugeicons/core-free-icons";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type OrganizeMode = "project" | "chronological";
export type SortBy = "created" | "updated";

interface OrganizeDropdownProps {
  organize: OrganizeMode;
  sortBy: SortBy;
  onOrganizeChange: (mode: OrganizeMode) => void;
  onSortByChange: (sort: SortBy) => void;
}

export function OrganizeDropdown({
  organize,
  sortBy,
  onOrganizeChange,
  onSortByChange,
}: OrganizeDropdownProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <HugeiconsIcon icon={FilterHorizontalIcon} className="h-3.5 w-3.5" />
              <span className="sr-only">Organize</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Organize</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider">
          Organize
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onOrganizeChange("project")}>
            <HugeiconsIcon icon={FolderOpenIcon} className="h-3.5 w-3.5" />
            <span className="flex-1">By project</span>
            {organize === "project" && <CheckIcon className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOrganizeChange("chronological")}>
            <HugeiconsIcon icon={ClockIcon} className="h-3.5 w-3.5" />
            <span className="flex-1">Chronological list</span>
            {organize === "chronological" && <CheckIcon className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider">
          Sort by
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onSortByChange("created")}>
            <span className="flex-1">Created</span>
            {sortBy === "created" && <CheckIcon className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange("updated")}>
            <span className="flex-1">Updated</span>
            {sortBy === "updated" && <CheckIcon className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
