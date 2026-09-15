#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'

const modesDirectory = new URL('./modes/', import.meta.url)

for (const file of readdirSync(modesDirectory).filter((file) => file.endsWith('.ts'))) {
	const source = readFileSync(new URL(file, modesDirectory), 'utf8')
	const tools = source.match(
		/export const [A-Z0-9_]+_TOOL_NAMES = \[([\s\S]*?)\] as const/,
	)?.[1]
	if (!tools) throw new Error(`${file} does not declare a tool list`)
	if (!tools.includes("'update_thread'")) {
		throw new Error(`${file} is missing update_thread`)
	}
	if (tools.includes("'archive_current_thread'")) {
		throw new Error(`${file} still uses archive_current_thread`)
	}
}

console.log('Every explicit mode tool list uses update_thread for Ship archival')
