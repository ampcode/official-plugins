import { env } from '$env/dynamic/private';
import type { OAuthConfig } from './oauth';

/** Sign in with Amp endpoints. These are fixed for every Amp app. */
export const AMP_ISSUER = 'https://auth.ampcode.com';
export const AMP_RESOURCE_URL = 'https://ampcode.com/api/v2';

export const SESSION_SECRET = env.APP_SESSION_SECRET?.trim() ?? '';

/**
 * Where Amp sends the user back after sign-in. On a Box this defaults to the deployment URL,
 * so only local development needs to set AMP_OAUTH_REDIRECT_URI explicitly.
 */
export function redirectURI(): string {
	const explicit = env.AMP_OAUTH_REDIRECT_URI?.trim();
	if (explicit) return explicit;
	const deploymentURL = env.AMP_DEPLOYMENT_URL?.trim();
	return deploymentURL ? new URL('/auth/callback', deploymentURL).toString() : '';
}

export const SECURE_COOKIES = !redirectURI().startsWith('http://');

export function oauthConfigurationError(): string | null {
	for (const name of ['AMP_OAUTH_CLIENT_ID', 'AMP_OAUTH_CLIENT_SECRET']) {
		if (!env[name]?.trim()) return `Missing ${name}`;
	}
	if (SESSION_SECRET.length < 32) return 'APP_SESSION_SECRET must contain at least 32 characters';
	const uri = redirectURI();
	if (!uri) return 'Missing AMP_OAUTH_REDIRECT_URI';
	try {
		const parsed = new URL(uri);
		const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
		if (
			parsed.pathname !== '/auth/callback' ||
			parsed.search ||
			parsed.hash ||
			parsed.username ||
			parsed.password ||
			(parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback))
		) {
			return 'AMP_OAUTH_REDIRECT_URI must be an exact HTTPS /auth/callback URI (HTTP only on loopback)';
		}
	} catch {
		return 'AMP_OAUTH_REDIRECT_URI must be a valid URL';
	}
	return null;
}

export function getOAuthConfig(): OAuthConfig {
	const problem = oauthConfigurationError();
	if (problem) throw new Error(problem);
	return {
		issuer: AMP_ISSUER,
		authorizationURL: `${AMP_ISSUER}/oauth2/authorize`,
		tokenURL: `${AMP_ISSUER}/oauth2/token`,
		jwksURL: `${AMP_ISSUER}/oauth2/jwks`,
		resourceURL: AMP_RESOURCE_URL,
		clientID: env.AMP_OAUTH_CLIENT_ID!.trim(),
		clientSecret: env.AMP_OAUTH_CLIENT_SECRET!.trim(),
		redirectURI: redirectURI()
	};
}
