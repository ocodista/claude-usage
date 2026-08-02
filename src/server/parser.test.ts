import { expect, test } from "bun:test"
import {
  aggregateAssistantUsage,
  calculateCost,
  recordCostByLocalDate,
  sumCostForLocalDate,
} from "./parser"

test("records message cost on the user's local calendar day", () => {
  const costs: Record<string, number> = {}

  recordCostByLocalDate(costs, "2026-08-02T01:00:00Z", 1.25, "America/Sao_Paulo")
  recordCostByLocalDate(costs, "2026-08-02T15:00:00Z", 2.5, "America/Sao_Paulo")

  expect(costs).toEqual({
    "2026-08-01": 1.25,
    "2026-08-02": 2.5,
  })
})

test("ignores usage without a valid timestamp", () => {
  const costs: Record<string, number> = {}
  recordCostByLocalDate(costs, "", 3, "America/Sao_Paulo")
  expect(costs).toEqual({})
})

test("sums only message costs attributed to the requested local day", () => {
  const sessions: Array<{ costByLocalDate?: Record<string, number> }> = [
    { costByLocalDate: { "2026-08-01": 4, "2026-08-02": 1.5 } },
    { costByLocalDate: { "2026-08-02": 2.25 } },
    {},
  ]

  expect(sumCostForLocalDate(sessions, "2026-08-02")).toBe(3.75)
})

test("charges repeated transcript rows for one assistant message exactly once", () => {
  const usage = {
    input_tokens: 1_000,
    output_tokens: 200,
    cache_read_input_tokens: 500,
    cache_creation_input_tokens: 100,
  }
  const messages = [
    {
      type: "assistant",
      timestamp: "2026-08-02T01:59:59Z",
      message: { id: "msg-1", model: "claude-sonnet-4-5-20250929", usage },
    },
    {
      type: "assistant",
      timestamp: "2026-08-02T03:00:01Z",
      message: { id: "msg-1", model: "claude-sonnet-4-5-20250929", usage },
    },
  ]

  const result = aggregateAssistantUsage(messages, "America/Sao_Paulo")
  const expectedCost = calculateCost(
    "claude-sonnet-4-5-20250929",
    usage.input_tokens,
    usage.output_tokens,
    usage.cache_read_input_tokens,
    usage.cache_creation_input_tokens
  )

  expect(result.inputTokens).toBe(1_000)
  expect(result.outputTokens).toBe(200)
  expect(result.cacheReadTokens).toBe(500)
  expect(result.cacheWriteTokens).toBe(100)
  expect(result.costByLocalDate).toEqual({ "2026-08-01": expectedCost })
  expect(result.tokenTimeline).toHaveLength(1)
})
