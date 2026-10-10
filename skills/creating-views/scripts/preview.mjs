#!/usr/bin/env node
// The kit/ files are copies of server/src/lib/mcp-apps/amp-view-kit in the Amp repo; keep them in sync.
// Previews an amp-view document the way the Amp web UI frames it: Amp's theme tokens, chart
// palette, and base styles are injected before the document's own CSS. Screenshots it at the
// reply width (720px) and at phone width (360px) in light and dark themes, and prints page
// errors. Keep the tokens in sync with server/src/lib/mcp-apps/amp-view.ts in the Amp repo.
//
// Usage: node preview.mjs <view.html> [output-dir]
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const input = process.argv[2]
if (!input) {
	console.error('Usage: node preview.mjs <view.html> [output-dir]')
	process.exit(2)
}
const html = readFileSync(input, 'utf8')
const kitDir = join(dirname(fileURLToPath(import.meta.url)), 'kit')
const kitCSS = readFileSync(join(kitDir, 'kit.css'), 'utf8')
const kitJS = readFileSync(join(kitDir, 'kit.js'), 'utf8').replace("'__AMP_VIEW_ICONS__'", () =>
	JSON.stringify(readFileSync(join(kitDir, 'icons.svg'), 'utf8').replace(/<!--[\s\S]*?-->/, '')),
)
const outDir = resolve(process.argv[3] ?? `/tmp/amp-view-preview-${Date.now()}`)
mkdirSync(outDir, { recursive: true })

const sans = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'
const themes = {
	light: {
		'--background': '#fafaf8',
		'--foreground': '#0b0d0b',
		'--muted-foreground': 'hsl(0 0% 35%)',
		'--card': 'rgba(11, 13, 11, 0.02)',
		'--muted': 'rgba(11, 13, 11, 0.07)',
		'--border': 'rgba(135, 139, 134, 0.2)',
		'--link': 'hsl(213, 65%, 45%)',
		'--success': '#2f8052',
		'--warning': '#a07013',
		'--destructive': '#c44f4a',
		chart: ['#1a609e', '#b36d2a', '#0e9a94', '#913c5b', '#71640b', '#7377c6'],
	},
	dark: {
		'--background': 'rgb(11, 13, 11)',
		'--foreground': 'rgb(246, 255, 245)',
		'--muted-foreground': '#9ca49c',
		'--card': 'rgba(246, 255, 245, 0.03)',
		'--muted': 'rgba(246, 255, 245, 0.07)',
		'--border': 'rgba(135, 139, 134, 0.2)',
		'--link': 'hsl(213, 65%, 65%)',
		'--success': '#54b879',
		'--warning': '#d6a038',
		'--destructive': '#d67670',
		chart: ['#5b9ddf', '#f6ab6b', '#47d6cf', '#d47795', '#b0a03c', '#b1b7fd'],
	},
}

function framed(theme) {
	const { chart, ...tokens } = themes[theme]
	const variables = [
		...Object.entries(tokens).map(([name, value]) => `${name}:${value}`),
		...chart.map((color, index) => `--chart-${index + 1}:${color}`),
		'--grid:color-mix(in oklab, var(--foreground) 8%, transparent)',
		'--chart-context:color-mix(in oklab, var(--muted-foreground) 65%, var(--background))',
		...[
			'#12a88a',
			'#e36f4a',
			'#3d82e8',
			'#9b5de5',
			'#eab308',
			'#ef476f',
			'#00b8d9',
			'#f77f00',
			'#7cb342',
			'#94a3b8',
		].map((c, i) => `--series-${i + 1}:${c}`),
		'--radius:8px',
		`--font-sans:${sans}`,
		`--font-mono:${mono}`,
	].join(';')
	const head =
		'<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
		`<style>:root{color-scheme:${theme};${variables}}${kitCSS}</style><script>${kitJS}</` +
		'script>'
	for (const tag of [/<head\b[^>]*>/i, /<html\b[^>]*>/i, /<!doctype[^>]*>/i]) {
		const match = tag.exec(html)
		if (match) {
			const end = match.index + match[0].length
			return html.slice(0, end) + head + html.slice(end)
		}
	}
	return `<!doctype html>${head}${html}`
}

const session = `amp-view-preview-${process.pid}`
const browser = (...args) =>
	execFileSync('agent-browser', ['--session', session, ...args], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
	})

const name = basename(input).replace(/\.html?$/i, '')
try {
	for (const theme of ['light', 'dark']) {
		const file = join(outDir, `${name}-${theme}.html`)
		writeFileSync(file, framed(theme))
		for (const width of [720, 360]) {
			browser('set', 'viewport', String(width), '900', '2')
			browser('open', `file://${file}`)
			browser('wait', '1400')
			const height = browser(
				'eval',
				'Math.ceil(document.documentElement.getBoundingClientRect().height)',
			)
			const shot = join(outDir, `${name}-${theme}-${width}.png`)
			// Crop to the content, like the inline frame does (up to its 1200px limit).
			browser('set', 'viewport', String(width), String(Math.min(1200, Number(height) + 8)), '2')
			browser('screenshot', shot)
			const errors = JSON.parse(browser('errors', '--json')).data?.errors ?? []
			console.log(`${theme} ${width}px: ${shot} (content height ${height.trim()}px)`)
			for (const error of errors) console.log(`  error: ${error.text} (line ${error.line})`)
			browser('errors', '--clear')
		}
	}
} finally {
	try {
		browser('close')
	} catch {}
}
