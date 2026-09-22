#!/usr/bin/env bun

import { readFileSync } from 'node:fs'

import registerOfficialModes from './index'

const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
const headers = [...source.matchAll(/^\/\/ @amp-agent-mode (\{.*\})$/gm)].map(
	(match) => JSON.parse(match[1]),
)
const expectedModes = [
	{
		key: 'gpt6l',
		label: 'GPT-6 Luna',
		name: 'gpt-6-luna',
		model: 'openai/gpt-6-luna',
		extends: 'low',
		reasoningEffort: 'medium',
	},
	{
		key: 'gpt6s',
		label: 'GPT-6 Sol',
		name: 'gpt-6-sol',
		model: 'openai/gpt-6-sol',
		extends: 'high',
		reasoningEffort: 'high',
	},
]

const createdAgents: Record<string, unknown>[] = []
const registeredModes: Record<string, unknown>[] = []
const createAgent = (definition: Record<string, unknown>) => {
	createdAgents.push(definition)
	return { definition }
}
const registerAgentMode = (mode: Record<string, unknown>) =>
	registeredModes.push(mode)
const amp = {
	createAgent,
	registerAgentMode,
	experimental: { createAgent, registerAgentMode },
	logger: { log() {} },
}

registerOfficialModes(amp as never)

for (const expected of expectedModes) {
	const matchingHeaders = headers.filter(({ key }) => key === expected.key)
	const [header] = matchingHeaders
	if (
		matchingHeaders.length !== 1 ||
		header.label !== expected.label ||
		header.color !== '#14b8a6'
	) {
		throw new Error(`Invalid discovery metadata for ${expected.key}`)
	}

	const matchingAgents = createdAgents.filter(
		({ name }) => name === expected.name,
	)
	const [agent] = matchingAgents
	if (
		matchingAgents.length !== 1 ||
		agent.model !== expected.model ||
		agent.extends !== expected.extends ||
		agent.reasoningEffort !== expected.reasoningEffort
	) {
		throw new Error(`Invalid runtime agent for ${expected.key}`)
	}

	const matchingModes = registeredModes.filter(
		({ key }) => key === expected.key,
	)
	const [mode] = matchingModes
	if (
		matchingModes.length !== 1 ||
		mode.label !== expected.label ||
		mode.agent !== agent
	) {
		throw new Error(`Missing runtime mode registration for ${expected.key}`)
	}

	if (!source.includes(`'${expected.key}': registerGPT6`)) {
		throw new Error(`Missing registrar for ${expected.key}`)
	}
}

console.log('GPT-6 Sol and Luna metadata and registrations match')
