#!/usr/bin/env bun

import { readFileSync } from 'node:fs'

import registerOfficialModes from './index'

const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
const headers = [...source.matchAll(/^\/\/ @amp-agent-mode (\{.*\})$/gm)].map(
	(match) => JSON.parse(match[1]),
)
const expectedModes = [
	{
		key: 'claude-fable-5-1',
		label: 'Claude Fable 5.1',
		model: 'anthropic/claude-fable-5-1',
	},
	{
		key: 'claude-sonnet-5',
		label: 'Claude Sonnet 5',
		model: 'anthropic/claude-sonnet-5',
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

const opusAgent = createdAgents.find(({ name }) => name === 'claude-opus-5')
if (!opusAgent?.instructions || !opusAgent.tools) {
	throw new Error('Missing Claude Opus 5 prompt or tools')
}

for (const expected of expectedModes) {
	const matchingHeaders = headers.filter(({ key }) => key === expected.key)
	const [header] = matchingHeaders
	if (
		matchingHeaders.length !== 1 ||
		header.label !== expected.label ||
		header.color !== '#d97757'
	) {
		throw new Error(`Invalid discovery metadata for ${expected.key}`)
	}

	const matchingAgents = createdAgents.filter(
		({ name }) => name === expected.key,
	)
	const [agent] = matchingAgents
	if (
		matchingAgents.length !== 1 ||
		agent.model !== expected.model ||
		agent.reasoningEffort !== 'high' ||
		agent.instructions !== opusAgent?.instructions ||
		agent.tools !== opusAgent?.tools
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
}

console.log('Claude Fable 5.1 and Sonnet 5 metadata and registrations match')
