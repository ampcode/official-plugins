#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const indexSource = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
const gpt56Source = readFileSync(new URL('./modes/gpt-56.ts', import.meta.url), 'utf8')

const registration = indexSource.match(
	/function registerDaybreakBlue\(amp: PluginAPI\) \{([\s\S]*?)\n\}/,
)?.[1]
if (!registration?.includes('tools: GPT_56_TOOL_NAMES')) {
	throw new Error('Daybreak Blue declaration does not use GPT_56_TOOL_NAMES')
}

const gpt56Tools = gpt56Source.match(
	/export const GPT_56_TOOL_NAMES = \[([\s\S]*?)\] as const/,
)?.[1]
if (!gpt56Tools) throw new Error('GPT_56_TOOL_NAMES was not found')

for (const tool of ['Task', 'create_thread']) {
	if (!gpt56Tools.includes(`'${tool}'`)) {
		throw new Error(`Daybreak Blue declaration is missing ${tool}`)
	}
}

console.log('Daybreak Blue declaration includes Task and create_thread')
