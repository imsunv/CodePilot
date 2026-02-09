import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getAllProjects, createProject } from '@/lib/db';
import type { CreateProjectRequest, ErrorResponse, ProjectsResponse, ProjectResponse } from '@/types';

export async function GET() {
  try {
    const projects = getAllProjects();
    return NextResponse.json<ProjectsResponse>({ projects });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Failed to get projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectRequest = await request.json();

    if (!body.working_directory) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing required field: working_directory' },
        { status: 400 }
      );
    }

    const name = body.name || path.basename(body.working_directory);
    const project = createProject(name, body.working_directory);
    return NextResponse.json<ProjectResponse>(
      { project },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}
