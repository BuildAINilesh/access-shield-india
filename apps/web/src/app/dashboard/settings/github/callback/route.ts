import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth/session';

/**
 * GET /dashboard/settings/github/callback
 * GitHub App setup redirect — persists installation via API.
 * Query: installation_id, setup_action, state
 */
export async function GET(request: NextRequest) {
  const session = await getAppSession();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const settingsUrl = `${appUrl}/dashboard/settings?tab=integrations`;

  if (!session.userId || !session.accessToken) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const installationId = request.nextUrl.searchParams.get('installation_id');
  const state = request.nextUrl.searchParams.get('state');
  const setupAction = request.nextUrl.searchParams.get('setup_action');

  if (!installationId || !state) {
    return NextResponse.redirect(`${settingsUrl}&github=missing_params`);
  }

  if (setupAction && setupAction !== 'install' && setupAction !== 'update') {
    return NextResponse.redirect(`${settingsUrl}&github=cancelled`);
  }

  // Fetch installation account from GitHub public API is not needed if we store login later;
  // use placeholder from query when present, else "unknown" until refresh.
  const accountLogin =
    request.nextUrl.searchParams.get('account_login') ??
    request.nextUrl.searchParams.get('org') ??
    'github';

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const response = await fetch(`${apiUrl}/api/v1/integrations/github/callback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      installationId: Number(installationId),
      accountLogin,
      accountType: 'Organization',
      state,
    }),
  });

  if (!response.ok) {
    return NextResponse.redirect(`${settingsUrl}&github=error`);
  }

  return NextResponse.redirect(`${settingsUrl}&github=connected`);
}
