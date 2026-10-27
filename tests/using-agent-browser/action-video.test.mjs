import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

const recorder = resolve('skills/using-agent-browser/scripts/action-video.mjs')

test('recording keeps either restore or the specified allowlist across commands', (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'action-video-test-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const log = join(dir, 'calls.jsonl')
	writeFileSync(
		join(dir, 'agent-browser'),
		`#!/usr/bin/env node
const fs = require('node:fs')
fs.appendFileSync(process.env.CALL_LOG, JSON.stringify(process.argv.slice(2)) + '\\n')
if (process.argv.includes('--json')) console.log(JSON.stringify({data: {result: true}}))
`,
		{ mode: 0o755 },
	)
	writeFileSync(
		join(dir, 'ffprobe'),
		`#!/usr/bin/env node
console.log(JSON.stringify({format: {duration: '1'}, streams: [{codec_type: 'video'}]}))
`,
		{ mode: 0o755 },
	)
	writeFileSync(join(dir, 'ffmpeg'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })
	const env = {
		...process.env,
		PATH: `${dir}:${process.env.PATH}`,
		TMPDIR: dir,
		CALL_LOG: log,
		ACTION_VIDEO_SESSION: 'test',
		AGENT_BROWSER_NAMESPACE: 'test',
		AGENT_BROWSER_ALLOWED_DOMAINS: '',
		AGENT_BROWSER_RESTORE: '',
		AGENT_BROWSER_SESSION_NAME: '',
	}
	const run = (args, overrides = {}) => {
		const result = spawnSync(process.execPath, [recorder, ...args], {
			cwd: dir,
			env: { ...env, ...overrides },
			encoding: 'utf8',
		})
		assert.equal(result.status, 0, result.stderr)
	}
	const calls = () => readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse)
	for (const [mode, startArgs, overrides] of [
		['restore', [], {}],
		['allowlist', ['--allowed-domains', 'localhost,127.0.0.1'], {}],
		['allowlist', [], { AGENT_BROWSER_ALLOWED_DOMAINS: 'localhost,127.0.0.1' }],
	]) {
		writeFileSync(log, '')
		run(['start', join(dir, 'raw.mp4'), ...startArgs], overrides)
		// The start choice remains in effect even when the environment changes later.
		run(['click', 'button'])
		run(['stop', join(dir, 'out.mp4')])
		const commands = calls()
		assert.equal(commands.length, 4)
		for (const args of commands) {
			assert.equal(args.includes('--restore'), mode === 'restore')
			const index = args.indexOf('--allowed-domains')
			assert.equal(index !== -1, mode === 'allowlist')
			if (index !== -1) assert.equal(args[index + 1], 'localhost,127.0.0.1')
		}
	}
	writeFileSync(log, '')
	const conflict = spawnSync(
		process.execPath,
		[recorder, 'start', join(dir, 'raw.mp4'), '--allowed-domains', 'localhost'],
		{ cwd: dir, env: { ...env, AGENT_BROWSER_RESTORE: 'test' }, encoding: 'utf8' },
	)
	assert.equal(conflict.status, 1)
	assert.match(conflict.stderr, /Unset AGENT_BROWSER_RESTORE/)
	assert.equal(readFileSync(log, 'utf8'), '')
})
