// Boots the production build (`pnpm build` runs first via `pnpm test`) with a mocked Amp and
// checks the behaviour that must hold before this app is exposed on the internet.
// Plain JavaScript so svelte-check does not need the build output to exist.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Server } from '../.svelte-kit/output/server/index.js';
import { manifest } from '../.svelte-kit/output/server/manifest.js';
import { sealPayload, unsealPayload } from '../src/lib/server/oauth.ts';

const secret = 'local-test-session-secret-not-for-production';
const origin = 'https://guestbook.example.test';
const fetchRequests = [];

globalThis.fetch = async (input, init) => {
	const url = String(input instanceof Request ? input.url : input);
	const headers = new Headers(init?.headers);
	fetchRequests.push({ url, authorization: headers.get('authorization') });
	return Response.json({});
};

const server = new Server(manifest);
await server.init({
	env: {
		NODE_ENV: 'production',
		DATABASE_PATH: ':memory:',
		AMP_DEPLOYMENT_URL: `${origin}/`,
		AMP_OAUTH_CLIENT_ID: 'client_test',
		AMP_OAUTH_CLIENT_SECRET: 'test-client-secret',
		APP_SESSION_SECRET: secret
	}
});

function request(path, options = {}) {
	// Browsers send `accept: text/html`; without it SvelteKit answers form posts with JSON.
	const headers = new Headers(options.headers);
	if (!headers.has('accept')) headers.set('accept', 'text/html');
	return server.respond(new Request(`${origin}${path}`, { ...options, headers }), {
		getClientAddress: () => '127.0.0.1'
	});
}

function sessionCookie(id = 'user_owner', name = 'Test Owner') {
	return `app_session=${sealPayload(
		{
			version: 1,
			user: { id, displayName: name, email: null },
			tokens: { accessToken: `token-for-${id}`, refreshToken: null, expiresAt: Date.now() + 3_600_000 },
			expiresAt: Date.now() + 60_000
		},
		secret
	)}`;
}

test('anonymous requests reach only the public routes', async () => {
	const home = await request('/');
	assert.equal(home.status, 303);
	assert.equal(home.headers.get('location'), '/login?next=%2F');
	assert.equal((await request('/health')).status, 200);
	const login = await (await request('/login')).text();
	assert.match(login, /Sign in with Amp/);
	assert.equal((await request('/api/anything')).status, 401);
	assert.equal(fetchRequests.length, 0, 'no Amp call without a session');
});

test('sign-in starts a PKCE authorization-code flow against Amp', async () => {
	const response = await request('/auth/signin?returnTo=//evil.example');
	assert.equal(response.status, 302);
	const target = new URL(response.headers.get('location'));
	assert.equal(target.origin + target.pathname, 'https://auth.ampcode.com/oauth2/authorize');
	assert.equal(target.searchParams.get('client_id'), 'client_test');
	assert.equal(target.searchParams.get('redirect_uri'), `${origin}/auth/callback`);
	assert.equal(target.searchParams.get('resource'), 'https://ampcode.com/api/v2');
	assert.equal(target.searchParams.get('scope'), 'openid profile email offline_access');
	assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
	assert.equal(target.searchParams.has('client_secret'), false);
	const cookie = response.headers.get('set-cookie');
	assert.match(cookie, /HttpOnly/);
	assert.match(cookie, /Secure/);
	const transaction = unsealPayload(cookie.match(/app_oauth=([^;]+)/)[1], secret);
	assert.equal(transaction.returnTo, '/', 'open redirect target is replaced');
	assert.equal(transaction.state, target.searchParams.get('state'));
	assert.equal(transaction.nonce, target.searchParams.get('nonce'));
});

test('callback rejects a missing or mismatched state without calling Amp', async () => {
	const before = fetchRequests.length;
	const cookie = `app_oauth=${sealPayload(
		{ state: 'right', nonce: 'n', codeVerifier: 'v'.repeat(43), returnTo: '/', expiresAt: Date.now() + 60_000 },
		secret
	)}`;
	for (const headers of [{}, { cookie }]) {
		const response = await request('/auth/callback?state=wrong&code=abc', { headers });
		assert.equal(response.status, 303);
		assert.match(response.headers.get('location'), /auth_error=invalid_state/);
	}
	assert.equal(fetchRequests.length, before);
});

test('a signed-in user sees the guestbook', async () => {
	const page = await (await request('/', { headers: { cookie: sessionCookie() } })).text();
	assert.match(page, /Signed in as Test Owner/);
});

test('posting and deleting notes is scoped to the signed-in user', async () => {
	const post = (cookie, body) =>
		request('/?/post', {
			method: 'POST',
			headers: { cookie, origin, 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ body })
		});
	assert.equal((await post(sessionCookie('user_a', 'Alice'), 'hello from alice')).status, 200);
	assert.equal((await post(sessionCookie('user_a', 'Alice'), '   ')).status, 400);
	assert.equal((await post(sessionCookie('user_a', 'Alice'), 'x'.repeat(501))).status, 400);

	const page = await (await request('/', { headers: { cookie: sessionCookie('user_b', 'Bob') } })).text();
	assert.match(page, /hello from alice/);
	assert.doesNotMatch(page, />Delete</, 'Bob cannot delete Alice’s note');
	const id = page.match(/name="id" value="(\d+)"/)?.[1] ?? page.match(/\bid:(\d+)/)[1];

	const del = (cookie) =>
		request('/?/delete', {
			method: 'POST',
			headers: { cookie, origin, 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ id: String(id) })
		});
	assert.equal((await del(sessionCookie('user_b', 'Bob'))).status, 404);
	assert.equal((await del(sessionCookie('user_a', 'Alice'))).status, 200);
	const after = await (await request('/', { headers: { cookie: sessionCookie('user_a', 'Alice') } })).text();
	assert.doesNotMatch(after, /hello from alice/);
});

test('form posts from another origin are rejected', async () => {
	const response = await request('/?/post', {
		method: 'POST',
		headers: {
			cookie: sessionCookie(),
			origin: 'https://attacker.example',
			'content-type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({ body: 'csrf' })
	});
	assert.equal(response.status, 403);
});
