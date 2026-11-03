<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	}
</script>

<svelte:head><title>Guestbook</title></svelte:head>

<main>
	<header>
		<h1>Guestbook</h1>
		<div class="who">
			<span class="muted">Signed in as {data.user?.displayName}</span>
			<form method="POST" action="/auth/signout"><button class="btn secondary">Sign out</button></form>
		</div>
	</header>

	<section class="card">
		<form method="POST" action="?/post" use:enhance class="compose">
			<label for="body">Leave a note</label>
			<textarea id="body" name="body" rows="3" maxlength={data.maxLength} required
				placeholder="Say hello…">{form && 'body' in form ? form.body : ''}</textarea>
			<div class="row">
				{#if form?.error}<span class="error">{form.error}</span>{:else}<span></span>{/if}
				<button class="btn">Post</button>
			</div>
		</form>
	</section>

	<section class="entries">
		{#if data.entries.length === 0}
			<p class="muted empty">No notes yet. Be the first.</p>
		{/if}
		{#each data.entries as entry (entry.id)}
			<article class="card entry">
				<p class="body">{entry.body}</p>
				<footer>
					<span class="muted">{entry.userName} · {formatDate(entry.createdAt)}</span>
					{#if entry.userID === data.user?.id}
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={entry.id} />
							<button class="link">Delete</button>
						</form>
					{/if}
				</footer>
			</article>
		{/each}
	</section>

	<p class="muted hint">
		Built with Amp. If you can operate this app's Box on Amp, use the Amp button in the corner to
		comment on this page and send the comments to an agent that changes the app.
	</p>
</main>

<style>
	main {
		max-width: 40rem;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		display: grid;
		gap: 1.25rem;
	}
	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.9375rem;
	}
	.compose {
		display: grid;
		gap: 0.5rem;
	}
	label {
		font-weight: 600;
	}
	textarea {
		font: inherit;
		width: 100%;
		padding: 0.6rem;
		border: 1px solid var(--rule);
		border-radius: 8px;
		resize: vertical;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.error {
		color: var(--danger);
		font-size: 0.9375rem;
	}
	.entries {
		display: grid;
		gap: 0.75rem;
	}
	.entry .body {
		margin: 0 0 0.5rem;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.entry footer {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
	}
	.link {
		font: inherit;
		font-size: 0.875rem;
		background: none;
		border: 0;
		padding: 0;
		color: var(--muted);
		cursor: pointer;
		text-decoration: underline;
	}
	.empty {
		text-align: center;
		margin: 1rem 0;
	}
	.hint {
		font-size: 0.875rem;
	}
</style>
