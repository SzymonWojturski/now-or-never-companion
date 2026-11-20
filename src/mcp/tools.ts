// Pure game logic behind the MCP tools (no MCP / React dependencies).
import { RESOURCES, TRADES, activeTrades, type Flags, type GameInput } from '../game/trades'
import { solveTrades } from '../game/solve'

export type ToolInput = GameInput & { trades: string[]; extraTrades: string[] }

const countTrades = (ids: string[]) => {
  const counts = TRADES.map(() => 0)
  for (const id of ids) counts[TRADES.findIndex(t => t.id === id)]++
  return counts
}

// Lists the trades made, with the coins each line pays (so the model never has to multiply).
const describe = (values: number[], flags: Partial<Flags>) => {
  const trades = activeTrades(flags)
  return trades
    .map((t, i) => ({ trade: t.id, name: t.name, count: values[i], coins: values[i] * t.reward }))
    .filter(t => t.count > 0)
}

const resourcesOf = (input: GameInput) => RESOURCES.map(r => input[r])

// Maximum coins obtainable from the resources.
export const maxCoins = (input: GameInput) => {
  const res = solveTrades({ resources: resourcesOf(input), flags: input })
  return res.feasible ? { coins: res.objective, trades: describe(res.values, input) } : { error: res.reason }
}

// Maximum coins, but every trade in `trades` (repeats count) must be made at least that many times.
export const maxCoinsWithTrades = (input: GameInput & { trades: string[] }) => {
  const res = solveTrades({
    resources: resourcesOf(input),
    flags: input,
    minCounts: countTrades(input.trades),
  })
  return res.feasible
    ? { feasible: true, coins: res.objective, trades: describe(res.values, input) }
    : { feasible: false, reason: res.reason }
}

// Verbal rating thresholds: gap to the optimum in percent -> label.
const RATINGS: [number, string][] = [
  [0, 'optymalne'],
  [5, 'prawie optymalne'],
  [15, 'dobre'],
  [30, 'przeciętne'],
]
const rate = (gapPercent: number) => RATINGS.find(([max]) => gapPercent <= max)?.[1] ?? 'słabe'

// Rates a plan: `trades` are the trades actually made, anything left over is sold with single trades.
export const rateSolution = (input: GameInput & { trades: string[] }) => {
  const resources = resourcesOf(input)
  const trades = activeTrades(input)
  const counts = countTrades(input.trades)

  const disabled = trades.find((t, i) => counts[i] > 0 && !t.enabled)
  if (disabled) return { valid: false, reason: `trade "${disabled.id}" needs a card flag that is not set` }

  const left = [...resources]
  let coins = 0
  trades.forEach((t, i) => {
    coins += counts[i] * t.reward
    t.cost.forEach((c, r) => { left[r] -= counts[i] * c })
  })
  if (left.some(l => l < 0)) return { valid: false, reason: 'these trades need more resources than available' }
  left.forEach((l, r) => { coins += l * trades[r].reward }) // trades[0..3] are the single-resource trades

  const opt = solveTrades({ resources, flags: input })
  const best = opt.feasible ? opt.objective : 0
  const gap = best === 0 ? 0 : ((best - coins) / best) * 100
  return { valid: true, rating: rate(gap) }
}

// Does also being forced to make `extraTrades` (on top of `trades`) make the result worse?
export const compareTradeSets = (input: ToolInput) => {
  const base = { resources: resourcesOf(input), flags: input }
  const before = solveTrades({ ...base, minCounts: countTrades(input.trades) })
  if (!before.feasible) return { error: `the first set is not possible: ${before.reason}` }

  const after = solveTrades({ ...base, minCounts: countTrades([...input.trades, ...input.extraTrades]) })
  if (!after.feasible) return { worse: true, reason: after.reason, coinsWithout: before.objective }
  return {
    worse: after.objective < before.objective,
    coinsWithout: before.objective,
    coinsWith: after.objective,
  }
}

// Ranks the available trades, best first. Resources are not equal (a shell is worth 1 when sold,
// the others 2), so a trade is judged against selling its resources one by one:
// `multiplier` = reward / that value, `bonus` = reward - that value.
export const rankTrades = (flags: { shellFlag: boolean; hammerFlag: boolean }) => {
  const trades = activeTrades(flags)
  const single = trades.slice(0, 4).map(t => t.reward)
  return trades
    .filter(t => t.enabled)
    .map(t => {
      const soldSeparately = t.cost.reduce((a, c, r) => a + c * single[r], 0)
      return {
        trade: t.id,
        name: t.name,
        reward: t.reward,
        soldSeparately,
        multiplier: Math.round((t.reward / soldSeparately) * 100) / 100,
        bonus: t.reward - soldSeparately,
      }
    })
    .sort((a, b) => b.multiplier - a.multiplier || b.bonus - a.bonus)
}
