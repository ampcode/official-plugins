// @amp-agent-mode {"key":"claude-opus-5","label":"Claude Opus 5","color":"#d97757"}
// @amp-agent-mode {"key":"deepseek-v4-flash","label":"DeepSeek V4 Flash","color":"#60a5fa"}
// @amp-agent-mode {"key":"deepseek-v4-pro","label":"DeepSeek V4 Pro","color":"#2563eb"}
// @amp-agent-mode {"key":"glm-5.2","label":"GLM 5.2 (exp)","color":"#10a37f"}
// @amp-agent-mode {"key":"glm-5.3-flash","label":"GLM 5.3 Flash","color":"#84cc16"}
// @amp-agent-mode {"key":"gpt56s-pro","label":"GPT-5.6 Sol Pro","color":"#14b8a6","features":["pro"]}
// @amp-agent-mode {"key":"grok45","label":"Grok 4.5","color":"#10b981"}
// @amp-agent-mode {"key":"grok46","label":"Grok 4.6","color":"#0ea5e9"}
// @amp-agent-mode {"key":"kimi-k3","label":"Kimi K3","color":"#3b82f6"}
// @amp-agent-mode {"key":"muse-spark","label":"Muse Spark 1.3","color":"#0668e1"}
// @amp-agent-mode {"key":"minimax-m3","label":"MiniMax M3","color":"#f97316"}
// @amp-agent-mode {"key":"qwen3.8-max","label":"Qwen3.8 Max","color":"#a855f7"}

/**
 * Official Amp agent modes, served to every user.
 *
 * All modes live in one plugin so the CLI starts a single plugin process instead of one per
 * mode. Each `@amp-agent-mode` header above must match the `key`/`label` of a
 * `registerAgentMode` call below; the server reads the headers to list modes before the
 * plugin runs. Each mode registers inside its own try/catch so one failure does not remove
 * the others.
 * Prompts and tool lists live in `modes/` so this directory plugin is not limited by the
 * single-file plugin transport.
 */

import type { PluginAPI } from '@ampcode/plugin'

import {
	DEEPSEEK_V4_FLASH_AGENT_PROMPT,
	DEEPSEEK_V4_FLASH_TOOL_NAMES,
} from './modes/deepseek-v4-flash'
import {
	DEEPSEEK_V4_PRO_AGENT_PROMPT,
	DEEPSEEK_V4_PRO_TOOL_NAMES,
} from './modes/deepseek-v4-pro'
import { GLM_52_AGENT_PROMPT, GLM_52_TOOL_NAMES } from './modes/glm-52'
import { GLM_53_FLASH_AGENT_PROMPT, GLM_53_FLASH_TOOL_NAMES } from './modes/glm-53-flash'
import { GPT_56_AGENT_PROMPT, GPT_56_TOOL_NAMES } from './modes/gpt-56'
import { GROK_45_PROMPT, GROK_45_TOOL_NAMES } from './modes/grok-45'
import { GROK_46_PROMPT, GROK_46_TOOL_NAMES } from './modes/grok-46'
import { KIMI_K3_AGENT_PROMPT, KIMI_K3_TOOL_NAMES } from './modes/kimi-k3'
import { MINIMAX_M3_AGENT_PROMPT, MINIMAX_M3_TOOL_NAMES } from './modes/minimax-m3'
import { MUSE_SPARK_AGENT_PROMPT, MUSE_SPARK_TOOL_NAMES } from './modes/muse-spark'
import { OPUS_AGENT_PROMPT, OPUS_TOOL_NAMES } from './modes/opus'
import { QWEN_38_MAX_AGENT_PROMPT, QWEN_38_MAX_TOOL_NAMES } from './modes/qwen-38-max'

// ───── Claude Opus 5 (claude-opus-5) ─────

function registerClaudeOpus5(amp: PluginAPI) {
	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}

	const agent = amp.experimental.createAgent({
		name: 'claude-opus-5',
		model: 'anthropic/claude-opus-5',
		instructions: OPUS_AGENT_PROMPT,
		tools: OPUS_TOOL_NAMES,
		reasoningEffort: 'high',
		display: { label: 'Claude Opus 5', color: '#d97757' },
	})

	amp.experimental.registerAgentMode({
		key: 'claude-opus-5',
		label: 'Claude Opus 5',
		description: 'Claude Opus 5 at high',
		color: '#d97757',
		agent: agent.definition,
	})
}

// ───── DeepSeek V4 Pro (deepseek-v4-pro) ─────

function registerDeepSeekV4Pro(amp: PluginAPI) {
	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}

	const agent = amp.experimental.createAgent({
		name: 'deepseek-v4-pro',
		model: 'deepseek/deepseek-v4-pro',
		instructions: DEEPSEEK_V4_PRO_AGENT_PROMPT,
		tools: DEEPSEEK_V4_PRO_TOOL_NAMES,
		reasoningEffort: 'high',
		display: { label: 'DeepSeek V4 Pro', color: '#2563eb' },
	})

	amp.experimental.registerAgentMode({
		key: 'deepseek-v4-pro',
		label: 'DeepSeek V4 Pro',
		description: 'DeepSeek V4 Pro (0813) on Fireworks',
		color: '#2563eb',
		agent: agent.definition,
	})
}

// ───── DeepSeek V4 Flash (deepseek-v4-flash) ─────

function registerDeepSeekV4Flash(amp: PluginAPI) {
	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}

	const agent = amp.experimental.createAgent({
		name: 'deepseek-v4-flash',
		model: 'deepseek/deepseek-v4-flash',
		instructions: DEEPSEEK_V4_FLASH_AGENT_PROMPT,
		tools: DEEPSEEK_V4_FLASH_TOOL_NAMES,
		reasoningEffort: 'max',
		display: { label: 'DeepSeek V4 Flash', color: '#60a5fa' },
	})

	amp.experimental.registerAgentMode({
		key: 'deepseek-v4-flash',
		label: 'DeepSeek V4 Flash',
		description: 'DeepSeek V4 Flash (0731) on Fireworks',
		color: '#60a5fa',
		agent: agent.definition,
	})
}

// ───── GLM 5.2 (exp) (glm-5.2) ─────

function registerGLM52(amp: PluginAPI) {
	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}

	const agent = amp.experimental.createAgent({
		name: 'glm-5.2',
		model: 'zhipuai/glm-5.2',
		instructions: GLM_52_AGENT_PROMPT,
		tools: GLM_52_TOOL_NAMES,
		reasoningEffort: 'max',
		display: { label: 'GLM 5.2 (exp)', color: '#10a37f' },
	})

	amp.experimental.registerAgentMode({
		key: 'glm-5.2',
		label: 'GLM 5.2 (exp)',
		description: 'Experimental GLM 5.2-driven agent mode.',
		color: '#10a37f',
		agent: agent.definition,
	})
}

// ───── GLM 5.3 Flash (glm-5.3-flash) ─────

function registerGLM53Flash(amp: PluginAPI) {
	const agent = amp.createAgent({
		name: 'glm-5.3-flash',
		model: 'zhipuai/glm-5.3-flash',
		instructions: GLM_53_FLASH_AGENT_PROMPT,
		tools: GLM_53_FLASH_TOOL_NAMES,
		reasoningEffort: 'high',
		display: { label: 'GLM 5.3 Flash', color: '#84cc16' },
	})

	amp.registerAgentMode({
		key: 'glm-5.3-flash',
		label: 'GLM 5.3 Flash',
		description: 'GLM 5.3 Flash on Fireworks: fast, multimodal, for small well-defined tasks',
		color: '#84cc16',
		agent: agent.definition,
	})
}

// ───── GPT-5.6 Sol Pro (gpt56s-pro) ─────

function registerGPT56SolPro(amp: PluginAPI) {
	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}

	const proAgent = amp.experimental.createAgent({
		name: 'gpt-5.6-sol-pro',
		model: 'openai/gpt-5.6-sol',
		instructions: GPT_56_AGENT_PROMPT,
		tools: GPT_56_TOOL_NAMES,
		reasoningEffort: 'high',
		features: ['pro'],
		display: { label: 'GPT-5.6 Sol Pro', color: '#14b8a6' },
	})

	amp.experimental.registerAgentMode({
		key: 'gpt56s-pro',
		label: 'GPT-5.6 Sol Pro',
		description: 'GPT-5.6 Sol Pro at high effort (OpenAI API only)',
		color: '#14b8a6',
		agent: proAgent.definition,
	})
}

// ───── Grok 4.5 (grok45) ─────

function registerGrok45(amp: PluginAPI) {
	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}

	const agent = amp.experimental.createAgent({
		name: 'grok-4-5',
		model: 'xai/grok-4.5',
		instructions: GROK_45_PROMPT,
		tools: GROK_45_TOOL_NAMES,
		reasoningEffort: 'high',
		display: { label: 'Grok 4.5', color: '#10b981' },
	})

	amp.experimental.registerAgentMode({
		key: 'grok45',
		label: 'Grok 4.5',
		description: 'Grok 4.5 with deep-mode tools and a minimal prompt',
		color: '#10b981',
		agent: agent.definition,
	})
}

// ───── Grok 4.6 (grok46) ─────

function registerGrok46(amp: PluginAPI) {
	if (!amp.experimental) {
		amp.logger.log('Experimental plugin API is not available.')
		return
	}

	const agent = amp.experimental.createAgent({
		name: 'grok-4-6',
		model: 'xai/grok-4.6',
		instructions: GROK_46_PROMPT,
		tools: GROK_46_TOOL_NAMES,
		reasoningEffort: 'high',
		compactionThresholdTokens: 300_000,
		display: { label: 'Grok 4.6', color: '#0ea5e9' },
	})

	amp.experimental.registerAgentMode({
		key: 'grok46',
		label: 'Grok 4.6',
		description: 'Grok 4.6 with the ultra system prompt and ultra tool set',
		color: '#0ea5e9',
		agent: agent.definition,
	})
}

// ───── Kimi K3 (kimi-k3) ─────

function registerKimiK3(amp: PluginAPI) {
	const agent = amp.createAgent({
		name: 'kimi-k3',
		model: 'fireworks-ai/accounts/fireworks/models/kimi-k3',
		instructions: KIMI_K3_AGENT_PROMPT,
		tools: KIMI_K3_TOOL_NAMES,
		reasoningEffort: 'max',
		display: { label: 'Kimi K3', color: '#3b82f6' },
	})

	amp.registerAgentMode({
		key: 'kimi-k3',
		label: 'Kimi K3',
		description: 'Kimi K3 on Fireworks',
		color: '#3b82f6',
		agent: agent.definition,
	})
}

// ───── Muse Spark 1.3 (muse-spark) ─────

function registerMuseSpark(amp: PluginAPI) {
	const agent = amp.createAgent({
		name: 'muse-spark',
		model: 'meta/muse-spark-1.3',
		instructions: MUSE_SPARK_AGENT_PROMPT,
		tools: MUSE_SPARK_TOOL_NAMES,
		reasoningEffort: 'xhigh',
		display: { label: 'Muse Spark 1.3', color: '#0668e1' },
	})

	amp.registerAgentMode({
		key: 'muse-spark',
		label: 'Muse Spark 1.3',
		description: 'Muse Spark 1.3 at xhigh',
		color: '#0668e1',
		agent: agent.definition,
	})
}

// ───── MiniMax M3 (minimax-m3) ─────

function registerMiniMaxM3(amp: PluginAPI) {
	const agent = amp.createAgent({
		name: 'minimax-m3',
		model: 'minimax/MiniMax-M3',
		instructions: MINIMAX_M3_AGENT_PROMPT,
		tools: MINIMAX_M3_TOOL_NAMES,
		reasoningEffort: 'high',
		display: { label: 'MiniMax M3', color: '#f97316' },
	})

	amp.registerAgentMode({
		key: 'minimax-m3',
		label: 'MiniMax M3',
		description: 'MiniMax M3 on Fireworks',
		color: '#f97316',
		agent: agent.definition,
	})
}

// ───── Qwen3.8 Max (qwen3.8-max) ─────

function registerQwen38Max(amp: PluginAPI) {
	const agent = amp.createAgent({
		name: 'qwen3.8-max',
		model: 'alibaba/qwen3.8-max',
		instructions: QWEN_38_MAX_AGENT_PROMPT,
		tools: QWEN_38_MAX_TOOL_NAMES,
		reasoningEffort: 'xhigh',
		display: { label: 'Qwen3.8 Max', color: '#a855f7' },
	})

	amp.registerAgentMode({
		key: 'qwen3.8-max',
		label: 'Qwen3.8 Max',
		description: 'Qwen3.8 Max on Fireworks',
		color: '#a855f7',
		agent: agent.definition,
	})
}

// ───── Registration ─────

const MODE_REGISTRARS: Record<string, (amp: PluginAPI) => void> = {
	'claude-opus-5': registerClaudeOpus5,
	'deepseek-v4-flash': registerDeepSeekV4Flash,
	'deepseek-v4-pro': registerDeepSeekV4Pro,
	'glm-5.2': registerGLM52,
	'glm-5.3-flash': registerGLM53Flash,
	'gpt56s-pro': registerGPT56SolPro,
	'grok45': registerGrok45,
	'grok46': registerGrok46,
	'kimi-k3': registerKimiK3,
	'muse-spark': registerMuseSpark,
	'minimax-m3': registerMiniMaxM3,
	'qwen3.8-max': registerQwen38Max,
}

export default function (amp: PluginAPI) {
	for (const [key, register] of Object.entries(MODE_REGISTRARS)) {
		try {
			register(amp)
		} catch (error) {
			amp.logger.log(`Failed to register agent mode ${key}:`, error)
		}
	}
}
