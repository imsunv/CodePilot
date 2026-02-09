import { NextRequest } from 'next/server';
import { getAllSessions, createSession } from '@/lib/db';
import type { CreateSessionRequest, SessionsResponse, SessionResponse } from '@/types';

export async function GET() {
  try {
    const sessions = getAllSessions();
    const response: SessionsResponse = { sessions };
    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    console.error('[GET /api/chat/sessions] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();
    const session = createSession(
      body.title,
      body.model,
      body.system_prompt,
      body.working_directory,
      body.mode,
      body.project_id,
    );
    const response: SessionResponse = { session };
    return Response.json(response, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    console.error('[POST /api/chat/sessions] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
