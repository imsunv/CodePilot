import { listClaudeSessions } from '@/lib/claude-session-parser';

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
    const search = searchParams.get('search')?.trim() || undefined;

    // Get paginated and filtered sessions
    const result = listClaudeSessions({ page, limit, search });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    console.error('[GET /api/claude-sessions] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
