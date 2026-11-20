// The ONLY place that knows which inference provider is used: any OpenAI-compatible
// chat-completions endpoint (Groq by default). Configure it in .env (see .env.example).
// Plain non-streaming fetch keeps this free of stream polyfills on Hermes.
import * as Haptics from 'expo-haptics'
import { callTool, listTools } from '../mcp/server'

const API_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY ?? ''
const MODEL = process.env.EXPO_PUBLIC_LLM_MODEL || 'openai/gpt-oss-20b'
const BASE_URL = process.env.EXPO_PUBLIC_LLM_BASE_URL || 'https://api.groq.com/openai/v1'

export const hasApiKey = API_KEY !== ''

type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
export type LlmMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string }

export type AgentEvent =
  | { type: 'tool'; name: string; args: string; result: string }
  | { type: 'reply'; text: string }

const MAX_STEPS = 6
const MAX_RETRIES = 3

// POSTs a chat completion; on a rate limit (429) waits as long as the provider asks and tries again.
const complete = async (body: object): Promise<Response> => {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
    })
    if (res.ok) return res
    const text = await res.text()
    if (res.status === 429 && attempt < MAX_RETRIES) {
      const asked = /try again in ([\d.]+)s/i.exec(text)
      await new Promise(r => setTimeout(r, Math.min(15, asked ? parseFloat(asked[1]) + 0.5 : 3) * 1000))
      continue
    }
    throw new Error(`LLM ${res.status}: ${text.slice(0, 300)}`)
  }
}

// Lets the model call MCP tools until it answers in plain text. The phone vibrates on every tool call.
export const runAgent = async (
  system: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  onEvent: (e: AgentEvent) => void,
): Promise<void> => {
  const tools = await listTools()
  const messages: LlmMessage[] = [{ role: 'system', content: system }, ...history]

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await complete({
      model: MODEL,
      messages,
      tools,
      max_tokens: 1200,
      ...(MODEL.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
    })
    const msg = (await res.json()).choices?.[0]?.message
    if (!msg) throw new Error('LLM returned no message')

    const calls: ToolCall[] = msg.tool_calls ?? []
    if (calls.length === 0) {
      onEvent({ type: 'reply', text: msg.content ?? '' })
      return
    }

    // Echo only the fields providers accept (e.g. Groq rejects `reasoning_content` on input).
    messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: calls })
    for (const call of calls) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})
      let result: string
      try {
        result = await callTool(call.function.name, JSON.parse(call.function.arguments || '{}'))
      } catch (e) {
        result = JSON.stringify({ error: String((e as Error)?.message ?? e) })
      }
      onEvent({ type: 'tool', name: call.function.name, args: call.function.arguments, result })
      messages.push({ role: 'tool', tool_call_id: call.id, content: result })
    }
  }
  onEvent({ type: 'reply', text: '(Przerwano: za dużo wywołań narzędzi.)' })
}
