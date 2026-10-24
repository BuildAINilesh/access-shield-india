import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth/session';

/**
 * GET /dashboard/settings/github/auth
 * Asks the API for a signed GitHub App install URL and redirects.
 */
export async function GET(_request: NextRequest) {
  const session = await getAppSession();

  if (!session.userId || !session.accessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const response = await fetch(`${apiUrl}/api/v1/integrations/github/install`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    return new NextResponse(body?.detail ?? 'GitHub App install is not available', {
      status: response.status,
    });
  }

  const json = (await response.json()) as { data: { url: string } };
  return NextResponse.redirect(json.data.url);
}
