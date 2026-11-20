// Single source of truth for the Market (Anytime Action) trade table.
// Order matters: it matches the `values` index returned by the solver.
export const RESOURCES = ['shells', 'hammers', 'demons', 'crystals'] as const
export type Resource = (typeof RESOURCES)[number]

export type Flags = { shellFlag: boolean; hammerFlag: boolean }
export type Resources = Record<Resource, number>
export type GameInput = Resources & Flags

export type Trade = {
  id: string
  name: string
  cost: number[]
  reward: number
  shellFlagReward?: number
  requiresFlag?: keyof Flags
}

export const TRADES: Trade[] = [
  { id: 'shell', name: '1 shell', cost: [1, 0, 0, 0], reward: 1 },
  { id: 'hammer', name: '1 hammer', cost: [0, 1, 0, 0], reward: 2 },
  { id: 'demon', name: '1 demon', cost: [0, 0, 1, 0], reward: 2 },
  { id: 'crystal', name: '1 crystal', cost: [0, 0, 0, 1], reward: 2 },
  { id: '3_shells', name: '3 shells', cost: [3, 0, 0, 0], reward: 5, shellFlagReward: 8 },
  { id: '2_hammers_1_shell', name: '2 hammers + 1 shell', cost: [1, 2, 0, 0], reward: 7 },
  { id: '2_demons_1_hammer', name: '2 demons + 1 hammer', cost: [0, 1, 2, 0], reward: 9 },
  { id: '3_crystals', name: '3 crystals', cost: [0, 0, 0, 3], reward: 11 },
  { id: 'shell_hammer_demon', name: 'shell + hammer + demon', cost: [1, 1, 1, 0], reward: 9 },
  { id: 'all_four', name: 'shell + hammer + demon + crystal', cost: [1, 1, 1, 1], reward: 12 },
  { id: '2_demons_2_crystals', name: '2 demons + 2 crystals', cost: [0, 0, 2, 2], reward: 14 },
  { id: '3_hammers', name: '3 hammers', cost: [0, 3, 0, 0], reward: 10, requiresFlag: 'hammerFlag' },
]

export const TRADE_IDS = TRADES.map(t => t.id) as [string, ...string[]]

export type ActiveTrade = Trade & { enabled: boolean }

// Rewards / availability after applying the card flags.
export const activeTrades = ({ shellFlag = false, hammerFlag = false }: Partial<Flags> = {}): ActiveTrade[] => {
  const flags = { shellFlag, hammerFlag }
  return TRADES.map(t => ({
    ...t,
    reward: shellFlag && t.shellFlagReward ? t.shellFlagReward : t.reward,
    enabled: !t.requiresFlag || flags[t.requiresFlag],
  }))
}
