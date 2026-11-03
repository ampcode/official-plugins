import { env } from '$env/dynamic/private';
import { getOAuthConfig, SESSION_SECRET } from './config';
import {
	exchangeAuthorizationCode,
	refreshAccessToken,
	sealPayload,
	unsealPayload,
	type OAuthTokens,
	type OAuthTransaction
} from './oauth';

export const AUTH_COOKIE = 'app_session';
export const OAUTH_TRANSACTION_COOKIE = 'app_oauth';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const TRANSACTION_MAX_AGE_SECONDS = 10 * 60;

export interface AuthedUser {
	/** Amp user ID (the OIDC `sub` claim), for example `user_01ABC...`. */
	id: string;
	displayName: string;
	email: string | null;
}

/**
 * App access only. Being signed in, or allowed here, does not give someone access to the Box.
 */
export function canAccessApp(user: AuthedUser | null): boolean {
	if (user === null) return false;
	const allowed = (env.APP_ALLOWED_USER_IDS ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
	return allowed.length === 0 || allowed.includes(user.id);
}

interface AuthSession {
	version: 1;
	user: AuthedUser;
	tokens: OAuthTokens;
	expiresAt: number;
}

function sessionSecret(): string {
	if (SESSION_SECRET.length < 32) {
		throw new Error('APP_SESSION_SECRET must contain at least 32 characters');
	}
	return SESSION_SECRET;
}

export function encodeOAuthTransaction(transaction: OAuthTransaction): string {
	return sealPayload(transaction, sessionSecret());
}

export function decodeOAuthTransaction(
	value: string | undefined,
	now = Date.now()
): OAuthTransaction | null {
	if (!value) return null;
	const payload = unsealPayload(value, sessionSecret());
	if (!isRecord(payload)) return null;
	return typeof payload.state === 'string' &&
		typeof payload.nonce === 'string' &&
		typeof payload.codeVerifier === 'string' &&
		payload.codeVerifier.length >= 43 &&
		payload.codeVerifier.length <= 128 &&
		typeof payload.returnTo === 'string' &&
		typeof payload.expiresAt === 'number' &&
		payload.expiresAt > now
		? (payload as unknown as OAuthTransaction)
		: null;
}

export async function completeOAuthSignIn(code: string, verifier: string, nonce: string) {
	const { tokens, identity } = await exchangeAuthorizationCode(
		getOAuthConfig(),
		code,
		verifier,
		nonce
	);
	const user: AuthedUser = {
		id: identity.sub,
		displayName:
			identity.name ||
			[identity.givenName, identity.familyName].filter(Boolean).join(' ') ||
			identity.email ||
			'Amp user',
		email: identity.email
	};
	const session: AuthSession = {
		version: 1,
		user,
		tokens,
		expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
	};
	return { user, sessionCookie: sealPayload(session, sessionSecret()) };
}

export interface AuthenticatedSession {
	user: AuthedUser;
	accessToken: string;
	/** Set when the access token was refreshed; store it as the new session cookie. */
	refreshedCookie: string | null;
}

export async function authenticateSession(
	value: string | undefined,
	now = Date.now()
): Promise<AuthenticatedSession | null> {
	if (!value || SESSION_SECRET.length < 32) return null;
	const payload = unsealPayload(value, sessionSecret());
	if (
		!isRecord(payload) ||
		payload.version !== 1 ||
		typeof payload.expiresAt !== 'number' ||
		payload.expiresAt <= now
	) {
		return null;
	}
	const { user, tokens } = payload;
	if (
		!isRecord(user) ||
		typeof user.id !== 'string' ||
		typeof user.displayName !== 'string' ||
		(user.email !== null && typeof user.email !== 'string') ||
		!isRecord(tokens) ||
		typeof tokens.accessToken !== 'string' ||
		(tokens.refreshToken !== null && typeof tokens.refreshToken !== 'string') ||
		(tokens.expiresAt !== null && typeof tokens.expiresAt !== 'number')
	) {
		return null;
	}
	const session = payload as unknown as AuthSession;
	let refreshedCookie: string | null = null;
	if (session.tokens.expiresAt !== null && session.tokens.expiresAt <= now + 60_000) {
		if (!session.tokens.refreshToken) return null;
		const refreshed = await refreshAccessToken(
			getOAuthConfig(),
			session.tokens.refreshToken,
			fetch,
			now
		);
		session.tokens = {
			...refreshed,
			refreshToken: refreshed.refreshToken ?? session.tokens.refreshToken
		};
		refreshedCookie = sealPayload(session, sessionSecret());
	}
	return { user: session.user, accessToken: session.tokens.accessToken, refreshedCookie };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
