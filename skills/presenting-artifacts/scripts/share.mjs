#!/usr/bin/env node
// Checks the HTML pages in a directory and prints a portal URL for each one.
//
//   node share.mjs [--dir DIR] [--check]
//
// --dir DIR   Directory holding the pages. Default: .amp/in/artifacts/pages
// --check     Only check the pages; do not start the server or print links.
//
// Exits 1 when a page has an error or the server cannot be reached.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const SERVICE_NAME = 'artifact-pages'
const DEFAULT_DIR = '.amp/in/artifacts/pages'

function parseArgs(argv) {
	const args = { dir: DEFAULT_DIR, check: false }
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index]
		if (arg === '--check') {
			args.check = true
		} else if (arg === '--dir') {
			const value = argv[index + 1]
			if (value === undefined) throw new Error('--dir requires a value')
			args.dir = value
			index += 1
		} else {
			throw new Error(`Unknown option: ${arg}`)
		}
	}
	return args
}

function decodeEntities(text) {
	return text
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
}

/**
 * Checks one page for the problems that break reading or commenting.
 * Errors stop sharing; warnings are printed and sharing continues.
 */
function checkPage(html) {
	const errors = []
	const warnings = []

	const title = decodeEntities(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '')
		.replace(/\s+/g, ' ')
		.trim()
	if (!title) errors.push('has no <title>')

	// Markup only: comments, code samples, scripts, and styles can hold anything.
	const markup = html
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<(script|style|pre|code)\b[\s\S]*?<\/\1>/gi, '<$1></$1>')

	const visible = html.replace(/<!--[\s\S]*?-->/g, '')
	const placeholders = (visible.match(/⟦/g) ?? []).length
	if (placeholders > 0) {
		errors.push(`still has ${placeholders} template placeholder(s) marked with ⟦ ⟧`)
	}

	const drawings = [...visible.matchAll(/<pre\b[^>]*\sclass\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/pre>/gi)].filter(
		(match) => match[1].split(/\s+/).includes('diagram'),
	)
	const drawingsWithTabs = drawings.filter((match) => match[2].includes('\t')).length
	if (drawingsWithTabs > 0) {
		errors.push(
			`has ${drawingsWithTabs} drawing(s) with a tab character, which breaks the alignment: start each line of a <pre class="diagram"> at the first column and use spaces`,
		)
	}
	if (drawings.some((match) => /&(?:amp|lt|gt|#\d+|#x[0-9a-f]+);/i.test(match[2]))) {
		warnings.push('has a drawing with an escaped character; check in a screenshot that it still lines up')
	}

	const content = visible.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
	const preOpens = (content.match(/<pre\b/gi) ?? []).length
	const preCloses = (content.match(/<\/pre\s*>/gi) ?? []).length
	if (preOpens !== preCloses) {
		errors.push(
			`has ${preOpens} <pre> start tag(s) but ${preCloses} end tag(s): inside a <pre>, write < as &lt; and & as &amp;`,
		)
	}

	const seen = new Set()
	const duplicates = new Set()
	for (const match of markup.matchAll(/<[a-z][^>]*?\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
		const id = match[1] ?? match[2]
		if (seen.has(id)) duplicates.add(id)
		seen.add(id)
	}
	if (duplicates.size > 0) {
		errors.push(`repeats id(s), so a comment cannot point at one block: ${[...duplicates].join(', ')}`)
	}

	const itemsWithoutID = [...markup.matchAll(/<[a-z][^>]*\sclass\s*=\s*"([^"]*)"[^>]*>/gi)].filter(
		(match) => match[1].split(/\s+/).includes('item') && !/\sid\s*=/.test(match[0]),
	).length
	if (itemsWithoutID > 0) {
		warnings.push(`has ${itemsWithoutID} class="item" block(s) without an id`)
	}

	const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
		.map((match) => match[1])
		.join('\n')
	const external =
		/<(?:script|img|iframe|video|audio|source)\b[^>]*\ssrc\s*=\s*["']?(?:https?:)?\/\//i.test(markup) ||
		/<link\b[^>]*\shref\s*=\s*["']?(?:https?:)?\/\//i.test(markup) ||
		/@import|url\(\s*["']?(?:https?:)?\/\//i.test(styles)
	if (external) {
		warnings.push('loads a script, style, font, or image from another site')
	}

	return { title, errors, warnings }
}

function shellQuote(value) {
	return `'${value.replace(/'/g, `'\\''`)}'`
}

/** Starts or reuses the supervised static server and returns its portal and local origins. */
function ensurePortal(dir) {
	const command = `python3 -m http.server "$PORT" --bind 127.0.0.1 --directory ${shellQuote(dir)}`
	const result = spawnSync(
		'amp',
		[
			'orb',
			'service',
			'start',
			SERVICE_NAME,
			'--command',
			command,
			'--portal',
			'--title',
			'Pages',
			'--description',
			'Pages for review. Use the review button on a page to comment on any block.',
		],
		{ encoding: 'utf8' },
	)
	const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
	const url = output
		.split('\n')
		.map((line) => line.trim())
		.findLast((line) => /^https?:\/\/\S+$/.test(line))
	const port = /\bport (\d+)\b/.exec(output)?.[1]
	if (result.status !== 0 || !url || !port) {
		throw new Error(
			`Could not start the ${SERVICE_NAME} service.\n${output.trim()}\n` +
				`Check: amp orb service logs ${SERVICE_NAME}`,
		)
	}
	// The local origin is for checking only. Readers get the portal URL.
	return { portal: url.replace(/\/+$/, ''), local: `http://127.0.0.1:${port}` }
}

async function main() {
	const args = parseArgs(process.argv.slice(2))
	const dir = resolve(args.dir)
	if (!existsSync(dir)) throw new Error(`Directory does not exist: ${dir}`)

	const pages = readdirSync(dir)
		.filter((name) => name.endsWith('.html'))
		.map((name) => ({ name, path: join(dir, name), modified: statSync(join(dir, name)).mtimeMs }))
		.sort((a, b) => b.modified - a.modified)
	if (pages.length === 0) throw new Error(`No .html pages in ${dir}`)

	let failed = false
	for (const page of pages) {
		const { title, errors, warnings } = checkPage(readFileSync(page.path, 'utf8'))
		page.title = title || page.name
		for (const error of errors) console.error(`ERROR   ${page.name} ${error}`)
		for (const warning of warnings) console.error(`WARNING ${page.name} ${warning}`)
		if (errors.length > 0) failed = true
	}
	if (failed) {
		console.error('Fix the errors, then run this script again. Nothing was shared.')
		process.exitCode = 1
		return
	}
	if (args.check) {
		console.log(`Checked ${pages.length} page(s): no errors.`)
		return
	}

	if (!process.env.AMP_ORB) {
		console.log('Not running in an Amp orb, so there is no portal. Link the files instead:')
		for (const page of pages) console.log(`${page.title}\n  ${pathToFileURL(page.path).href}`)
		return
	}

	const { portal, local } = ensurePortal(dir)
	for (const page of pages) {
		const file = encodeURIComponent(page.name)
		const response = await fetch(`${local}/${file}`, { method: 'HEAD' })
		if (!response.ok) {
			throw new Error(`The server answered HTTP ${response.status} for ${page.name}`)
		}
		console.log(`${page.title}\n  ${portal}/${file}`)
	}
}

try {
	await main()
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error))
	process.exitCode = 1
}
