// @ts-nocheck
// @amp-agent-mode {"key":"composer-2-5","label":"Composer 2.5"}

import { spawn } from 'node:child_process'
import { readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import type {
	Agent,
	PluginAPI,
	PluginToolContext,
	PluginToolDefinition,
	PluginToolResult,
} from '@ampcode/plugin'

/**
 * Cursor Composer 2.5 is exposed through SpaceXAI's Grok CLI subscription proxy as
 * `grok-composer-2.5-fast`. It requires a SuperGrok/X Premium+ subscription
 * connection; a SpaceXAI API key alone will not have access to this model.
 */

const COMPOSER_25_AGENT_PROMPT = `You are an AI coding assistant, powered by Composer. You operate in Amp.

Your main goal is to follow the USER's instructions, which are denoted by the <user_query> tag.

<communication>
Communicate directly and concisely.
</communication>

<citing_code>
You MUST use the following format when citing code regions or blocks:

\`\`\`12:15:app/components/Todo.tsx
// ... existing code ...
\`\`\`

This is the ONLY acceptable format for code citations. The format is \`\`\`startLine:endLine:filepath where startLine and endLine are line numbers.
</citing_code>

You can use <think> tags to think through problems step by step before providing your response. Your thinking will not be shown to the user.
`

type InputSchema = PluginToolDefinition['inputSchema']

interface GrokToolSpec {
	name: string
	description: string
	inputSchema: InputSchema
}

function objectSchema(properties: Record<string, object>, required: string[] = []): InputSchema {
	return { type: 'object', properties, required }
}

const stringProperty = (description: string): object => ({ type: 'string', description })
const numberProperty = (description: string): object => ({ type: 'number', description })
const booleanProperty = (description: string): object => ({ type: 'boolean', description })

/**
 * These definitions are derived from the request Grok CLI 0.2.38 sent for
 * grok-composer-2.5-fast in Agent mode. Tools that Amp cannot execute are omitted, while Amp's
 * built-in web search, web page reader, and painter tools replace their Grok equivalents. Exact
 * custom tool names intentionally override same-named Amp built-ins while the plugin is active.
 */
const GROK_TOOL_SPECS: GrokToolSpec[] = [
	{
		name: 'Shell',
		description:
			'Executes a given command in a shell session, waiting for output for `block_until_ms` millis.\n\nYou can monitor commands by configuring `notify_on_output`. You will be notified whenever output matches the regex `pattern`. Configure a 5-or-fewer-word `reason` explaining what you are watching for, and optionally configure `debounce_ms`.',
		inputSchema: objectSchema(
			{
				command: stringProperty('The command to execute'),
				working_directory: stringProperty(
					'The absolute path to the working directory to execute the command in (defaults to current directory)',
				),
				description: stringProperty(
					'Clear, concise description of what this command does in 5-10 words.',
				),
				block_until_ms: numberProperty(
					'How long to block and wait for the command to complete before moving it to background (in milliseconds). Defaults to 30000ms (30 seconds).',
				),
				notify_on_output: {
					type: 'object',
					description:
						'Optional output notification config. Each terminal output which matches the pattern will notify you. ONLY set this when the user explicitly requests monitoring.',
					properties: {
						pattern: stringProperty('Regex pattern matched against stdout/stderr output.'),
						reason: stringProperty('5 or less words describing why you are watching.'),
						debounce_ms: numberProperty('Milliseconds that must elapse between notifications.'),
					},
					required: ['pattern', 'reason'],
				},
			},
			['command'],
		),
	},
	{
		name: 'Grep',
		description:
			'A search tool built on ripgrep. Results are capped to several thousand output lines for responsiveness; when truncation occurs, the results report "at least" counts, but are otherwise accurate.',
		inputSchema: objectSchema(
			{
				pattern: stringProperty('The regular expression pattern to search for in file contents'),
				path: stringProperty(
					'File or directory to search in (rg pattern -- PATH). Defaults to Cursor workspace root.',
				),
				glob: stringProperty('Glob pattern to filter files - maps to rg --glob'),
				output_mode: {
					type: 'string',
					description:
						'Output mode: "content" shows matching lines, "files_with_matches" shows file paths, "count" shows match counts.',
					enum: ['content', 'files_with_matches', 'count'],
				},
				'-B': numberProperty('Number of lines to show before each match (rg -B).'),
				'-A': numberProperty('Number of lines to show after each match (rg -A).'),
				'-C': numberProperty('Number of lines to show before and after each match (rg -C).'),
				'-i': booleanProperty('Case insensitive search (rg -i) Defaults to false'),
				type: stringProperty('File type to search (rg --type).'),
				head_limit: { ...numberProperty('Limit output size.'), minimum: 0 },
				offset: { ...numberProperty('Skip first N entries. Use with head_limit for pagination.'), minimum: 0 },
				multiline: booleanProperty(
					'Enable multiline mode where . matches newlines and patterns can span lines.',
				),
			},
			['pattern'],
		),
	},
	{
		name: 'Delete',
		description:
			"Deletes a file at the specified path. The operation will fail gracefully if:\n    - The file doesn't exist\n    - The operation is rejected for security reasons\n    - The file cannot be deleted",
		inputSchema: objectSchema({ path: stringProperty('The absolute path of the file to delete') }, [
			'path',
		]),
	},
	{
		name: 'TodoWrite',
		description: 'Use this tool to create and manage a structured task list for your current coding session.',
		inputSchema: objectSchema(
			{
				todos: {
					type: 'array',
					description: 'Array of TODO items to update or create',
					minItems: 2,
					items: {
						type: 'object',
						properties: {
							id: stringProperty('Unique identifier for the TODO item'),
							content: stringProperty('The description/content of the TODO item'),
							status: {
								type: 'string',
								description: 'The current status of the TODO item',
								enum: ['pending', 'in_progress', 'completed', 'cancelled'],
							},
						},
						required: ['id', 'content', 'status'],
					},
				},
				merge: booleanProperty('Whether to merge the todos with the existing todos.'),
			},
			['todos', 'merge'],
		),
	},
	{
		name: 'StrReplace',
		description: 'Performs exact string replacements in files.',
		inputSchema: objectSchema(
			{
				path: stringProperty('The absolute path to the file to modify'),
				old_string: stringProperty('The text to replace'),
				new_string: stringProperty('The text to replace it with (must be different from old_string)'),
				replace_all: booleanProperty('Replace all occurrences of old_string (default false)'),
			},
			['path', 'old_string', 'new_string'],
		),
	},
	{
		name: 'Write',
		description: 'Writes a file to the local filesystem.',
		inputSchema: objectSchema(
			{
				path: stringProperty('The absolute path to the file to modify'),
				contents: stringProperty('The contents to write to the file'),
			},
			['path', 'contents'],
		),
	},
	{
		name: 'Read',
		description:
			'Reads a file from the local filesystem. This tool can also read image files when called with the appropriate path. Formats supported: jpeg/jpg, png, gif, webp.',
		inputSchema: objectSchema(
			{
				path: stringProperty('The absolute path of the file to read.'),
				offset: { type: 'integer', description: 'The line number to start reading from.' },
				limit: { type: 'integer', description: 'The number of lines to read.' },
			},
			['path'],
		),
	},
	{
		name: 'Glob',
		description:
			'\nTool to search for files matching a glob pattern\n\n- Works fast with codebases of any size\n- Returns matching file paths sorted by modification time\n- Use this tool when you need to find files by name patterns\n- You have the capability to call multiple tools in a single response. It is always better to speculatively perform multiple searches that are potentially useful as a batch.\n',
		inputSchema: objectSchema(
			{
				target_directory: stringProperty(
					'Absolute path to directory to search for files in. If not provided, defaults to Cursor workspace root.',
				),
				glob_pattern: stringProperty('The glob pattern to match files against.'),
			},
			['glob_pattern'],
		),
	},
	{
		name: 'Task',
		description:
			'Launch a new agent to handle complex, multi-step tasks autonomously. Use for complex tasks, not simple reads or searches. Always include a short description and a detailed prompt.',
		inputSchema: objectSchema(
			{
				description: stringProperty('A short, user-friendly title for the subagent.'),
				prompt: stringProperty('The task for the agent to perform'),
			},
			['description', 'prompt'],
		),
	},
	{
		name: 'AskQuestion',
		description:
			'Collect structured multiple-choice answers from the user.\nProvide one or more questions with options.\nBy default, the tool will present the questions to the user and wait for their responses before continuing.',
		inputSchema: objectSchema(
			{
				title: stringProperty('Optional title for the questions form'),
				questions: {
					type: 'array',
					description: 'Array of questions to present to the user (minimum 1 required)',
					minItems: 1,
					items: {
						type: 'object',
						properties: {
							id: stringProperty('Unique identifier for this question'),
							prompt: stringProperty('The question text to display to the user.'),
							options: {
								type: 'array',
								description: 'Array of answer options (minimum 2 required)',
								minItems: 2,
								items: {
									type: 'object',
									properties: {
										id: stringProperty('Unique identifier for this option'),
										label: stringProperty('Display text for this option'),
									},
									required: ['id', 'label'],
								},
							},
							allow_multiple: booleanProperty('If true, user can select multiple options.'),
						},
						required: ['id', 'prompt', 'options'],
					},
				},
			},
			['questions'],
		),
	},
	{
		name: 'Await',
		description: 'Poll a background shell.',
		inputSchema: objectSchema({
			shell_id: stringProperty('Optional shell id to poll.'),
			block_until_ms: numberProperty('Max sleep time to block before returning.'),
			pattern: stringProperty('Block until the regex matches stdout/stderr stream.'),
		}),
	},
	{
		name: 'update_goal',
		description:
			'Update goal progress. Use completed: true when the goal is achieved. Use message to log progress. Use blocked_reason only when truly stuck after multiple attempts.',
		inputSchema: objectSchema({
			completed: booleanProperty('Set to true ONLY when the goal is fully achieved.'),
			message: stringProperty('Optional short message logged as progress.'),
			blocked_reason: stringProperty('Set only when truly stuck after 3+ consecutive failed attempts.'),
		}),
	},
]

const AMP_BUILTIN_TOOL_NAMES = ['web_search', 'read_web_page', 'painter'] as const

interface ShellMonitor {
	pattern: RegExp
	reason: string
	debounceMs: number
	lastNotificationAt: number
	tail: string
}

interface ManagedShell {
	id: string
	startedAt: number
	output: string
	reportedLength: number
	outputTruncated: boolean
	done: boolean
	exitCode: number | null
	signal: NodeJS.Signals | null
	error: string | null
	monitor: ShellMonitor | null
	waiters: Set<() => void>
	ctx: PluginToolContext
	notificationThread: PluginToolContext['thread']
}

const managedShells = new Map<string, ManagedShell>()
const pendingShellNotifications = new Map<string, string[]>()
const WORKSPACE_ROOT = resolve(process.cwd(), '../..')
const MAX_GLOB_RESULTS = 2_000
const MAX_GREP_OUTPUT_CHARS = 100_000
const MAX_GREP_RESULT_LINES = 2_000
const MAX_READ_LINES = 1_000
const MAX_READ_OUTPUT_CHARS = 50_000
const MAX_SHELL_OUTPUT_CHARS = 100_000
const MAX_SHELL_NOTIFICATION_CHARS = 4_000
const MAX_SHELL_BLOCK_MS = 30_000
let nextShellID = 1

function requiredString(input: Record<string, unknown>, key: string): string {
	const value = input[key]
	if (typeof value !== 'string') {
		throw new Error(`${key} must be a string`)
	}
	return value
}

function optionalString(input: Record<string, unknown>, key: string): string | undefined {
	const value = input[key]
	return typeof value === 'string' && value.length > 0 ? value : undefined
}

function optionalNumber(input: Record<string, unknown>, key: string): number | undefined {
	const value = input[key]
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function shellBlockDuration(input: Record<string, unknown>): number {
	return Math.min(
		Math.max(Math.floor(optionalNumber(input, 'block_until_ms') ?? MAX_SHELL_BLOCK_MS), 0),
		MAX_SHELL_BLOCK_MS,
	)
}

function shellMonitor(input: Record<string, unknown>, ctx: PluginToolContext): ShellMonitor | null {
	const value = input.notify_on_output
	if (value === undefined) return null
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error('notify_on_output must be an object')
	}
	const config = value as Record<string, unknown>
	return {
		pattern: new RegExp(requiredString(config, 'pattern')),
		reason: requiredString(config, 'reason'),
		debounceMs: Math.max(0, Math.floor(optionalNumber(config, 'debounce_ms') ?? 1_000)),
		lastNotificationAt: 0,
		tail: '',
	}
}

function notifyShellWaiters(shell: ManagedShell): void {
	const waiters = [...shell.waiters]
	shell.waiters.clear()
	for (const waiter of waiters) waiter()
}

function notifyShellMonitor(shell: ManagedShell, output: string): void {
	const monitor = shell.monitor
	if (!monitor) return
	const candidate = `${monitor.tail}${output}`
	monitor.pattern.lastIndex = 0
	if (!monitor.pattern.test(candidate)) {
		monitor.tail = candidate.slice(-1_000)
		return
	}
	monitor.tail = ''
	const now = Date.now()
	if (now - monitor.lastNotificationAt < monitor.debounceMs) return
	monitor.lastNotificationAt = now
	const notification = [
		`<shell_notification shell_id="${escapeXML(shell.id)}">`,
		`Reason: ${escapeXML(monitor.reason)}`,
		`Status: ${shell.done ? 'exited' : 'running'}`,
		'Matching output:',
		escapeXML(candidate.slice(-MAX_SHELL_NOTIFICATION_CHARS)),
		'</shell_notification>',
	].join('\n')
	void shell.ctx.ui
		.notify(`${monitor.reason} (shell ${shell.id})`)
		.catch((error) => shell.ctx.logger.log(`Failed to show shell output notification: ${String(error)}`))
	void shell.notificationThread
		.appendUserMessage(
			{
				type: 'user-message',
				content: notification,
			},
			{ steer: true },
		)
		.catch((error) => {
			const pending = pendingShellNotifications.get(shell.ctx.thread.id) ?? []
			pending.push(notification)
			pendingShellNotifications.set(shell.ctx.thread.id, pending)
			shell.ctx.logger.log(`Queued shell output notification for the next agent turn: ${String(error)}`)
		})
}

function appendShellOutput(shell: ManagedShell, output: string): void {
	notifyShellMonitor(shell, output)
	shell.output += output
	const excess = shell.output.length - MAX_SHELL_OUTPUT_CHARS
	if (excess > 0) {
		shell.outputTruncated ||= excess > shell.reportedLength
		shell.output = shell.output.slice(excess)
		shell.reportedLength = Math.max(0, shell.reportedLength - excess)
	}
	notifyShellWaiters(shell)
}

function finishShell(shell: ManagedShell, exitCode: number | null, signal: NodeJS.Signals | null): void {
	if (shell.done) return
	shell.done = true
	shell.exitCode = exitCode
	shell.signal = signal
	notifyShellWaiters(shell)
	setTimeout(() => {
		if (managedShells.get(shell.id) === shell) managedShells.delete(shell.id)
	}, 60 * 60 * 1_000).unref()
}

function waitForShellUpdate(shell: ManagedShell, timeoutMs: number): Promise<void> {
	return new Promise((resolve) => {
		let timer: NodeJS.Timeout
		const finish = () => {
			clearTimeout(timer)
			shell.waiters.delete(finish)
			resolve()
		}
		timer = setTimeout(finish, timeoutMs)
		shell.waiters.add(finish)
	})
}

async function waitForShell(
	shell: ManagedShell,
	timeoutMs: number,
	pattern?: string,
	returnOnOutput = true,
): Promise<void> {
	const regex = pattern === undefined ? null : new RegExp(pattern)
	const deadline = Date.now() + timeoutMs
	while (!shell.done) {
		const output = shell.output.slice(shell.reportedLength)
		if (regex) regex.lastIndex = 0
		if (regex?.test(output) || (returnOnOutput && regex === null && output.length > 0)) return
		const remaining = deadline - Date.now()
		if (remaining <= 0) return
		await waitForShellUpdate(shell, remaining)
	}
}

function formatShellResult(shell: ManagedShell): string {
	const output = shell.output.slice(shell.reportedLength).trimEnd()
	shell.reportedLength = shell.output.length
	const truncated = shell.outputTruncated
	shell.outputTruncated = false
	if (!shell.done) {
		return [truncated ? '[Earlier unreported output truncated]' : '', output, `Shell ID: ${shell.id}`, 'Status: running']
			.filter(Boolean)
			.join('\n')
	}

	const parts = [
		shell.error
			? `Error: ${shell.error}`
			: shell.signal
				? `Process exited by signal ${shell.signal}`
				: `Exit code: ${shell.exitCode ?? 0}`,
	]
	if (output || truncated) {
		const commandOutput = [truncated ? '[Earlier unreported output truncated]' : '', output]
			.filter(Boolean)
			.join('\n')
		parts.push(`Command output:\n\n\`\`\`\n${commandOutput}\n\`\`\``)
	}
	parts.push(`Command completed in ${Date.now() - shell.startedAt} ms.`)
	return parts.filter(Boolean).join('\n\n')
}

async function runManagedShell(
	amp: PluginAPI,
	input: Record<string, unknown>,
	ctx: PluginToolContext,
): Promise<string> {
	const id = `shell-${nextShellID++}`
	const command = requiredString(input, 'command')
	const workingDirectory = optionalString(input, 'working_directory') ?? WORKSPACE_ROOT
	const monitor = shellMonitor(input, ctx)
	const child = spawn('/bin/sh', ['-lc', command], {
		cwd: workingDirectory,
		env: process.env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const shell: ManagedShell = {
		id,
		startedAt: Date.now(),
		output: '',
		reportedLength: 0,
		outputTruncated: false,
		done: false,
		exitCode: null,
		signal: null,
		error: null,
		monitor,
		waiters: new Set(),
		ctx,
		notificationThread: amp.experimental?.threads.get(ctx.thread.id) ?? ctx.thread,
	}
	managedShells.set(id, shell)
	child.stdout?.setEncoding('utf8')
	child.stderr?.setEncoding('utf8')
	child.stdout?.on('data', (output: string) => appendShellOutput(shell, output))
	child.stderr?.on('data', (output: string) => appendShellOutput(shell, output))
	child.on('error', (error) => {
		shell.error = error.message
		finishShell(shell, null, null)
	})
	child.on('close', (exitCode, signal) => finishShell(shell, exitCode, signal))
	await waitForShell(shell, shellBlockDuration(input), undefined, false)
	const result = formatShellResult(shell)
	if (shell.done) managedShells.delete(id)
	return result
}

async function awaitShell(input: Record<string, unknown>, ctx: PluginToolContext): Promise<string> {
	const duration = shellBlockDuration(input)
	const shellID = optionalString(input, 'shell_id')
	if (!shellID) {
		await new Promise((resolve) => setTimeout(resolve, duration))
		return `Waited ${duration}ms.`
	}
	const shell = managedShells.get(shellID)
	if (!shell || shell.ctx.thread.id !== ctx.thread.id) {
		throw new Error(`Unknown or completed shell: ${shellID}`)
	}
	await waitForShell(shell, duration, optionalString(input, 'pattern'))
	const result = formatShellResult(shell)
	if (shell.done) managedShells.delete(shellID)
	return result
}

function shellQuote(value: string): string {
	return `'${value.replaceAll("'", "'\\''")}'`
}

function escapeXML(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function truncateOutput(value: string, limit: number, message: string): string {
	if (value.length <= limit) return value
	return `${value.slice(0, Math.max(0, limit - message.length))}${message}`
}

async function runCommand(amp: PluginAPI, command: string, workingDirectory?: string) {
	const directory = workingDirectory ?? WORKSPACE_ROOT
	const script = 'cd "$1" && exec /bin/sh -lc "$2"'
	return amp.$`/bin/sh -c ${script} sh ${directory} ${command}`
}

function grepCommand(input: Record<string, unknown>): string {
	const args = ['rg', '--color=never']
	const outputMode = optionalString(input, 'output_mode')
	if (outputMode === 'files_with_matches') args.push('--files-with-matches')
	else if (outputMode === 'count') args.push('--count')
	else args.push('--line-number')

	for (const option of ['-A', '-B', '-C'] as const) {
		const value = optionalNumber(input, option)
		if (value !== undefined) args.push(option, String(Math.max(0, Math.floor(value))))
	}
	if (input['-i'] === true) args.push('-i')
	if (input.multiline === true) args.push('-U', '--multiline-dotall')
	const glob = optionalString(input, 'glob')
	if (glob) args.push('--glob', glob)
	const type = optionalString(input, 'type')
	if (type) args.push('--type', type)
	args.push('--regexp', requiredString(input, 'pattern'), '--', optionalString(input, 'path') ?? '.')
	return args.map(shellQuote).join(' ')
}

async function grepTool(amp: PluginAPI, input: Record<string, unknown>): Promise<string> {
	const result = await runCommand(amp, grepCommand(input))
	if (result.exitCode !== 0 && result.exitCode !== 1) {
		throw new Error(result.stderr.trim() || `Grep exited with code ${result.exitCode}`)
	}

	const lines = result.stdout.trimEnd()
		? result.stdout
				.trimEnd()
				.split('\n')
				.map((line) => line.replaceAll(`${WORKSPACE_ROOT}/`, ''))
		: []
	const offset = Math.max(0, Math.floor(optionalNumber(input, 'offset') ?? 0))
	const requestedLimit = Math.max(0, Math.floor(optionalNumber(input, 'head_limit') ?? MAX_GREP_RESULT_LINES))
	const limit = Math.min(requestedLimit, MAX_GREP_RESULT_LINES)
	const end = Math.min(lines.length, offset + limit)
	const selected = lines.slice(offset, end)
	let content =
		lines.length === 0
			? 'No matches found'
			: selected.length === 0
				? 'No results in requested range.'
				: selected.join('\n')
	if (end < lines.length) content += `\n... ${lines.length - end} more results not shown ...`
	content = truncateOutput(
		content,
		MAX_GREP_OUTPUT_CHARS,
		'\n... output truncated; refine the search or use offset to continue ...',
	)
	return `<workspace_result workspace_path="${escapeXML(WORKSPACE_ROOT)}">\n${content}\n</workspace_result>`
}

async function readTool(input: Record<string, unknown>): Promise<PluginToolResult> {
	const path = requiredString(input, 'path')
	const data = await readFile(path).catch((error) => {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null
		throw error
	})
	if (!data) return 'Error: File not found'
	const mimeType =
		path.endsWith('.png')
			? 'image/png'
			: path.endsWith('.jpg') || path.endsWith('.jpeg')
				? 'image/jpeg'
				: path.endsWith('.gif')
					? 'image/gif'
					: path.endsWith('.webp')
						? 'image/webp'
						: undefined
	if (mimeType) return [{ type: 'image', mimeType, data: data.toString('base64') }]

	const lines = data.toString('utf8').split('\n')
	const requestedOffset = optionalNumber(input, 'offset') ?? 1
	const offset = Math.min(
		lines.length,
		Math.max(0, Math.floor(requestedOffset < 0 ? lines.length + requestedOffset : requestedOffset - 1)),
	)
	const requestedLimit = Math.max(0, Math.floor(optionalNumber(input, 'limit') ?? MAX_READ_LINES))
	const end = Math.min(lines.length, offset + Math.min(requestedLimit, MAX_READ_LINES))
	const output = []
	if (offset > 0) output.push(`... ${offset} lines not shown ...`)
	for (let index = offset; index < end; index++) {
		const lineNumber = index + 1
		const prefix = lineNumber % 10 === 0 ? `${String(lineNumber).padStart(6)}|` : ''
		output.push(`${prefix}${lines[index] ?? ''}`)
	}
	if (end < lines.length) output.push(`... ${lines.length - end} lines not shown ...`)
	return truncateOutput(
		output.join('\n'),
		MAX_READ_OUTPUT_CHARS,
		'\n... output truncated; use offset and limit to read more ...',
	)
}

async function globTool(amp: PluginAPI, input: Record<string, unknown>): Promise<string> {
	const directory = resolve(WORKSPACE_ROOT, optionalString(input, 'target_directory') ?? '.')
	const pattern = requiredString(input, 'glob_pattern')
	const command = ['rg', '--files', '--glob', pattern, '--', directory].map(shellQuote).join(' ')
	const result = await runCommand(amp, command)
	if (result.exitCode !== 0 && result.exitCode !== 1) {
		throw new Error(result.stderr.trim() || `Glob exited with code ${result.exitCode}`)
	}
	const paths = result.stdout.trimEnd() ? result.stdout.trimEnd().split('\n') : []
	const files = await Promise.all(
		paths.map(async (path) => {
			const absolutePath = resolve(directory, path)
			return {
				path: absolutePath,
				modifiedAt: await stat(absolutePath).then((info) => info.mtimeMs, () => 0),
			}
		}),
	)
	files.sort((a, b) => b.modifiedAt - a.modifiedAt || a.path.localeCompare(b.path))
	if (files.length === 0) return `Result of search in '${directory}': 0 files found\n`

	const displayed = files.slice(0, MAX_GLOB_RESULTS).map(({ path }) => `- ${relative(WORKSPACE_ROOT, path)}`)
	if (files.length > displayed.length) {
		displayed.push(`... ${files.length - displayed.length} more files not shown ...`)
	}
	return `Result of search in '${directory}' (total ${files.length} files):\n${displayed.join('\n')}\n`
}

async function replaceTool(input: Record<string, unknown>): Promise<string> {
	const path = requiredString(input, 'path')
	const oldString = requiredString(input, 'old_string')
	const newString = requiredString(input, 'new_string')
	if (oldString.length === 0) throw new Error('old_string must not be empty')
	const contents = await readFile(path, 'utf8')
	const matches = contents.split(oldString).length - 1
	if (matches === 0) throw new Error('The string to replace was not found in the file.')
	if (matches > 1 && input.replace_all !== true) {
		throw new Error('The string to replace was found multiple times in the file.')
	}
	const updated = input.replace_all === true ? contents.replaceAll(oldString, newString) : contents.replace(oldString, newString)
	await writeFile(path, updated)
	return input.replace_all === true
		? `${matches} occurrences of the specified string were successfully replaced in ${path}.`
		: `The specified string was successfully replaced in ${path}.`
}

async function askQuestion(input: Record<string, unknown>, ctx: PluginToolContext): Promise<string> {
	if (!Array.isArray(input.questions)) throw new Error('questions must be an array')
	const answers: Array<{ id: string; answer: string }> = []
	for (const question of input.questions) {
		if (typeof question !== 'object' || question === null) continue
		const record = question as Record<string, unknown>
		if (!Array.isArray(record.options)) continue
		const options = record.options.flatMap((option) => {
			if (typeof option !== 'object' || option === null) return []
			const label = optionalString(option as Record<string, unknown>, 'label')
			return label ? [label] : []
		})
		const answer = await ctx.ui.select({ title: requiredString(record, 'prompt'), options })
		answers.push({ id: requiredString(record, 'id'), answer: answer ?? 'User dismissed the question.' })
	}
	return JSON.stringify({ answers })
}

async function executeGrokTool(
	amp: PluginAPI,
	agent: Agent,
	toolName: string,
	input: Record<string, unknown>,
	ctx: PluginToolContext,
): Promise<PluginToolResult | void> {
	switch (toolName) {
		case 'Shell':
			return runManagedShell(amp, input, ctx)
		case 'Grep':
			return grepTool(amp, input)
		case 'Delete': {
			const path = requiredString(input, 'path')
			await unlink(path)
			return `Successfully deleted file: ${path}`
		}
		case 'TodoWrite':
			return `Todos updated:\n${JSON.stringify(input.todos, null, 2)}`
		case 'StrReplace':
			return replaceTool(input)
		case 'Write': {
			const path = requiredString(input, 'path')
			await writeFile(path, requiredString(input, 'contents'))
			return `Wrote file successfully to ${path}`
		}
		case 'Read':
			return readTool(input)
		case 'Glob':
			return globTool(amp, input)
		case 'Task':
			return (await agent.run(requiredString(input, 'prompt'), { parentThreadID: ctx.thread.id })).text
		case 'AskQuestion':
			return askQuestion(input, ctx)
		case 'Await':
			return awaitShell(input, ctx)
		case 'update_goal':
			return `Goal updated: ${JSON.stringify(input)}`
	}
}

export default function (amp: PluginAPI) {
	const experimental = amp.experimental
	return // TODO(sqs): disable for now, it leaks tools and we do not have a way of defining tools just for this one


	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}
	amp.on('agent.end', (event) => {
		const notifications = pendingShellNotifications.get(event.thread.id)
		if (!notifications || notifications.length === 0) return
		pendingShellNotifications.delete(event.thread.id)
		return { action: 'continue', userMessage: notifications.join('\n\n') }
	})

	let agent: Agent
	for (const tool of GROK_TOOL_SPECS) {
		amp.registerTool({
			...tool,
			execute: (input, ctx) => executeGrokTool(amp, agent, tool.name, input, ctx),
		})
	}

	agent = amp.experimental.createAgent({
		model: 'xai/grok-composer-2.5-fast',
		instructions: COMPOSER_25_AGENT_PROMPT,
		tools: [...GROK_TOOL_SPECS.map((tool) => tool.name), ...AMP_BUILTIN_TOOL_NAMES, 'mcp__*'],
		display: { label: 'Composer 2.5', color: '#f97316' },
	})

	amp.experimental.registerAgentMode({
		key: 'composer-2-5',
		label: 'Composer 2.5',
		description: 'Cursor Composer 2.5 Fast via the SpaceXAI Grok subscription proxy',
		color: '#f97316',
		agent: agent.definition,
	})
}
