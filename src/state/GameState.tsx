import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { RESOURCES, type GameInput, type Resource } from '../game/trades'

export type Bargain = {
  resources: number[]
  result: number
  values: number[]
  shellFlag: boolean
  hammerFlag: boolean
}

type GameContextValue = {
  game: GameInput
  setResource: (key: Resource, value: number) => void
  setFlag: (key: 'shellFlag' | 'hammerFlag', value: boolean) => void
  emptySatchel: () => void
  solutions: Bargain[]
  addSolution: (b: Bargain) => void
  pendingPrompt: string | null
  askAdvisor: (prompt: string) => void
  clearPrompt: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

const EMPTY: GameInput = {
  shells: 0, hammers: 0, demons: 0, crystals: 0, shellFlag: false, hammerFlag: false,
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameInput>(EMPTY)
  const [solutions, setSolutions] = useState<Bargain[]>([])
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)

  const setResource = useCallback((key: Resource, value: number) => setGame(g => ({ ...g, [key]: value })), [])
  const setFlag = useCallback((key: 'shellFlag' | 'hammerFlag', value: boolean) => setGame(g => ({ ...g, [key]: value })), [])
  const emptySatchel = useCallback(
    () => setGame(g => ({ ...g, ...Object.fromEntries(RESOURCES.map(r => [r, 0])) })),
    [],
  )
  // The ledger keeps the last four bargains.
  const addSolution = useCallback((b: Bargain) => setSolutions(prev => [...prev, b].slice(-4)), [])
  const askAdvisor = useCallback((prompt: string) => setPendingPrompt(prompt), [])
  const clearPrompt = useCallback(() => setPendingPrompt(null), [])

  const value = useMemo(
    () => ({ game, setResource, setFlag, emptySatchel, solutions, addSolution, pendingPrompt, askAdvisor, clearPrompt }),
    [game, setResource, setFlag, emptySatchel, solutions, addSolution, pendingPrompt, askAdvisor, clearPrompt],
  )
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
