import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, archiveProject } from '@/lib/db';
import type { UpdateProjectRequest, ErrorResponse, ProjectResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body: UpdateProjectRequest = await request.json();

    const updated = updateProject(id, body);
    if (!updated) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ProjectResponse>({ project: updated });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const existing = getProject(id);
    if (!existing) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    archiveProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    );
  }
}
