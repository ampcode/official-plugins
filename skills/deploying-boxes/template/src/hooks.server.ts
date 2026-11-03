import { error, json, redirect, type Handle } from '@sveltejs/kit';
import {
	AUTH_COOKIE,
	authenticateSession,
	canAccessApp,
	SESSION_MAX_AGE_SECONDS
} from '$lib/server/auth';
import { SECURE_COOKIES } from '$lib/server/config';

/** Paths reachable without a session cookie. */
const PUBLIC = new Set(['/login', '/auth/signin', '/auth/callback', '/auth/signout', '/health']);

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	event.locals.user = null;
	event.locals.accessToken = null;
	try {
		const session = await authenticateSession(event.cookies.get(AUTH_COOKIE));
		if (session) {
			event.locals.user = session.user;
			event.locals.accessToken = session.accessToken;
			if (session.refreshedCookie) {
				event.cookies.set(AUTH_COOKIE, session.refreshedCookie, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: SECURE_COOKIES,
					maxAge: SESSION_MAX_AGE_SECONDS
				});
			}
		} else if (event.cookies.get(AUTH_COOKIE)) {
			event.cookies.delete(AUTH_COOKIE, { path: '/', secure: SECURE_COOKIES });
		}
	} catch {
		// A failed token refresh must never grant access or leak provider details.
		event.locals.user = null;
		event.locals.accessToken = null;
		event.cookies.delete(AUTH_COOKIE, { path: '/', secure: SECURE_COOKIES });
	}

	const isPublic =
		PUBLIC.has(pathname) ||
		pathname.startsWith('/_app/') ||
		pathname === '/favicon.svg' ||
		pathname === '/robots.txt';

	if (!isPublic && !event.locals.user) {
		if (pathname.startsWith('/api/')) return json({ error: 'unauthorized' }, { status: 401 });
		redirect(303, `/login?next=${encodeURIComponent(pathname + event.url.search)}`);
	}
	if (!isPublic && !canAccessApp(event.locals.user)) {
		if (pathname.startsWith('/api/')) return json({ error: 'forbidden' }, { status: 403 });
		error(403, 'This Amp account is not allowed to use this app. Visit /login to sign out.');
	}

	const response = await resolve(event);
	if (!pathname.startsWith('/_app/')) {
		response.headers.set('cache-control', 'private, no-store');
	}
	return response;
};
