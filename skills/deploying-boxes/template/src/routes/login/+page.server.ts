import type { PageServerLoad } from './$types';
import { canAccessApp } from '$lib/server/auth';
import { oauthConfigurationError } from '$lib/server/config';
import { normalizeReturnTo } from '$lib/server/oauth';

export const load: PageServerLoad = ({ locals, url }) => {
	return {
		next: normalizeReturnTo(url.searchParams.get('next'), '/'),
		user: locals.user,
		allowed: canAccessApp(locals.user),
		configured: oauthConfigurationError() === null,
		failed: url.searchParams.has('auth_error')
	};
};
