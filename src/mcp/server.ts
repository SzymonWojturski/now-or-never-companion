// An MCP server that runs entirely on the device, connected to an MCP client through an
// in-memory transport. No network involved: the LLM only ever sees the tool list and results.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { z } from 'zod'
import { TRADE_IDS } from '../game/trades'
import { compareTradeSets, maxCoins, maxCoinsWithTrades, rankTrades, rateSolution } from './tools'

const resourceShape = {
  shells: z.number().int().min(0),
  hammers: z.number().int().min(0),
  demons: z.number().int().min(0),
  crystals: z.number().int().min(0),
  shellFlag: z.boolean().default(false).describe('card flag: 3 shells trade gives 8 instead of 5'),
  hammerFlag: z.boolean().default(false).describe('card flag: unlocks the 3 hammers trade (10 coins)'),
}
const tradeList = z.array(z.enum(TRADE_IDS)).describe('trade ids; repeat an id to make that trade several times')

const buildServer = () => {
  const server = new McpServer({ name: 'now-or-never', version: '0.3.0' })

  const register = <S extends z.ZodRawShape>(
    name: string,
    description: string,
    inputSchema: S,
    fn: (args: z.infer<z.ZodObject<S>>) => unknown,
  ) =>
    server.registerTool(name, { description, inputSchema }, (async (args: z.infer<z.ZodObject<S>>) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(fn(args)) }],
    })) as never)

  register(
    'max_coins',
    'Maximum number of coins obtainable from the given resources, with the trades that achieve it.',
    resourceShape,
    maxCoins,
  )
  register(
    'max_coins_with_trades',
    'Maximum coins when the listed trades MUST be made (at least as many times as listed). Reports if impossible.',
    { ...resourceShape, trades: tradeList },
    maxCoinsWithTrades,
  )
  register(
    'rate_solution',
    'Rates a plan (the trades actually made; leftovers are sold singly) against the optimum. ' +
      'Returns only a verbal rating: optymalne, prawie optymalne, dobre, przeciętne or słabe.',
    { ...resourceShape, trades: tradeList },
    rateSolution,
  )
  register(
    'compare_trade_sets',
    'Checks whether also making extraTrades on top of trades makes the best achievable result worse.',
    { ...resourceShape, trades: tradeList, extraTrades: tradeList },
    compareTradeSets,
  )
  register(
    'rank_trades',
    'Compares all available trades, best first, by how much more they pay than selling the same resources one by one (multiplier and bonus). Resources have different values: a shell sells for 1, the others for 2.',
    { shellFlag: resourceShape.shellFlag, hammerFlag: resourceShape.hammerFlag },
    rankTrades,
  )

  return server
}

let clientPromise: Promise<Client> | undefined
const getClient = () => (clientPromise ??= (async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await buildServer().connect(serverTransport)
  const client = new Client({ name: 'now-or-never-companion', version: '0.1.0' })
  await client.connect(clientTransport)
  return client
})())

// MCP tools in the OpenAI function-calling format (what OpenAI-compatible providers expect).
export const listTools = async () => {
  const { tools } = await (await getClient()).listTools()
  return tools.map(t => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description ?? '', parameters: t.inputSchema },
  }))
}

export const callTool = async (name: string, args: Record<string, unknown>): Promise<string> => {
  const res = await (await getClient()).callTool({ name, arguments: args })
  const content = (res.content ?? []) as { type: string; text?: string }[]
  return content.map(c => c.text ?? '').join('\n')
}
