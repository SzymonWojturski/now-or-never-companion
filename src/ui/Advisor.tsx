import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { CutPanel } from './CutPanel'
import { Bracket } from './Filigree'
import { hasApiKey, runAgent } from '../llm/client'
import { buildSystemPrompt } from '../llm/prompt'
import { useGame } from '../state/GameState'
import { edgeSolve, edgeStrong, fillLedger, fillSolve, fonts, palette, shadow } from '../theme/theme'

type Item =
  | { id: number; kind: 'user' | 'assistant'; text: string }
  | { id: number; kind: 'tool'; name: string; result: string }

const MAX_HISTORY = 6 // only the last messages go to the model (provider tokens-per-minute limits)

// Models like to emit markdown; the bubbles are plain text.
const plain = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^#+\s*/gm, '')

export function Advisor({ style }: { style?: object }) {
  const { game, pendingPrompt, clearPrompt } = useGame()
  const [items, setItems] = useState<Item[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const nextId = useRef(0)
  const list = useRef<FlatList<Item>>(null)

  const send = useCallback(async (raw: string) => {
    const text = raw.trim()
    if (!text || busy || !hasApiKey) return
    const user: Item = { id: nextId.current++, kind: 'user', text }
    setItems(prev => [...prev, user])
    setInput('')
    setError('')
    setBusy(true)
    const history = [...items, user]
      .filter((i): i is Extract<Item, { kind: 'user' | 'assistant' }> => i.kind !== 'tool')
      .slice(-MAX_HISTORY)
      .map(i => ({ role: i.kind, content: i.text }))
    try {
      await runAgent(buildSystemPrompt(game), history, e =>
        setItems(prev => [
          ...prev,
          e.type === 'tool'
            ? { id: nextId.current++, kind: 'tool', name: e.name, result: e.result }
            : { id: nextId.current++, kind: 'assistant', text: e.text },
        ]),
      )
    } catch (e) {
      setError(String((e as Error)?.message ?? e))
    } finally {
      setBusy(false)
    }
  }, [busy, items, game])

  // "Ask the advisor" on the calculator hands over its prompt here.
  useEffect(() => {
    if (pendingPrompt) {
      clearPrompt()
      send(pendingPrompt)
    }
  }, [pendingPrompt, clearPrompt, send])

  return (
    <CutPanel cut={28} edge={edgeStrong} fill={fillLedger} style={[styles.panel, style]}>
      <Bracket style={{ right: 8, top: 8, transform: [{ scaleX: -1 }] }} />
      <Text style={styles.label}><Text style={styles.dot}>◆ </Text>The advisor</Text>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={list}
          style={styles.flex}
          data={items}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.log}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {hasApiKey
                ? 'Tell me what you carry (shells, hammers, demons, crystals), then ask what to trade.'
                : 'No LLM key. Add EXPO_PUBLIC_LLM_API_KEY to .env and reload.'}
            </Text>
          }
          renderItem={({ item }) =>
            item.kind === 'tool' ? (
              <View style={styles.tool}>
                <Text style={styles.toolName}>⚙ {item.name}</Text>
                <Text style={styles.toolBody} numberOfLines={3}>{item.result}</Text>
              </View>
            ) : (
              <View style={[styles.bubble, item.kind === 'user' ? styles.user : styles.assistant]}>
                <Text style={styles.bubbleText}>{plain(item.text)}</Text>
              </View>
            )
          }
          ListFooterComponent={busy ? <ActivityIndicator color={palette.gold} style={{ margin: 12 }} /> : undefined}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <CutPanel cut={14} edge={edgeSolve} fill={fillSolve}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask the advisor…"
              placeholderTextColor="rgba(248,232,202,.4)"
              onSubmitEditing={() => send(input)}
              editable={hasApiKey}
            />
            <Pressable onPress={() => send(input)} disabled={busy || !hasApiKey} style={{ opacity: busy || !hasApiKey ? 0.4 : 1 }}>
              <Text style={styles.sendText}>Send ➤</Text>
            </Pressable>
          </View>
        </CutPanel>
      </KeyboardAvoidingView>
    </CutPanel>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: { padding: 18, overflow: 'hidden', gap: 12 },
  label: { fontFamily: fonts.caps, fontSize: 9, letterSpacing: 3.6, textTransform: 'uppercase', color: palette.caps, ...shadow('rgba(10,3,20,.95)', 8) },
  dot: { fontSize: 10, letterSpacing: 0, color: 'rgba(243,207,130,.8)' },
  log: { gap: 10, paddingVertical: 6, flexGrow: 1 },
  empty: { fontFamily: fonts.bodyItalic, fontSize: 16, textAlign: 'center', marginTop: 30, lineHeight: 24, color: palette.textDim },
  bubble: { maxWidth: '90%', padding: 12, borderWidth: 1 },
  user: { alignSelf: 'flex-end', backgroundColor: 'rgba(110,60,150,.35)', borderColor: 'rgba(196,150,255,.5)' },
  assistant: { alignSelf: 'flex-start', backgroundColor: 'rgba(20,8,34,.7)', borderColor: 'rgba(240,208,148,.3)' },
  bubbleText: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: palette.text },
  tool: { alignSelf: 'flex-start', maxWidth: '90%', padding: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(240,208,148,.4)' },
  toolName: { fontFamily: fonts.capsSemi, fontSize: 11, letterSpacing: 1.5, color: palette.gold },
  toolBody: { fontFamily: fonts.body, fontSize: 12, marginTop: 2, color: 'rgba(250,238,216,.6)' },
  error: { color: palette.danger, fontFamily: fonts.body, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: {
    flex: 1, height: 48, color: palette.cream, fontFamily: fonts.body, fontSize: 17,
    // @ts-expect-error web only: drop the focus ring
    outlineStyle: 'none',
  },
  sendText: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#f7e6c2', paddingVertical: 12 },
})
