#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'

const modesDirectory = new URL('./modes/', import.meta.url)
const requiredTools = [
	'create_thread',
	'get_thread_status',
	'send_thread_message',
	'update_thread',
	'wait_for_threads',
]

for (const file of readdirSync(modesDirectory).filter((file) =>
	file.endsWith('.ts'),
)) {
	const source = readFileSync(new URL(file, modesDirectory), 'utf8')
	let tools = source.match(
		/export const [A-Z0-9_]+_TOOL_NAMES = \[([\s\S]*?)\] as const/,
	)?.[1]
	const inheritedToolList = source.match(
		/[A-Z0-9_]+_TOOL_NAMES as [A-Z0-9_]+_TOOL_NAMES[\s\S]*?from '\.\/([^']+)'/,
	)?.[1]
	if (!tools && inheritedToolList) {
		const inheritedSource = readFileSync(
			new URL(`${inheritedToolList}.ts`, modesDirectory),
			'utf8',
		)
		tools = inheritedSource.match(
			/export const [A-Z0-9_]+_TOOL_NAMES = \[([\s\S]*?)\] as const/,
		)?.[1]
	}
	if (!tools) throw new Error(`${file} does not declare a tool list`)
	for (const tool of requiredTools) {
		if (!tools.includes(`'${tool}'`))
			throw new Error(`${file} is missing ${tool}`)
	}
	if (tools.includes("'archive_current_thread'")) {
		throw new Error(`${file} still uses archive_current_thread`)
	}
}

console.log(
	'Every explicit mode tool list includes thread coordination and Ship archival tools',
)
