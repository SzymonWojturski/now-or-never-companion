// Exact integer-programming solver for the trade problem.
// Uses YALPS (pure-JS MILP solver): the HiGHS build used by the web calculator is WebAssembly,
// which Hermes does not have.
import { solve, type Model } from 'yalps'
import { activeTrades, type Flags } from './trades'

export type SolveResult =
  | { feasible: false; reason: string }
  | { feasible: true; objective: number; values: number[] }

export type SolveInput = {
  resources: number[]
  flags?: Partial<Flags>
  minCounts?: number[]
}

// Maximise coins for the given resources.
//  - every resource must be spent: the four single-resource trades absorb leftovers,
//  - `minCounts[i]` forces trade i to be made at least that many times.
export const solveTrades = ({ resources, flags, minCounts }: SolveInput): SolveResult => {
  const trades = activeTrades(flags)
  const mins = minCounts ?? trades.map(() => 0)

  const blocked = trades.find((t, i) => !t.enabled && mins[i] > 0)
  if (blocked) return { feasible: false, reason: `trade "${blocked.id}" needs a card flag that is not set` }

  const constraints: Record<string, { equal: number } | { min: number }> = {}
  resources.forEach((amount, r) => { constraints[`r${r}`] = { equal: amount } })

  const variables: Record<string, Record<string, number>> = {}
  trades.forEach((t, i) => {
    if (!t.enabled) return
    const v: Record<string, number> = { reward: t.reward }
    t.cost.forEach((c, r) => { if (c > 0) v[`r${r}`] = c })
    if (mins[i] > 0) {
      v[`min${i}`] = 1
      constraints[`min${i}`] = { min: mins[i] }
    }
    variables[`t${i}`] = v
  })

  const model: Model = { direction: 'maximize', objective: 'reward', constraints, variables, integers: true }
  const sol = solve(model)
  if (sol.status !== 'optimal') {
    return { feasible: false, reason: 'the required trades need more resources than available' }
  }
  const values = trades.map((_, i) => Math.round(sol.variables.find(([n]) => n === `t${i}`)?.[1] ?? 0))
  return { feasible: true, objective: Math.round(sol.result), values }
}
