# now-or-never-companion

Mobile companion app for the board game [Now or Never](https://now-or-never.rulepop.com/). An LLM calls tools on an on-device MCP server to advise the player on the game's dynamic knapsack problem.

## The game

Now or Never is a season-based town-building game scored in VP. Each season, players alternate single actions (specialist action, hero action, or pass), then resolve a production phase. Hearts, hero actions, specialist and gear slots, and goods are all limited, and the market pays more for sets of goods than for singles (1 shell = 1 coin, 3 shells = 5, one of each good = 12). Choosing what to collect, spend and sell under those constraints, with state changing every season, is a dynamic knapsack problem.

## Reference

A [standalone calculator](https://szymonwojturski.github.io/now-or-never-calculator/) gives an intuition for how the optimization works. It solves the whole problem outright, which is not the goal of this project: here the model is only meant to be guided by tools, not to replace them with a full solver.

## Design

- **Client:** React Native.
- **MCP server:** runs locally on the device; no external backend. Tools help steer the player rather than only solving the knapsack:
  - knapsack solver
  - trade optimality check
  - further helpers for evaluating game state
- **LLM:** selects and calls MCP tools, then turns the results into a recommendation.
- **Haptics:** the phone vibrates on every tool call.

## MVP scope

- [x] Game state input (GUI, tab "Torba")
- [x] Local MCP server with knapsack solver and trade evaluation tools
- [x] Vibration on each tool call (`expo-haptics`)

## Running

```
cp .env.example .env     # set EXPO_PUBLIC_LLM_API_KEY (Groq by default)
npm install --legacy-peer-deps
npx expo start --web     # or --android
```

The solver is [YALPS](https://github.com/Ivordir/YALPS) (pure JS) instead of the calculator's HiGHS, because Hermes has no WebAssembly. `EXPO_PUBLIC_*` values are inlined into the app bundle, so do not ship a private key this way.
