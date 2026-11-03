<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Sign in — Guestbook</title></svelte:head>

<div class="card login">
	<h1>Guestbook</h1>
	{#if data.user}
		<p>Signed in as {data.user.displayName}.</p>
		{#if data.allowed}
			<a class="btn" href={data.next}>Open the guestbook</a>
		{:else}
			<p class="error">This account is not allowed to use this app.</p>
			<p class="muted">Amp user ID: <code>{data.user.id}</code></p>
		{/if}
		<form method="POST" action="/auth/signout"><button class="btn secondary">Sign out</button></form>
	{:else}
		<p>Sign in with your Amp account to continue.</p>
		{#if data.failed}<p class="error">Sign-in failed. Please try again.</p>{/if}
		{#if data.configured}
			<a class="btn" href={`/auth/signin?returnTo=${encodeURIComponent(data.next)}`}>Sign in with Amp</a>
		{:else}
			<p class="error">Sign in with Amp is not configured yet. Ask the app owner to finish setup.</p>
		{/if}
	{/if}
</div>

<style>
	.login {
		width: min(24rem, calc(100vw - 2rem));
		margin: 20vh auto 0;
		display: grid;
		gap: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.25rem;
	}
	p {
		margin: 0;
	}
	.error {
		color: var(--danger);
	}
	.btn {
		justify-self: start;
	}
</style>
