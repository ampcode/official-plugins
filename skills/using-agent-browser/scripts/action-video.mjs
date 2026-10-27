#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const session = process.env.ACTION_VIDEO_SESSION ?? 'default'
const namespace = process.env.AGENT_BROWSER_NAMESPACE ?? 'default'
const stateName = `${namespace}-${session}`.replaceAll(/[^a-zA-Z0-9_-]/g, '-')
const statePath = join(tmpdir(), 'agent-browser-action-video', `${stateName}.json`)
// A project that pins agent-browser as a dependency gets its own version.
const agentBrowserPath = existsSync('node_modules/.bin/agent-browser')
	? resolve('node_modules/.bin/agent-browser')
	: 'agent-browser'
// Pointer moves take long enough to follow, then hold so delayed hover effects such as tooltips
// appear before the next step.
const pointerMoveMs = '600'
const pointerHoldMs = 1000
// Type one character at a time so viewers can watch the text appear.
const keystrokeDelayMs = 40
const actionTailSeconds = 0.6
const maxLoopSeconds = 30
const [command, ...commandArguments] = process.argv.slice(2)
let allowedDomains

if (!command || command === '--help' || command === '-h') {
	usage(0)
}

function usage(exitCode = 2) {
	console.error(`Usage:
  action-video.mjs start RAW.mp4 [--no-cursor] [--allowed-domains LIST]
  action-video.mjs <agent-browser command...>
  action-video.mjs stop OUTPUT.mp4

Set ACTION_VIDEO_SESSION to select the agent-browser session.
Pass the session's allowlist to --allowed-domains to record without restore.
--no-cursor records without agent-browser's cursor overlay, for pages that draw their own.`)
	process.exit(exitCode)
}

function runAgentBrowser(arguments_, options = {}) {
	const json = options.json ?? false
	if (
		allowedDomains &&
		(process.env.AGENT_BROWSER_RESTORE || process.env.AGENT_BROWSER_SESSION_NAME)
	) {
		console.error(
			'Unset AGENT_BROWSER_RESTORE and AGENT_BROWSER_SESSION_NAME before recording with an allowlist.',
		)
		process.exit(1)
	}
	const result = spawnSync(
		agentBrowserPath,
		[
			'--session',
			session,
			...(allowedDomains ? ['--allowed-domains', allowedDomains] : ['--restore']),
			...arguments_,
			...(json ? ['--json'] : []),
		],
		{ cwd: process.cwd(), encoding: 'utf8', stdio: json ? ['ignore', 'pipe', 'pipe'] : 'inherit' },
	)
	if (result.error) {
		throw result.error
	}
	if (result.status !== 0) {
		if (json) {
			process.stderr.write(result.stdout + result.stderr)
		}
		process.exit(result.status ?? 1)
	}
	return json ? JSON.parse(result.stdout).data : undefined
}

function readState() {
	if (!existsSync(statePath)) {
		console.error(
			`No recording in progress for session "${session}"; run \`node ${process.argv[1]} start <raw.mp4>\` first.`,
		)
		process.exit(1)
	}
	return JSON.parse(readFileSync(statePath, 'utf8'))
}

function writeState(state) {
	mkdirSync(dirname(statePath), { recursive: true })
	writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`)
}

/** Moves the real mouse to the element's center along a curved path, so every element it
 * passes over gets real hover events, as it would for a person. */
function moveTo(selector) {
	const box = runAgentBrowser(['get', 'box', selector], { json: true })
	runAgentBrowser([
		'mouse',
		'move',
		String(Math.round(box.x + box.width / 2)),
		String(Math.round(box.y + box.height / 2)),
		'--human',
		'--duration',
		pointerMoveMs,
	])
}

async function runRecordedCommand() {
	const state = readState()
	allowedDomains = state.allowedDomains
	const startedAt = Date.now()
	const [selector, ...rest] = commandArguments
	const isPointerMove =
		(command === 'hover' && selector) || (command === 'mouse' && selector === 'move')
	if ((command === 'click' || command === 'drag') && selector) {
		runAgentBrowser([command, ...commandArguments.filter((a) => a !== '--human'), '--human'])
	} else if (command === 'hover' && selector) {
		moveTo(selector)
	} else if ((command === 'fill' || command === 'type') && selector) {
		runAgentBrowser(['click', selector, '--human'])
		if (command === 'fill') {
			runAgentBrowser(['press', 'Control+a'])
			runAgentBrowser(['press', 'Backspace'])
		}
		for (const character of rest.join(' ')) {
			runAgentBrowser(['keyboard', 'type', character], { json: true })
			await sleep(keystrokeDelayMs)
		}
	} else if (['dblclick', 'check', 'uncheck', 'select'].includes(command) && selector) {
		moveTo(selector)
		runAgentBrowser([command, ...commandArguments])
	} else if (command === 'mouse' && selector === 'move' && !rest.some((a) => a.startsWith('--'))) {
		runAgentBrowser([command, ...commandArguments, '--human', '--duration', pointerMoveMs])
	} else {
		runAgentBrowser([command, ...commandArguments])
	}
	if (isPointerMove) {
		await sleep(pointerHoldMs)
	}
	const endedAt = Date.now()
	if (!['snapshot', 'get', 'is', 'read', 'console', 'errors'].includes(command)) {
		state.events.push({
			command,
			start: (startedAt - state.startedAt) / 1_000,
			end: (endedAt - state.startedAt) / 1_000,
		})
		writeState(state)
	}
}

function probeVideo(path) {
	const result = spawnSync(
		'ffprobe',
		['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', path],
		{ encoding: 'utf8' },
	)
	if (result.status !== 0) {
		process.stderr.write(result.stderr)
		process.exit(result.status ?? 1)
	}
	const probe = JSON.parse(result.stdout)
	return {
		duration: Number(probe.format.duration),
		hasAudio: probe.streams.some((stream) => stream.codec_type === 'audio'),
	}
}

function mergeIntervals(intervals) {
	const merged = []
	for (const interval of intervals.sort((left, right) => left.start - right.start)) {
		const previous = merged.at(-1)
		if (previous && interval.start <= previous.end) {
			previous.end = Math.max(previous.end, interval.end)
		} else {
			merged.push({ ...interval })
		}
	}
	return merged
}

function runFfmpeg(arguments_) {
	const result = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...arguments_], {
		stdio: 'inherit',
	})
	if (result.status !== 0) {
		process.exit(result.status ?? 1)
	}
}

function compactVideo(state, outputPath, stoppedAt) {
	const { duration, hasAudio } = probeVideo(state.rawPath)
	const wallDuration = Math.max((stoppedAt - state.startedAt) / 1_000, 0.001)
	const scale = duration / wallDuration
	const intervals = state.events.map((event) => ({
		start: Math.max(0, event.start * scale - 0.25),
		end: Math.min(duration, event.end * scale + actionTailSeconds),
	}))
	intervals.push({ start: 0, end: Math.min(0.4, duration) })
	intervals.push({ start: Math.max(0, duration - 0.35), end: duration })
	const merged = mergeIntervals(intervals)
	const filterParts = []
	const concatInputs = []
	for (const [index, interval] of merged.entries()) {
		filterParts.push(
			`[0:v]trim=start=${interval.start}:end=${interval.end},setpts=PTS-STARTPTS[v${index}]`,
		)
		concatInputs.push(`[v${index}]`)
		if (hasAudio) {
			filterParts.push(
				`[0:a]atrim=start=${interval.start}:end=${interval.end},asetpts=PTS-STARTPTS[a${index}]`,
			)
			concatInputs.push(`[a${index}]`)
		}
	}
	filterParts.push(
		`${concatInputs.join('')}concat=n=${merged.length}:v=1:a=${hasAudio ? 1 : 0}[outv]${hasAudio ? '[outa]' : ''}`,
	)
	mkdirSync(dirname(outputPath), { recursive: true })
	const arguments_ = [
		'-i',
		state.rawPath,
		'-filter_complex',
		filterParts.join(';'),
		'-map',
		'[outv]',
	]
	if (hasAudio) {
		arguments_.push('-map', '[outa]', '-c:a', 'aac', '-b:a', '192k')
	}
	arguments_.push(
		'-c:v',
		'libx264',
		'-preset',
		'medium',
		'-crf',
		'18',
		'-pix_fmt',
		'yuv420p',
		'-movflags',
		'+faststart',
		outputPath,
	)
	runFfmpeg(arguments_)
	const compactedDuration = merged.reduce((sum, interval) => sum + interval.end - interval.start, 0)
	console.log(
		`Compacted ${duration.toFixed(1)}s to ${compactedDuration.toFixed(1)}s: ${outputPath}`,
	)

	// The transcript plays videos once; an animated WebP embedded as an image loops by itself.
	if (compactedDuration <= maxLoopSeconds) {
		const loopPath = outputPath.replace(/\.[^./]+$/, '') + '.loop.webp'
		runFfmpeg([
			'-i',
			outputPath,
			'-vf',
			'fps=25',
			'-c:v',
			'libwebp_anim',
			'-quality',
			'75',
			'-loop',
			'0',
			'-an',
			loopPath,
		])
		console.log(`Loop: ${loopPath}`)
	} else {
		console.log(`No loop: ${compactedDuration.toFixed(1)}s is longer than ${maxLoopSeconds}s`)
	}
}

if (command === 'start') {
	if (!commandArguments[0]) {
		usage()
	}
	const allowlistIndex = commandArguments.indexOf('--allowed-domains')
	if (
		allowlistIndex !== -1 &&
		(!commandArguments[allowlistIndex + 1] || commandArguments[allowlistIndex + 1].startsWith('--'))
	) {
		usage()
	}
	allowedDomains =
		allowlistIndex === -1
			? process.env.AGENT_BROWSER_ALLOWED_DOMAINS
			: commandArguments[allowlistIndex + 1]
	const hover = runAgentBrowser(['eval', "matchMedia('(hover: hover)').matches"], { json: true })
	if (hover.result !== true) {
		console.error(`Session "${session}" reports (hover: none), so hover states will not appear and touch fallbacks will.
Close it, reopen it with the desktop pointer wrapper from the using-agent-browser skill's
"Hover-gated UI" section (--executable-path), then start again.`)
		process.exit(1)
	}
	const rawPath = resolve(commandArguments[0])
	mkdirSync(dirname(rawPath), { recursive: true })
	const cursor = commandArguments.includes('--no-cursor') ? [] : ['--cursor']
	runAgentBrowser(['record', 'restart', rawPath, ...cursor])
	writeState({ rawPath, startedAt: Date.now(), events: [], allowedDomains })
} else if (command === 'stop') {
	if (!commandArguments[0]) {
		usage()
	}
	const state = readState()
	allowedDomains = state.allowedDomains
	const stoppedAt = Date.now()
	runAgentBrowser(['record', 'stop'])
	compactVideo(state, resolve(commandArguments[0]), stoppedAt)
	rmSync(statePath)
} else {
	await runRecordedCommand()
}
