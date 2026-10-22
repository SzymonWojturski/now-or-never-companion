# now-or-never-companion

Mobile companion app for the board game [Now or Never](https://now-or-never.rulepop.com/). An LLM calls tools on an on-device MCP server to advise the player on the game's dynamic knapsack problem.

## The game

Now or Never is a season-based town-building game scored in VP. Each season, players alternate single actions (specialist action, hero action, or pass), then resolve a production phase. Hearts, hero actions, specialist and gear slots, and goods are all limited, and the market pays more for sets of goods than for singles (1 shell = 1 coin, 3 shells = 5, one of each good = 12). Choosing what to collect, spend and sell under those constraints, with state changing every season, is a dynamic knapsack problem.

## Design

- **Client:** React Native.
- **MCP server:** runs locally on the device; no external backend. Tools help steer the player rather than only solving the knapsack:
  - knapsack solver
  - trade optimality check
  - further helpers for evaluating game state
- **LLM:** selects and calls MCP tools, then turns the results into a recommendation.
- **Haptics:** the phone vibrates on every tool call.

## MVP scope

- [ ] Game state input
- [ ] Local MCP server with knapsack solver and trade evaluation tools
- [ ] Vibration on each tool call
