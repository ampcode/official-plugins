#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const indexSource = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')

const registration = indexSource.match(
	/function registerDaybreakBlue\(amp: PluginAPI\) \{([\s\S]*?)\n\}/,
)?.[1]
if (!registration) throw new Error('Daybreak Blue registration was not found')

for (const line of [
	"extends: 'high'",
	"model: 'openai/gpt-daybreak-blue-latest'",
	"reasoningEffort: 'high'",
]) {
	if (!registration.includes(line)) {
		throw new Error(`Daybreak Blue declaration is missing ${line}`)
	}
}

console.log('Daybreak Blue declaration extends Amp High like GPT-6 Sol')
