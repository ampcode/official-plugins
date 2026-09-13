#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const indexSource = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
const museSparkSource = readFileSync(new URL('./modes/muse-spark.ts', import.meta.url), 'utf8')

const registration = indexSource.match(
	/function registerMuseSpark\(amp: PluginAPI\) \{([\s\S]*?)\n\}/,
)?.[1]
if (!registration?.includes('tools: MUSE_SPARK_TOOL_NAMES')) {
	throw new Error('Muse Spark declaration does not use MUSE_SPARK_TOOL_NAMES')
}

const museSparkTools = museSparkSource.match(
	/export const MUSE_SPARK_TOOL_NAMES = \[([\s\S]*?)\] as const/,
)?.[1]
if (!museSparkTools) throw new Error('MUSE_SPARK_TOOL_NAMES was not found')

// Child threads inherit the parent's agent mode, so a Muse Spark thread that creates
// threads also needs the tools to hear back from them and to reply as a child.
const requiredThreadTools = [
	'Task',
	'create_thread',
	'get_thread_status',
	'send_thread_message',
	'wait_for_threads',
]

for (const tool of requiredThreadTools) {
	if (!museSparkTools.includes(`'${tool}'`)) {
		throw new Error(`Muse Spark declaration is missing ${tool}`)
	}
}

console.log(`Muse Spark declaration includes ${requiredThreadTools.join(', ')}`)
