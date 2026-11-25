#!/usr/bin/env node
// Checks one sideview program before it is published: its place in the repository, the
// limits Amp enforces, that every script parses, and that the program lays out sample threads.
// Usage: node check-sideview.mjs <repository>/sideviews/<key>/sideview.html [--state '<json>'] [--preview <out.html>]
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import vm from 'node:vm'

const HELP = `Usage: node check-sideview.mjs <repository>/sideviews/<key>/sideview.html [--state '<json>'] [--preview <out.html>]

--state '{"focus":true}'  Runs the program with these control choices instead of none.
--preview <out.html>      Also writes a page that draws the program's views with Amp's own
                          sidebar styles, light and dark, at the sidebar's default width.
                          Section headers and rows on it are plain stand-ins.

Prints "OK" with the sections the program made from sample threads, or each problem to fix.
Exits 1 when Amp would not show the sidebar. Sample answers from Jev are made up, so the check
proves the program runs, not that its conditions are good.`

const file = process.argv[2]
if (!file || file === '--help' || file === '-h') {
	console.log(HELP)
	process.exit(file ? 0 : 1)
}

const problems = []
const notes = []
let state = {}
const stateAt = process.argv.indexOf('--state')
if (stateAt !== -1) {
	try {
		state = JSON.parse(process.argv[stateAt + 1])
		if (state === null || typeof state !== 'object' || Array.isArray(state)) throw new Error('not an object')
	} catch (error) {
		console.error(`--state needs a JSON object, such as --state '{"focus":true}': ${error.message}`)
		process.exit(1)
	}
}
const previewAt = process.argv.indexOf('--preview')
const previewPath = previewAt === -1 ? null : process.argv[previewAt + 1]
if (previewAt !== -1 && (!previewPath || previewPath.startsWith('--'))) {
	console.error('--preview needs a file to write, such as --preview /tmp/sideview-preview.html')
	process.exit(1)
}
let firstBlocks = []
const path = resolve(file)
const key = basename(dirname(path))
if (basename(path) !== 'sideview.html' || basename(dirname(dirname(path))) !== 'sideviews')
	problems.push('The file must be sideviews/<key>/sideview.html at the root of the plugins repository.')
if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(key))
	problems.push(`The directory name "${key}" must be lowercase letters, digits, and hyphens, at most 40 characters.`)

let source
try {
	source = readFileSync(path, 'utf8')
} catch (error) {
	console.error(`Cannot read ${path}: ${error.message}`)
	process.exit(1)
}
if (source.length > 16_000)
	problems.push(`The file is ${source.length} characters; the limit is 16000. Shorten conditions and remove comments.`)
if (!source.includes('sidebar.layout('))
	problems.push('The program never calls sidebar.layout(blocks), so Amp does not treat it as a sideview.')

const title = /<title>([^<]{1,200})<\/title>/i.exec(source)?.[1]?.trim()
if (!title) notes.push(`No <title>: the chip will read "${key.replace(/-/g, ' ')}". Add <title>Short Name</title> as the first line.`)
else if (title.length > 40) problems.push(`The <title> is ${title.length} characters; Amp cuts it to 40.`)

const templates = new Map()
const withoutTemplates = source.replace(
	/<template\s+id=(["'])([^"']+)\1\s*>([\s\S]*?)<\/template>/gi,
	(_, _quote, id, html) => {
		if (templates.has(id)) problems.push(`Two templates share the id "${id}".`)
		templates.set(id, html)
		return ''
	},
)
if (/<template/i.test(withoutTemplates))
	problems.push('A <template> has no id, or is not closed. Write <template id="name">...</template>.')
if (templates.size > 8) problems.push(`${templates.size} views; Amp shows at most 8.`)
for (const [id, html] of templates)
	if (html.length > 4_000) problems.push(`View "${id}" is ${html.length} characters; the limit is 4000.`)

const scriptsIn = (html) => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1])
function parses(code, where) {
	try {
		new vm.Script(code)
		return true
	} catch (error) {
		problems.push(`${where} does not parse: ${error.message}`)
		return false
	}
}
for (const [id, html] of templates) scriptsIn(html).forEach((code) => parses(code, `The script of view "${id}"`))
const programScripts = scriptsIn(withoutTemplates)
if (programScripts.length === 0) problems.push('There is no <script> outside the templates, so there is no program.')
const runnable = programScripts.filter((code) => parses(code, 'The program script'))

const now = Date.now()
const SAMPLE = [
	['Fix checkout total rounding', 'waiting', true, 'shop', ['bug'], [], 0, 0.2],
	['Search ranking regression', 'working', false, 'search', [], ['github'], 2, 1],
	['Weekly dependency update', 'idle', false, 'shop', ['chore'], ['schedule'], 0, 5],
	['Onboarding email copy', 'idle', true, null, [], [], 0, 9],
	['Explore offline mode', 'idle', false, 'mobile', ['feature'], [], 3, 30],
	['Release planning', 'idle', false, null, [], ['slack'], 4, 50],
	['Flaky payment webhook test', 'waiting', false, 'shop', ['bug'], ['github'], 0, 80],
	['Rename settings page', 'idle', false, 'web', [], [], 0, 200],
].map(([title, state, unread, project, labels, automations, nestedThreads, hoursAgo], index) => ({
	id: `T-sample-${index + 1}`,
	title,
	kind: title === 'Release planning' ? 'space' : 'thread',
	labels,
	state,
	unread,
	project,
	automations,
	nestedThreads,
	lastActiveAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
}))
const known = new Set(SAMPLE.map((thread) => thread.id))

function checkBlocks(blocks) {
	if (!Array.isArray(blocks)) return void problems.push('sidebar.layout must get an array of blocks.')
	if (blocks.length > 40) problems.push(`${blocks.length} blocks; Amp takes at most 40.`)
	const placed = new Set()
	for (const block of blocks) {
		if (block?.type === 'view' || (block?.type === 'section' && block.view !== undefined)) {
			if (!templates.has(block.view))
				problems.push(`A block names the view "${block.view}", but no <template id="${block.view}"> exists.`)
		}
		if (block?.type === 'view') continue
		if (block?.type !== 'section') {
			problems.push(`A block has type ${JSON.stringify(block?.type)}; use 'section' or 'view'.`)
			continue
		}
		if (typeof block.title !== 'string' || block.title.length > 80)
			problems.push('A section title must be a string of at most 80 characters.')
		if (!Array.isArray(block.threads) || block.threads.some((id) => typeof id !== 'string'))
			problems.push(`Section "${block.title}": threads must be an array of thread ids (t.id), not thread objects.`)
		else {
			const unknown = block.threads.filter((id) => !known.has(id))
			if (unknown.length > 0) problems.push(`Section "${block.title}" lists ids that are not listed threads: ${unknown.slice(0, 3).join(', ')}.`)
			const shown = block.threads.filter((id) => known.has(id) && !placed.has(id))
			shown.forEach((id) => placed.add(id))
			notes.push(`  ${block.title || '(no header)'}: ${shown.length}${block.collapsed ? ' (collapsed)' : ''}`)
		}
	}
	const hidden = SAMPLE.length - placed.size
	if (hidden > 0) notes.push(`  ${hidden} of ${SAMPLE.length} sample threads are in no section, so they are hidden.`)
}

async function run() {
	const questions = new Set()
	let layouts = 0
	let listener
	const sidebar = {
		onUpdate(next) {
			listener = next
		},
		setState() {},
		async jev(threads, question) {
			const names = typeof question === 'string' ? null : Object.keys(question ?? {})
			const conditions = typeof question === 'string' ? [question] : Object.values(question ?? {})
			questions.add(JSON.stringify(question))
			if (questions.size > 4) problems.push('The program asks Jev more than 4 different questions; ask one with all conditions.')
			if (conditions.length === 0 || conditions.length > 12) problems.push('A Jev question needs 1 to 12 conditions.')
			if (conditions.some((condition) => typeof condition !== 'string' || condition.length > 500))
				problems.push('Each Jev condition must be a string of at most 500 characters.')
			if (names?.some((name) => name.length > 80)) problems.push('A Jev condition name is over 80 characters.')
			if (!Array.isArray(threads) || threads.some((thread) => typeof thread?.id !== 'string'))
				problems.push('sidebar.jev takes the thread objects the listener got, as its first argument.')
			// Made-up answers: every other thread meets a condition, in turn.
			return Object.fromEntries(
				(Array.isArray(threads) ? threads : []).map((thread, index) => [
					thread.id,
					names ? (index % 2 === 0 ? (names[(index / 2) % names.length] ?? null) : null) : index % 2 === 0,
				]),
			)
		},
		layout(blocks) {
			layouts++
			if (layouts === 1) {
				checkBlocks(blocks)
				if (Array.isArray(blocks)) firstBlocks = blocks
			}
		},
	}
	const context = vm.createContext({ sidebar, console, Date, Intl, setTimeout, clearTimeout, document: { getElementById: () => null } })
	try {
		for (const code of runnable) new vm.Script(code).runInContext(context, { timeout: 2_000 })
		if (!listener) return void problems.push('The program never calls sidebar.onUpdate(listener).')
		await Promise.race([
			listener(structuredClone(SAMPLE), structuredClone(state)),
			new Promise((_, reject) => setTimeout(() => reject(new Error('the listener did not finish within 2 seconds')), 2_000)),
		])
	} catch (error) {
		return void problems.push(`The program failed on sample threads: ${error.message}`)
	}
	if (layouts === 0) problems.push('The listener finished without calling sidebar.layout(blocks). Call it at the end of every listener call.')
}

// The page --preview writes. Each view is its template in a frame with the head Amp gives a
// sidebar view (view-kit/head.html, taken from Amp's source), in a box sized and bordered like
// the one in the sidebar. window.sidebar in these frames only hands out the sample threads.
function previewPage() {
	const kit = new URL('./view-kit/', import.meta.url)
	const head = readFileSync(new URL('head.html', kit), 'utf8')
	const { themes } = JSON.parse(readFileSync(new URL('themes.json', kit), 'utf8'))
	const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
	const stub = `<script>window.sidebar=(()=>{const threads=${JSON.stringify(SAMPLE)},state=${JSON.stringify(state)},listeners=[];const run=(listener)=>Promise.resolve().then(()=>listener(structuredClone(threads),{...state})).catch((error)=>console.error(error));return Object.freeze({onUpdate(listener){listeners.push(listener);run(listener)},setState(patch){Object.assign(state,patch);listeners.forEach(run);return Promise.resolve({})},jev(list,ask){const names=typeof ask==='string'?null:Object.keys(ask||{});return Promise.resolve(Object.fromEntries((Array.isArray(list)?list:[]).map((thread,index)=>[thread&&thread.id||thread,names?(index%2===0?(names[(index/2)%names.length]??null):null):index%2===0])))},layout(){return Promise.resolve({})}})})();</` + 'script>'
	const frames = []
	const view = (id, theme) => {
		if (!templates.has(id)) return ''
		const themed = head.replace('__THEME_ROOT__', () => themes[theme].root).replace('__THEME__', theme).replace('__SIDEBAR_STUB__', () => stub)
		frames.push(`<!doctype html><html><head>${themed}</head><body>${templates.get(id)}</body></html>`)
		return `<div class="view"><iframe title="View ${escape(id)}, ${theme}" data-frame="${frames.length - 1}"></iframe></div>`
	}
	const titles = new Map(SAMPLE.map((thread) => [thread.id, thread.title]))
	const column = (theme) => {
		const placed = new Set()
		const items = firstBlocks.map((block) => {
			if (block?.type === 'view') return view(block.view, theme)
			if (block?.type !== 'section' || !Array.isArray(block.threads)) return ''
			const rows = block.threads.filter((id) => titles.has(id) && !placed.has(id))
			rows.forEach((id) => placed.add(id))
			const header = block.title ? `<div class="header">${escape(block.title)}${block.collapsed ? ` <span>${rows.length}</span>` : ''}</div>` : ''
			const body = block.collapsed ? '' : (block.view === undefined ? '' : view(block.view, theme)) + rows.map((id) => `<div class="row">${escape(titles.get(id))}</div>`).join('')
			return header + body
		})
		const { sidebarBackground, border, headerColor, rowColor } = themes[theme]
		return `<div class="sidebar" style="background:${sidebarBackground};color:${rowColor};--border:${border};--header:${headerColor}"><div class="caption">${theme}</div>${items.join('')}</div>`
	}
	const columns = column('light') + column('dark')
	return `<!doctype html><html><head><meta charset="utf-8"><title>Preview: ${escape(title ?? key)}</title><style>
body{margin:0;padding:16px;display:flex;flex-wrap:wrap;align-items:flex-start;gap:16px;background:#8a8a8a;font:14px/22px system-ui,-apple-system,"Segoe UI",sans-serif}
.sidebar{box-sizing:border-box;width:255px;padding:4px 8px 12px}
.caption{padding:4px 8px;font-size:11px;color:var(--header);text-transform:capitalize}
.view{box-sizing:border-box;overflow:hidden;margin-bottom:6px;padding:6px;border:1px solid var(--border);border-radius:8px}
.view iframe{display:block;width:100%;height:24px;border:0}
.header{display:flex;justify-content:space-between;padding:8px 8px 2px;color:var(--header)}
.row{height:32px;padding:0 8px;line-height:32px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
p{flex-basis:100%;margin:0;max-width:526px;font-size:12px;line-height:18px;color:#fff}
</style></head><body>${columns}<p>Views are drawn with Amp's sidebar styles at the sidebar's default width (a 225px frame), with ${SAMPLE.length} sample threads and state ${escape(JSON.stringify(state))}. Section headers and rows are stand-ins: Amp draws the real ones. A control changes the views here, not the sections; run the check again with --state to see another choice.</p>
<script type="application/json" id="frames">${JSON.stringify(frames).replace(/</g, '\\u003c')}</` + `script>
<script>
const frames = JSON.parse(document.getElementById('frames').textContent)
for (const frame of document.querySelectorAll('iframe')) {
	frame.addEventListener('load', () => {
		const page = frame.contentDocument.documentElement
		const fit = () => (frame.style.height = Math.ceil(page.getBoundingClientRect().height) + 'px')
		new ResizeObserver(fit).observe(frame.contentDocument.body)
		fit()
	})
	frame.srcdoc = frames[Number(frame.dataset.frame)]
}
</` + `script></body></html>`
}

if (runnable.length > 0 && problems.length === 0) await run()
if (problems.length > 0) {
	console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'} in ${file}:`)
	for (const problem of problems) console.error(`- ${problem}`)
	process.exit(1)
}
if (previewPath) {
	writeFileSync(previewPath, previewPage())
	notes.push(`  Preview written to ${resolve(previewPath)}`)
}
console.log(`OK: ${title ?? key} (${source.length} of 16000 characters, ${templates.size} view${templates.size === 1 ? '' : 's'}), with state ${JSON.stringify(state)}`)
for (const note of notes) console.log(note)
process.exit(0)
