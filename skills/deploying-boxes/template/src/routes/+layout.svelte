<script lang="ts">
	import type { LayoutProps } from './$types';
	let { children }: LayoutProps = $props();
</script>

{@render children()}

<style>
	:global {
		:root {
			--bg: #f5f5f4;
			--card: #ffffff;
			--ink: #1c1917;
			--muted: #78716c;
			--rule: #e7e5e4;
			--accent: #1f2937;
			--danger: #b91c1c;
			color-scheme: light;
		}
		*,
		*::before,
		*::after {
			box-sizing: border-box;
		}
		body {
			margin: 0;
			min-height: 100dvh;
			background: var(--bg);
			color: var(--ink);
			font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
			-webkit-font-smoothing: antialiased;
		}
		a {
			color: inherit;
		}
		.card {
			background: var(--card);
			border: 1px solid var(--rule);
			border-radius: 12px;
			padding: 1.25rem;
		}
		.btn {
			font: inherit;
			font-size: 0.9375rem;
			padding: 0.5rem 0.9rem;
			border-radius: 8px;
			border: 1px solid var(--accent);
			background: var(--accent);
			color: #fff;
			cursor: pointer;
			text-decoration: none;
			display: inline-block;
		}
		.btn.secondary {
			background: transparent;
			color: var(--ink);
			border-color: var(--rule);
		}
		.muted {
			color: var(--muted);
		}
	}
</style>
