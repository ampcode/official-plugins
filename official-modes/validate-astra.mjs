#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
const modes = [
	{
		key: 'astra',
		label: 'GPT-6 Astra',
		name: 'gpt-6-astra',
		extends: 'medium',
		effort: 'medium',
		suffix: '',
	},
	{
		key: 'gpt-6-astra-low',
		label: 'GPT-6 Astra Low',
		name: 'gpt-6-astra-low',
		extends: 'low',
		effort: 'low',
		suffix: 'Low',
	},
	{
		key: 'gpt-6-astra-medium',
		label: 'GPT-6 Astra Medium',
		name: 'gpt-6-astra-medium',
		extends: 'medium',
		effort: 'medium',
		suffix: 'Medium',
	},
	{
		key: 'gpt-6-astra-high',
		label: 'GPT-6 Astra High',
		name: 'gpt-6-astra-high',
		extends: 'high',
		effort: 'high',
		suffix: 'High',
	},
	{
		key: 'gpt-6-astra-xhigh',
		label: 'GPT-6 Astra XHigh',
		name: 'gpt-6-astra-xhigh',
		extends: 'high',
		effort: 'xhigh',
		suffix: 'XHigh',
	},
	{
		key: 'gpt-6-astra-max',
		label: 'GPT-6 Astra Max',
		name: 'gpt-6-astra-max',
		extends: 'ultra',
		effort: 'max',
		suffix: 'Max',
	},
]

const headers = [...source.matchAll(/^\/\/ @amp-agent-mode (\{.*\})$/gm)].map((match) =>
	JSON.parse(match[1]),
)
const headerKeys = headers.map(({ key }) => key)
if (new Set(headerKeys).size !== headerKeys.length) throw new Error('Duplicate mode header key')

for (const mode of modes) {
	const header = headers.find(({ key }) => key === mode.key)
	if (!header || header.label !== mode.label) throw new Error(`Invalid header for ${mode.key}`)

	const block = source.match(
		new RegExp(
			`function registerGPT6Astra${mode.suffix}\\(amp: PluginAPI\\) \\{([\\s\\S]*?)\\n\\}`,
		),
	)?.[1]
	for (const expected of [
		`name: '${mode.name}'`,
		`extends: '${mode.extends}'`,
		"model: 'openai/gpt-6-astra'",
		`reasoningEffort: '${mode.effort}'`,
		`key: '${mode.key}'`,
		`label: '${mode.label}'`,
	]) {
		if (!block?.includes(expected)) throw new Error(`${mode.key} is missing ${expected}`)
	}
	if (block.includes('instructions:') || block.includes('tools:')) {
		throw new Error(`${mode.key} overrides inherited prompt or tools`)
	}
	if (!source.includes(`'${mode.key}': registerGPT6Astra${mode.suffix}`)) {
		throw new Error(`Missing registrar for ${mode.key}`)
	}
}

console.log('Astra headers and registrations uniquely match model, effort, and inherited Amp mode')
